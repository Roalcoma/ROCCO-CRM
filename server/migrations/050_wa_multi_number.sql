-- Varios números de WhatsApp por organización: cada conversación pertenece al número por el que
-- entró (un mismo cliente que escribe a dos números tiene dos conversaciones) y las respuestas y
-- automatizaciones salen por ese número. Cada número lleva un color para distinguirlo en la bandeja.

-- Color de cada número (paleta de categorías de Kora), por orden de alta dentro de la organización
ALTER TABLE wa_settings ADD COLUMN IF NOT EXISTS color TEXT;
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY organization_id ORDER BY is_default DESC, created_at) AS rn
  FROM wa_settings
)
UPDATE wa_settings w
SET color = (ARRAY['#2F5D8A','#5B4B8A','#0F6E6E','#A3246B','#9A4A00','#1E7F4F'])[((r.rn - 1) % 6) + 1]
FROM ranked r
WHERE r.id = w.id AND w.color IS NULL;

-- Número de cada conversación de WhatsApp (NULL en Instagram / Messenger)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS wa_instance_id UUID REFERENCES wa_settings(id) ON DELETE SET NULL;

-- Las conversaciones existentes se asignan al número principal de su organización
UPDATE conversations c
SET wa_instance_id = d.id
FROM (
  SELECT DISTINCT ON (organization_id) id, organization_id
  FROM wa_settings
  ORDER BY organization_id, is_default DESC, created_at
) d
WHERE c.organization_id = d.organization_id
  AND c.channel = 'whatsapp'
  AND c.wa_instance_id IS NULL;

-- Unicidad por número: (org, número, chat). NULLS NOT DISTINCT para que Instagram/Messenger
-- (sin número) sigan siendo únicos por chat.
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_organization_id_wa_chat_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_org_instance_chat_key
  ON conversations (organization_id, wa_instance_id, wa_chat_id) NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS conversations_instance_idx ON conversations (organization_id, wa_instance_id, last_message_at DESC NULLS LAST);

-- Número por el que debe enviar cada ejecución de automatización (el del chat que la disparó)
ALTER TABLE automation_runs ADD COLUMN IF NOT EXISTS wa_instance_id UUID REFERENCES wa_settings(id) ON DELETE SET NULL;
