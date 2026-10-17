// Procesamiento de comentarios de Instagram: por polling (Standard Access) o por webhook
// (requiere Advanced Access). Ambos caminos pasan por handleIgComment, que deduplica.

import { pool } from '../db.ts';
import { igBase } from './instagram.ts';
import { fireIgCommentTrigger } from './automation-engine.ts';
import { notify, leadAudience } from './notify.ts';
import { fetchWithTimeout } from '../http.ts';

type Conn = {
  id: string;
  organization_id: string;
  access_token: string;
  instagram_business_id: string | null;
  page_id: string;
};

export type IgComment = {
  id: string;
  text?: string;
  username?: string;
  from?: { id: string; username?: string; name?: string };
  media?: { id: string };
};

// Caption del post (para su palabra clave "Comenta CAMBIO…"). Caché en memoria: los captions casi no cambian.
const captionCache = new Map<string, { caption: string; at: number }>();
async function mediaCaption(conn: Conn, mediaId: string): Promise<string> {
  if (!mediaId) return '';
  const hit = captionCache.get(mediaId);
  if (hit && Date.now() - hit.at < 6 * 60 * 60_000) return hit.caption;
  try {
    const r = await get<{ caption?: string }>(`${igBase(conn.access_token)}/${mediaId}?fields=caption&access_token=${conn.access_token}`);
    if (r.error) throw new Error(r.error.message);
    captionCache.set(mediaId, { caption: r.caption ?? '', at: Date.now() });
    return r.caption ?? '';
  } catch (e) {
    console.error(`[ig-comments] no se pudo leer el caption de ${mediaId}: ${(e as Error).message}`);
    return '';
  }
}

// Devuelve true si el comentario era nuevo y se disparó el trigger.
export async function handleIgComment(conn: Conn, c: IgComment, mediaId?: string): Promise<boolean> {
  const ins = await pool.query(
    `INSERT INTO ig_processed_comments (comment_id, connection_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING RETURNING comment_id`,
    [c.id, conn.id],
  );
  if (!ins.rowCount) return false;

  const username = c.from?.username ?? c.username ?? c.from?.name ?? '';
  const media = mediaId ?? c.media?.id ?? '';
  console.log(`[ig-comments] nuevo comentario ${c.id} de @${username} (org ${conn.organization_id})`);
  await fireIgCommentTrigger(conn.organization_id, {
    commentId: c.id,
    senderId: c.from?.id ?? '',
    senderName: username,
    text: c.text ?? '',
    mediaId: media,
    caption: await mediaCaption(conn, media),
    accessToken: conn.access_token,
    igUserId: conn.instagram_business_id ?? conn.page_id,
    connectionId: conn.id,
  });
  return true;
}

// La conexión a Meta desde el servidor tiene cortes intermitentes (ETIMEDOUT): un reintento.
const get = async <T>(url: string): Promise<T & { error?: { message: string; code?: number } }> => {
  try {
    return await (await fetchWithTimeout(url)).json();
  } catch {
    await new Promise(r => setTimeout(r, 3000));
    return (await fetchWithTimeout(url)).json();
  }
};

// Límite de llamadas de Meta (códigos 4, 17, 32, 613): seguir llamando lo empeora. La cuenta afectada
// se salta durante unos ciclos de polling, el doble cada vez que se repite (máx. ~1 h con ciclos de 2 min).
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613]);
const MAX_SKIP_CYCLES = 30;
const backoff = new Map<string, { skip: number; strikes: number }>();

export function isRateLimitError(err: { code?: number } | undefined | null): boolean {
  return !!err && RATE_LIMIT_CODES.has(Number(err.code));
}

// Comentarios más viejos que esto no se procesan por polling: Meta solo deja mandar la respuesta privada
// (el DM) hasta 7 días después del comentario, y la marca de "procesado" (ig_processed_comments) se
// borra a los 30 días (retention.ts). Debe ser menor que esa retención o un comentario viejo se repetiría.
export const IG_COMMENT_MAX_AGE_DAYS = 14;

// Los comentarios de anuncios solo se procesan si tienen menos de esto: es la ventana en que Meta
// deja mandar el DM, y evita que el primer ciclo dispare el bot sobre semanas de comentarios viejos.
export const IG_AD_COMMENT_MAX_AGE_DAYS = 7;

