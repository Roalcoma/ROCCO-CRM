// Envío de Web Push (VAPID) para notificaciones desde el navegador / PWA.
// Independiente del push FCM de la app nativa (services/push.ts).
// Requiere VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en el .env.
// Para generar las claves: node -e "const wp=require('web-push');console.log(wp.generateVAPIDKeys())"
import webpush from 'web-push';
import { pool } from '../db.ts';

export type WebPushPayload = { title: string; body: string; url: string; tag: string };

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject } = process.env;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject ?? 'mailto:admin@rocco.arbolaureo.org', pub, priv);
  return (configured = true);
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/** Envía a todos los dispositivos web del usuario. Borra suscripciones vencidas (404/410). */
export async function sendWebPushToUser(userId: string, payload: WebPushPayload): Promise<number> {
  if (!configure()) return 0;
  const subs = (await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [userId]
  )).rows;
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600, urgency: 'high', topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) }
      );
      sent++;
      await pool.query('UPDATE push_subscriptions SET last_used_at = now() WHERE id = $1', [s.id]);
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]);
      } else {
        console.error(JSON.stringify({ level: 'warn', msg: 'web push fallido', status }));
      }
    }
  }));
  return sent;
}
