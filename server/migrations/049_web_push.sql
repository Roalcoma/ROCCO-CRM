-- Suscripciones Web Push (VAPID) para notificaciones desde el navegador / PWA.
-- Independiente de push_tokens (FCM, app nativa). Un usuario puede tener N suscripciones
-- (un endpoint por navegador/dispositivo). Las suscripciones vencidas se borran automáticamente
-- al enviar (404/410 de la API de push).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  user_agent   TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
