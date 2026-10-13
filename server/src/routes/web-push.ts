// Rutas Web Push VAPID: suscribir/desuscribir dispositivos y enviar notificación de prueba.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.ts';
import { pool } from '../db.ts';
import { vapidPublicKey, sendWebPushToUser } from '../services/webpush.ts';

export const webPushRouter = Router();

const Subscription = z.object({
  endpoint: z.string().url().max(2000).refine((u) => u.startsWith('https://'), 'Endpoint debe ser https'),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth:   z.string().min(10).max(100),
  }),
});

webPushRouter.get('/push/vapid-key', (_req, res) => {
  const key = vapidPublicKey();
  if (!key) return res.status(503).json({ error: 'Las notificaciones push no están configuradas' });
  res.json({ publicKey: key });
});

webPushRouter.post('/me/push-subscriptions', requireAuth, async (req, res) => {
  const s = Subscription.parse(req.body);
  const userId = req.auth!.userId;
  // Si el mismo navegador estaba suscrito con otra cuenta, reasignarlo
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id <> $2', [s.endpoint, userId]);
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`,
    [userId, s.endpoint, s.keys.p256dh, s.keys.auth, String(req.headers['user-agent'] ?? '').slice(0, 300)]
  );
  res.status(204).end();
});

webPushRouter.post('/me/push-unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = z.object({ endpoint: z.string().max(2000) }).parse(req.body);
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [endpoint, req.auth!.userId]);
  res.status(204).end();
});

webPushRouter.post('/me/push-test', requireAuth, async (req, res) => {
  const sent = await sendWebPushToUser(req.auth!.userId, {
    title: 'Rocco CRM',
    body: 'Las notificaciones funcionan en este dispositivo.',
    url: '/',
    tag: 'test',
  });
  if (!sent) return res.status(404).json({ error: 'Este dispositivo no tiene notificaciones activas' });
  res.status(204).end();
});