// Los anuncios no salen en /me/media: se buscan en las cuentas publicitarias con el token de usuario
// guardado al conectar Facebook (ads_management). Caché por organización: la API de anuncios es más estricta.
const FB_GRAPH = `${process.env.META_GRAPH_URL ?? 'https://graph.facebook.com'}/v21.0`;
const AD_MEDIA_TTL_MS = 30 * 60_000;
const adMediaCache = new Map<string, { ids: string[]; at: number }>();
export async function adMediaIds(orgId: string): Promise<string[]> {
  const hit = adMediaCache.get(orgId);
  if (hit && Date.now() - hit.at < AD_MEDIA_TTL_MS) return hit.ids;
  const { rows } = await pool.query<{ user_access_token: string }>(
    `SELECT user_access_token FROM social_connections
     WHERE organization_id = $1 AND platform = 'facebook' AND status = 'active' AND user_access_token IS NOT NULL`,
    [orgId],
  );
  const ids = new Set<string>();
  for (const { user_access_token: ut } of rows) {
    const accts = await get<{ data?: { id: string }[] }>(`${FB_GRAPH}/me/adaccounts?fields=id&limit=50&access_token=${ut}`);
    if (accts.error) { console.error(`[ig-comments] cuentas publicitarias (org ${orgId}): ${accts.error.message}`); continue; }
    for (const a of accts.data ?? []) {
      const status = encodeURIComponent('["ACTIVE"]');
      const ads = await get<{ data?: { creative?: { effective_instagram_media_id?: string } }[] }>(
        `${FB_GRAPH}/${a.id}/ads?fields=creative{effective_instagram_media_id}&effective_status=${status}&limit=100&access_token=${ut}`,
      );
      if (ads.error) { console.error(`[ig-comments] anuncios de ${a.id}: ${ads.error.message}`); continue; }
      for (const ad of ads.data ?? []) if (ad.creative?.effective_instagram_media_id) ids.add(ad.creative.effective_instagram_media_id);
    }
  }
  adMediaCache.set(orgId, { ids: [...ids], at: Date.now() });
  if (ids.size) console.log(`[ig-comments] org ${orgId}: ${ids.size} anuncio(s) activo(s) con publicación de Instagram`);
  return [...ids];
}

// Filtra por organización (tests); sin argumento recorre todas las conexiones activas.
export async function pollIgComments(orgId?: string): Promise<void> {
  const { rows } = await pool.query<Conn & { comments_polled_at: Date | null }>(
    `SELECT id, organization_id, access_token, instagram_business_id, page_id, comments_polled_at
     FROM social_connections WHERE platform = 'instagram' AND status = 'active'
       AND ($1::uuid IS NULL OR organization_id = $1)`,
    [orgId ?? null],
  );

  for (const conn of rows) {
    // En pausa por límite de llamadas de Meta
    const wait = backoff.get(conn.id);
    if (wait && wait.skip > 0) { wait.skip--; continue; }

    // Primer poll: fijar la línea base y no disparar sobre comentarios viejos.
    if (!conn.comments_polled_at) {
      await pool.query(`UPDATE social_connections SET comments_polled_at = NOW() WHERE id = $1`, [conn.id]);
      console.log(`[ig-comments] línea base fijada para conexión ${conn.id}`);
      continue;
    }
    const rateLimited = (err: { code?: number; message: string } | undefined) => {
      if (!isRateLimitError(err)) return false;
      const strikes = (backoff.get(conn.id)?.strikes ?? 0) + 1;
      const skip = Math.min(2 ** (strikes - 1), MAX_SKIP_CYCLES);
      backoff.set(conn.id, { skip, strikes });
      console.warn(`[ig-comments] Meta limitó las llamadas de la conexión ${conn.id} (código ${err!.code}): se pausa ${skip} ciclo(s)`);
      return true;
    };
    try {
      const base = igBase(conn.access_token);
      const t = conn.access_token;
      const owner = conn.instagram_business_id ?? conn.page_id;
      const me = await get<{ username?: string }>(`${base}/${t.startsWith('IG') ? 'me' : owner}?fields=username&access_token=${t}`);
      if (rateLimited(me.error)) continue;
      if (me.username) {
        await pool.query(`UPDATE social_connections SET username = $1 WHERE id = $2 AND username IS DISTINCT FROM $1`, [me.username, conn.id]);
      }
      const media = await get<{ data?: { id: string; timestamp: string }[] }>(
        `${base}/${t.startsWith('IG') ? 'me' : owner}/media?fields=id,timestamp&limit=10&access_token=${t}`,
      );
      if (rateLimited(media.error)) continue;
      if (media.error) { console.error(`[ig-comments] media error conexión ${conn.id}:`, media.error.message); continue; }

      // Publicaciones del perfil + publicaciones de los anuncios activos de la organización.
      // Un anuncio puede ser de otra cuenta de Instagram de la misma organización: si este token
      // no puede leerlo, Meta devuelve error y se salta en silencio.
      const ownIds = new Set((media.data ?? []).map(m => m.id));
      const adIds = (await adMediaIds(conn.organization_id).catch((e) => {
        console.error(`[ig-comments] anuncios org ${conn.organization_id}: ${(e as Error).message}`);
        return [] as string[];
      })).filter(id => !ownIds.has(id));
      const targets = [...ownIds].map(id => ({ id, ad: false })).concat(adIds.map(id => ({ id, ad: true })));

      let fired = 0;
      let limited = false;
      for (const m of targets) {
        const comments = await get<{ data?: (IgComment & { timestamp: string })[] }>(
          `${base}/${m.id}/comments?fields=id,text,timestamp,username,from&limit=50&access_token=${t}`,
        );
        if (rateLimited(comments.error)) { limited = true; break; }
        if (comments.error) {
          if (!m.ad) console.error(`[ig-comments] comments error media ${m.id}:`, comments.error.message);
          continue;
        }
        for (const c of comments.data ?? []) {
          const age = Date.now() - new Date(c.timestamp).getTime();
          if (m.ad) {
            if (age > IG_AD_COMMENT_MAX_AGE_DAYS * 24 * 60 * 60_000) continue;
          } else if (new Date(c.timestamp) <= conn.comments_polled_at) continue;
          if (age > IG_COMMENT_MAX_AGE_DAYS * 24 * 60 * 60_000) continue;
          const author = c.from?.username ?? c.username;
          if (author && author === me.username) continue; // respuestas propias
          if (await handleIgComment(conn, c, m.id)) fired++;
        }
      }
      if (!limited) backoff.delete(conn.id);   // ciclo completo sin límite: se olvidan las pausas
      if (fired) console.log(`[ig-comments] conexión ${conn.id}: ${fired} comentario(s) procesado(s)`);
    } catch (e) {
      console.error(`[ig-comments] error en conexión ${conn.id}: ${(e as Error).message} ${(e as Error).cause ?? ''}`);
    }
  }
}

