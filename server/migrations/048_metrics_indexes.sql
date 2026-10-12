-- Métricas del monitoreo (services/metrics.ts): mensajes de WhatsApp de las últimas 24 h de todas las
-- organizaciones. Sin este índice, cada lectura de Prometheus (cada 60 s) recorre conv_messages entero.
CREATE INDEX IF NOT EXISTS conv_messages_created_idx ON conv_messages (created_at);
