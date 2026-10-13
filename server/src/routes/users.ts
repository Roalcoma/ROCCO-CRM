import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { query, queryOne } from '../db.ts';
import { hashPassword } from '../auth/password.ts';
import { requireAdmin, MODULES } from '../auth/perms.ts';
import { invalidateUser } from '../auth/session.ts';
import { accessOf, isRestricted } from '../access.ts';
import type { Request } from 'express';

export const usersRouter = Router();

const permsSchema = z.array(z.enum(MODULES)).optional();

interface UserRow {
  id: string; name: string; email: string; role: string;
  permissions: string[]; created_at: string;
  wa_instance_ids?: string[] | null; pipeline_ids?: string[] | null; social?: boolean | null;
}
// access: números y pipelines que ve (null = todos); ver access.ts
const publicUser = (u: UserRow) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  permissions: u.permissions ?? [], created_at: u.created_at,
  access: { wa_instance_ids: u.wa_instance_ids ?? null, pipeline_ids: u.pipeline_ids ?? null, social: u.social ?? true },
});

// Columnas del acceso de cada usuario en la org de la petición ($1 = organization_id)
const USER_COLS = `u.id, u.name, u.email, u.role, u.permissions, u.created_at, ua.wa_instance_ids, ua.pipeline_ids, ua.social`;
const USER_FROM = `users u LEFT JOIN user_access ua ON ua.user_id = u.id AND ua.organization_id = $1`;

// Acceso a números / pipelines. null = todos.
const accessSchema = z.object({
  wa_instance_ids: z.array(z.string().uuid()).nullable(),
  pipeline_ids: z.array(z.string().uuid()).nullable(),
  social: z.boolean(),
}).optional();
type AccessInput = z.infer<typeof accessSchema>;

// Guarda el acceso de un usuario. Solo lo cambia quien ve todo (un admin limitado no se amplía a sí
// mismo ni a otros). Los ids deben ser de la org. Devuelve un error o null.
async function saveAccess(req: Request, userId: string, a: AccessInput): Promise<string | null> {
  if (a === undefined) return null;
  if (isRestricted(accessOf(req))) return 'Tu acceso está limitado: solo un administrador con acceso completo puede cambiar el de otros';
  const orgId = req.auth!.organizationId;
  if (a.wa_instance_ids?.length) {
    const n = await queryOne<{ n: number }>('SELECT count(*)::int AS n FROM wa_settings WHERE organization_id = $1 AND id = ANY($2::uuid[])', [orgId, a.wa_instance_ids]);
    if (n?.n !== new Set(a.wa_instance_ids).size) return 'Número de WhatsApp no válido';
  }
  if (a.pipeline_ids?.length) {
    const n = await queryOne<{ n: number }>('SELECT count(*)::int AS n FROM pipelines WHERE organization_id = $1 AND id = ANY($2::uuid[])', [orgId, a.pipeline_ids]);
    if (n?.n !== new Set(a.pipeline_ids).size) return 'Pipeline no válido';
  }
  if (a.wa_instance_ids === null && a.pipeline_ids === null && a.social) {
    await query('DELETE FROM user_access WHERE user_id = $1 AND organization_id = $2', [userId, orgId]);
  } else {
    await query(
      `INSERT INTO user_access (user_id, organization_id, wa_instance_ids, pipeline_ids, social)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, organization_id) DO UPDATE
         SET wa_instance_ids = EXCLUDED.wa_instance_ids, pipeline_ids = EXCLUDED.pipeline_ids,
             social = EXCLUDED.social, updated_at = now()`,
      [userId, orgId, a.wa_instance_ids, a.pipeline_ids, a.social],
    );
  }
  return null;
}
const userById = (orgId: string, id: string) =>
  queryOne<UserRow>(`SELECT ${USER_COLS} FROM ${USER_FROM} WHERE u.id = $2`, [orgId, id]);

