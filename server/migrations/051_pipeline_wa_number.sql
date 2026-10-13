-- Cada pipeline puede ir ligado a un número de WhatsApp: el botón "Conversación" de sus tarjetas
-- abre (o crea) el chat por ese número. NULL = sin preferencia (el chat más reciente del contacto).
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS wa_instance_id UUID REFERENCES wa_settings(id) ON DELETE SET NULL;
