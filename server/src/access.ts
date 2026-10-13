// Acceso por usuario (tabla user_access): qué números de WhatsApp y qué pipelines ve dentro de la
// organización. Separa equipos en un mismo CRM (p. ej. Ventas con el número 2 y Reclutamiento con el 1).
// null = todos. El dueño (owner) siempre ve todo. Se carga con la sesión (caché de session.ts).
//
// Reglas de visibilidad para un usuario restringido:
//   conversación  → su número está permitido; Instagram/Messenger (sin número) solo con `social`
//   oportunidad   → su pipeline está permitido
//   contacto      → tiene alguna oportunidad o conversación visible, o no tiene ninguna de las dos
//                   (alta manual, CSV…); es decir, se oculta el que solo es de otro equipo
import type { Request } from 'express';
import { queryOne } from './db.ts';

export interface Access {
  wa: string[] | null;        // números permitidos (null = todos)
  pipelines: string[] | null; // pipelines permitidos (null = todos)
  social: boolean;            // ve Instagram / Messenger
}

export const FULL_ACCESS: Access = { wa: null, pipelines: null, social: true };

export async function loadAccess(userId: string, orgId: string, role: string): Promise<Access> {
  if (role === 'owner') return FULL_ACCESS;
  const row = await queryOne<{ wa_instance_ids: string[] | null; pipeline_ids: string[] | null; social: boolean }>(
    'SELECT wa_instance_ids, pipeline_ids, social FROM user_access WHERE user_id = $1 AND organization_id = $2',
    [userId, orgId],
  );
  if (!row) return FULL_ACCESS;
  return { wa: row.wa_instance_ids, pipelines: row.pipeline_ids, social: row.social };
}

export const accessOf = (req: Request): Access => req.auth?.access ?? FULL_ACCESS;
export const isRestricted = (a: Access) => a.wa !== null || a.pipelines !== null || !a.social;

// ── Fragmentos SQL (" AND …") que añaden sus parámetros a `vals` ─────────────

// Conversaciones (alias de la tabla conversations)
export function convScope(a: Access, alias: string, vals: unknown[]): string {
  if (a.wa === null && a.social) return '';
  vals.push(a.wa ?? null);
  const p = `$${vals.length}`;
  const waOk = `(${p}::uuid[] IS NULL OR ${alias}.wa_instance_id = ANY(${p}::uuid[]))`;
  const isWa = `(${alias}.channel IS NULL OR ${alias}.channel = 'whatsapp')`;
  return a.social
    ? ` AND (NOT ${isWa} OR ${waOk})`
    : ` AND ${isWa} AND ${waOk}`;
}

// Oportunidades (columna de pipeline, p. ej. "o.pipeline_id")
export function pipelineScope(a: Access, col: string, vals: unknown[]): string {
  if (a.pipelines === null) return '';
  vals.push(a.pipelines);
  return ` AND ${col} = ANY($${vals.length}::uuid[])`;
}

// Contactos (columna del id del contacto, p. ej. "c.id")
export function contactScope(a: Access, col: string, vals: unknown[]): string {
  if (!isRestricted(a)) return '';
  const oppOk = pipelineScope(a, 'o2.pipeline_id', vals);
  const convOk = convScope(a, 'cv2', vals);
  return ` AND (
    EXISTS (SELECT 1 FROM opportunities o2 WHERE o2.contact_id = ${col}${oppOk})
    OR EXISTS (SELECT 1 FROM conversations cv2 WHERE cv2.contact_id = ${col}${convOk})
    OR (NOT EXISTS (SELECT 1 FROM opportunities o3 WHERE o3.contact_id = ${col})
        AND NOT EXISTS (SELECT 1 FROM conversations cv3 WHERE cv3.contact_id = ${col})))`;
}

// ── Comprobaciones puntuales ─────────────────────────────────────────────────
export const canUseNumber = (a: Access, id: string | null | undefined) => a.wa === null || (!!id && a.wa.includes(id));
export const canUsePipeline = (a: Access, id: string | null | undefined) => a.pipelines === null || (!!id && a.pipelines.includes(id));
export function canSeeConversation(a: Access, conv: { channel?: string | null; wa_instance_id?: string | null }): boolean {
  const isWa = !conv.channel || conv.channel === 'whatsapp';
  return isWa ? canUseNumber(a, conv.wa_instance_id) : a.social;
}
