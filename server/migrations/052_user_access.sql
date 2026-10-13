-- Acceso por usuario dentro de una organización: qué números de WhatsApp y qué pipelines ve.
-- NULL = todos. Sin fila = acceso completo. El dueño (owner) siempre ve todo.
-- social: si ve las conversaciones de Instagram / Messenger (no tienen número).
CREATE TABLE IF NOT EXISTS user_access (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wa_instance_ids UUID[],
  pipeline_ids    UUID[],
  social          BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- Etiqueta de origen: cada contacto lleva el nombre del número de WhatsApp por el que escribió
-- (lo mantiene el webhook en adelante). Solo chats con algún mensaje entrante.
UPDATE contacts c
SET tags = c.tags || ARRAY(SELECT unnest(t.names) EXCEPT SELECT unnest(c.tags))
FROM (
  SELECT cv.contact_id, array_agg(DISTINCT w.display_name) AS names
  FROM conversations cv
  JOIN wa_settings w ON w.id = cv.wa_instance_id
  WHERE cv.contact_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM conv_messages m WHERE m.conversation_id = cv.id AND m.direction = 'inbound')
  GROUP BY cv.contact_id
) t
WHERE c.id = t.contact_id AND NOT (c.tags @> t.names);