// Límite de usuarios según el plan asignado por la agencia. plans.max_users son usuarios
// extra además del owner (>= 999 = ilimitado) + usuarios de cortesía. Sin plan → sin límite.
export async function userLimit(orgId: string) {
  const row = await queryOne<{ used: number; max_users: number | null; courtesy: number | null }>(
    `SELECT (SELECT count(*)::int FROM users WHERE organization_id = $1) AS used,
            p.max_users, ac.courtesy_extra_users AS courtesy
     FROM (SELECT 1) x
     LEFT JOIN agency_clients ac ON ac.organization_id = $1
     LEFT JOIN plans p ON p.id = ac.plan_id
     ORDER BY ac.created_at LIMIT 1`,
    [orgId],
  );
  const used = row?.used ?? 0;
  if (row?.max_users == null || row.max_users >= 999) return { used, max: null as number | null };
  return { used, max: 1 + row.max_users + (row.courtesy ?? 0) };
}

usersRouter.get('/limit', async (req, res) => {
  res.json(await userLimit(req.auth!.organizationId));
});

// Lista de usuarios de la organización (disponible para cualquier autenticado:
// el select de "Responsable" la usa). Incluye permisos para la pantalla de ajustes.
usersRouter.get('/', async (req, res) => {
  const orgId = req.auth!.organizationId;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Number(req.query.limit) || 100, 100);

  let rows: UserRow[];
  if (q) {
    rows = await query<UserRow>(
      `SELECT ${USER_COLS} FROM ${USER_FROM}
       WHERE u.organization_id = $1 AND (u.name ILIKE $2 OR u.email ILIKE $2)
       ORDER BY u.name LIMIT $3`,
      [orgId, `%${q}%`, limit],
    );
  } else {
    rows = await query<UserRow>(
      `SELECT ${USER_COLS} FROM ${USER_FROM} WHERE u.organization_id = $1 ORDER BY u.created_at LIMIT $2`,
      [orgId, limit],
    );
  }
  res.json(rows.map(publicUser));
});

// ── Crear usuario (solo admin) ────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'member']),
  permissions: permsSchema,
  access: accessSchema,
});

usersRouter.post('/', requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { name, email, password, role, permissions } = parsed.data;

  const existing = await queryOne('SELECT id FROM users WHERE lower(email) = $1', [email]);
  if (existing) return res.status(409).json({ error: 'Ese email ya está registrado' });

  // Aplica también a la agencia impersonando: el límite se amplía cambiando plan o cortesía.
  const { used, max } = await userLimit(req.auth!.organizationId);
  if (max !== null && used >= max) {
    return res.status(409).json({
      error: `Tu plan permite ${max} usuario${max === 1 ? '' : 's'} y ya tienes ${used}. Pide a tu agencia ampliar el plan para añadir más.`,
    });
  }

  // La contraseña la define el admin: el usuario debe cambiarla al entrar.
  const hash = await hashPassword(password);
  const [u] = await query<UserRow>(
    `INSERT INTO users (organization_id, name, email, password_hash, role, permissions, must_change_password)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,true) RETURNING id, name, email, role, permissions, created_at`,
    [req.auth!.organizationId, name, email, hash, role, JSON.stringify(permissions ?? [])],
  );
  const accessError = await saveAccess(req, u.id, parsed.data.access);
  if (accessError) return res.status(201).json({ ...publicUser(u), warning: accessError });
  res.status(201).json(publicUser((await userById(req.auth!.organizationId, u.id)) ?? u));
});

// ── Editar usuario (solo admin) ───────────────────────────────────────────────
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'member']).optional(),
  permissions: permsSchema,
  password: z.string().min(8).optional(),
  access: accessSchema,
});

