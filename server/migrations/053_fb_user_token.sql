-- Token de usuario de Meta (cifrado) guardado al conectar Facebook: el de página no puede consultar
-- las cuentas publicitarias, y hace falta para encontrar los anuncios de Instagram y leer sus comentarios.
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS user_access_token TEXT;