// ── Teléfono dejado por DM ────────────────────────────────────────────────────
// El DM del flujo de comentarios invita a dejar el teléfono si no hay horario que
// sirva. Cuando la respuesta trae un número, se guarda en el contacto, se anota en
// su oportunidad abierta más reciente y se avisa al equipo.

const PHONE_RE = /\+?\d[\d\s().-]{5,18}\d/;

export function extractPhone(text: string): string | null {
  const m = text.match(PHONE_RE);
  if (!m) return null;
  const digits = m[0].replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return (m[0].trim().startsWith('+') ? '+' : '') + digits;
}

export async function findIgContact(orgId: string, igsid: string) {
  const { rows } = await pool.query<{ id: string; first_name: string | null; last_name: string | null; phone: string | null }>(
    `SELECT id, first_name, last_name, phone FROM contacts WHERE organization_id = $1 AND ig_sender_id = $2 LIMIT 1`,
    [orgId, igsid],
  );
  return rows[0] ?? null;
}

export async function captureIgPhone(orgId: string, igsid: string, text: string): Promise<void> {
  const phone = extractPhone(text);
  if (!phone) return;
  const contact = await findIgContact(orgId, igsid);
  if (!contact) return;

  if (!contact.phone) {
    await pool.query(`UPDATE contacts SET phone = $1, updated_at = NOW() WHERE id = $2`, [phone, contact.id]);
  }
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || igsid;

  const opp = await pool.query<{ id: string }>(
    `SELECT id FROM opportunities WHERE organization_id = $1 AND contact_id = $2 AND status = 'open'
     ORDER BY created_at DESC LIMIT 1`,
    [orgId, contact.id],
  );
  if (opp.rows[0]) {
    await pool.query(
      `INSERT INTO opportunity_notes (organization_id, opportunity_id, body, author_name) VALUES ($1, $2, $3, 'Instagram')`,
      [orgId, opp.rows[0].id, `Dejó su teléfono por DM de Instagram: ${phone}`],
    );
  }

  // Es un lead caliente: al responsable de su oportunidad (+ admins) o a todos si no tiene
  await notify({
    orgId, audience: await leadAudience(orgId, contact.id, opp.rows[0]?.id), type: 'new_lead', bellType: 'automation',
    title: `${name} dejó su teléfono`, body: `Por DM de Instagram: ${phone}. Contáctalo lo antes posible.`,
    entityType: 'contact', entityId: contact.id,
    data: { contactId: contact.id, opportunityId: opp.rows[0]?.id },
  });
  console.log(`[ig-comments] teléfono capturado para contacto ${contact.id}`);
}