usersRouter.patch('/:id', requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const orgId = req.auth!.organizationId;

  const target = await queryOne<{ role: string }>('SELECT role FROM users WHERE id=$1 AND organization_id=$2', [req.params.id, orgId]);
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  const isSelf = req.auth!.userId === req.params.id;
  const isAgency = req.auth!.impersonatedByAgency === true;
  if (target.role === 'owner' && !isSelf && !isAgency) return res.status(403).json({ error: 'No se puede modificar al owner' });

  const sets: string[] = [];
  const values: unknown[] = [];
  const d = parsed.data;
  if (d.name !== undefined) { sets.push(`name = $${sets.length + 1}`); values.push(d.name); }
  if (target.role !== 'owner') {
    if (d.role !== undefined) { sets.push(`role = $${sets.length + 1}`); values.push(d.role); }
    if (d.permissions !== undefined) { sets.push(`permissions = $${sets.length + 1}::jsonb`); values.push(JSON.stringify(d.permissions)); }
  }
  if (d.password !== undefined) {
    sets.push(`password_hash = $${sets.length + 1}`); values.push(await hashPassword(d.password));
    // Si la cambia otro (admin/agencia), es temporal: obligar a cambiarla al entrar
    // y cerrar las sesiones que tuviera abiertas.
    sets.push(`must_change_password = $${sets.length + 1}`); values.push(!isSelf);
    if (!isSelf) sets.push('token_version = token_version + 1');
  }
  // Acceso a números / pipelines (el owner siempre ve todo)
  const wantsAccess = d.access !== undefined && target.role !== 'owner';
  if (sets.length === 0 && !wantsAccess) return res.status(400).json({ error: 'Nada que actualizar' });
  if (wantsAccess) {
    const accessError = await saveAccess(req, req.params.id as string, d.access);
    if (accessError) return res.status(isRestricted(accessOf(req)) ? 403 : 400).json({ error: accessError });
  }

  if (sets.length) {
    await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length + 1} AND organization_id = $${values.length + 2}`,
      [...values, req.params.id, orgId],
    );
  }
  invalidateUser(req.params.id as string);   // rol/permisos/acceso/sesiones nuevos ya, sin esperar la caché
  res.json(publicUser((await userById(orgId, req.params.id as string))!));
});

// ── Restablecer contraseña (solo admin) ───────────────────────────────────────
// Define (o genera) una contraseña temporal, la devuelve UNA vez y obliga a cambiarla.
// No hay correo: el admin se la pasa al usuario por su cuenta.
const resetSchema = z.object({ password: z.string().min(8).optional() });

usersRouter.post('/:id/reset-password', requireAdmin, async (req, res) => {
  const parsed = resetSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const orgId = req.auth!.organizationId;
  const target = await queryOne<{ role: string }>('SELECT role FROM users WHERE id=$1 AND organization_id=$2', [req.params.id, orgId]);
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (req.params.id === req.auth!.userId) return res.status(400).json({ error: 'Cambia tu propia contraseña desde Mi perfil' });
  if (target.role === 'owner' && req.auth!.impersonatedByAgency !== true) {
    return res.status(403).json({ error: 'No se puede modificar al owner' });
  }
  const password = parsed.data.password ?? randomBytes(9).toString('base64url');
  // token_version+1: cierra todas las sesiones abiertas de ese usuario
  await query('UPDATE users SET password_hash=$1, must_change_password=true, token_version=token_version+1 WHERE id=$2 AND organization_id=$3',
    [await hashPassword(password), req.params.id, orgId]);
  invalidateUser(req.params.id as string);
  res.json({ password });
});

// ── Eliminar usuario (solo admin; no a sí mismo ni al owner) ──────────────────
usersRouter.delete('/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.auth!.userId) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  const target = await queryOne<{ role: string }>('SELECT role FROM users WHERE id=$1 AND organization_id=$2', [req.params.id, req.auth!.organizationId]);
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (target.role === 'owner') return res.status(403).json({ error: 'No se puede eliminar al owner' });
  await query('DELETE FROM users WHERE id=$1 AND organization_id=$2', [req.params.id, req.auth!.organizationId]);
  invalidateUser(req.params.id as string);   // su token deja de valer en la siguiente petición
  res.status(204).end();
});
