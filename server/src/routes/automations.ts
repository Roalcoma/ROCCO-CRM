import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db.ts';
import { requireAdmin } from '../auth/perms.ts';
import { accessOf, canUseNumber, canUsePipeline, type Access } from '../access.ts';

export const automationsRouter = Router();

// Acceso por número / pipeline (access.ts): una regla es del equipo que ve su número (disparador) y
// los pipelines donde crea leads; las de Instagram, de quien ve Instagram. Las demás, de todos.
type RuleCfg = { trigger?: { wa_instance_id?: string }; steps?: { pipeline_id?: string }[] };
function ruleVisible(a: Access, triggerType: string, config: unknown): boolean {
  const cfg = (config ?? {}) as RuleCfg;
  const wa = cfg.trigger?.wa_instance_id;
  if (wa && !canUseNumber(a, wa)) return false;
  if (triggerType === 'ig_comment_received' && !a.social) return false;
  return (cfg.steps ?? []).every(st => !st.pipeline_id || canUsePipeline(a, st.pipeline_id));
}

automationsRouter.param('id', async (req, res, next, id: string) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return next();
    const r = await queryOne<{ trigger_type: string; config: unknown }>(
      'SELECT trigger_type, config FROM automation_rules WHERE id = $1 AND organization_id = $2', [id, req.auth!.organizationId]);
    if (r && !ruleVisible(accessOf(req), r.trigger_type, r.config)) return res.status(404).json({ error: 'Automatización no encontrada' });
    next();
  } catch (e) { next(e); }
});

// Validación de la config: solo se comprueban los campos con reglas (el resto de cada paso se conserva tal cual).
// send_whatsapp acepta un adjunto: media_id (de automation_media de la org) y media_type opcional.
const stepSchema = z.object({
  id:         z.string().optional(),
  type:       z.string().min(1),
  media_id:   z.string().uuid().nullable().optional(),
  media_type: z.enum(['video', 'image']).nullable().optional(),
}).passthrough();
const configSchema = z.object({ steps: z.array(stepSchema).optional() }).passthrough();

// Devuelve la config validada o responde 400 (y devuelve null)
async function parseConfig(req: Request, res: Response, config: unknown): Promise<Record<string, unknown> | null> {
  const parsed = configSchema.safeParse(config ?? {});
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return null; }
  if (!ruleVisible(accessOf(req), String(req.body?.trigger_type ?? ''), parsed.data)) {
    res.status(403).json({ error: 'La automatización usa un número o un pipeline al que no tienes acceso' }); return null;
  }
  const mediaIds = [...new Set((parsed.data.steps ?? []).map(s => s.media_id).filter((m): m is string => !!m))];
  if (mediaIds.length) {
    const found = await query<{ id: string }>(
      'SELECT id FROM automation_media WHERE id = ANY($1::uuid[]) AND organization_id = $2',
      [mediaIds, req.auth!.organizationId],
    );
    if (found.length !== mediaIds.length) { res.status(400).json({ error: 'El archivo adjunto no pertenece a tu cuenta' }); return null; }
  }
  return parsed.data;
}

// GET / — list automation rules for this org
automationsRouter.get('/', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, trigger_type, name, description, enabled, run_count, last_run_at, config, created_at, updated_at
       FROM automation_rules
       WHERE organization_id = $1
       ORDER BY created_at ASC`,
      [req.auth!.organizationId],
    );
    const a = accessOf(req);
    res.json(rows.filter(r => ruleVisible(a, r.trigger_type, r.config)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al cargar automatizaciones' });
  }
});

// POST / — crear nueva automatización (admin only)
automationsRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, trigger_type, config } = req.body as {
      name?: string;
      description?: string;
      trigger_type?: string;
      config?: unknown;
    };
    if (!name || !trigger_type) {
      return res.status(400).json({ error: 'Campos name y trigger_type son requeridos' });
    }
    const cfg = await parseConfig(req, res, config);
    if (!cfg) return;
    const row = await queryOne(
      `INSERT INTO automation_rules (organization_id, name, description, trigger_type, config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.auth!.organizationId, name, description ?? null, trigger_type, JSON.stringify(cfg)],
    );
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear automatización' });
  }
});

// GET /:id — obtener una automatización por id
automationsRouter.get('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      `SELECT id, trigger_type, name, description, enabled, run_count, last_run_at, config, created_at, updated_at
       FROM automation_rules
       WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.auth!.organizationId],
    );
    if (!row) return res.status(404).json({ error: 'Automatización no encontrada' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al cargar automatización' });
  }
});

// PATCH /:id — toggle enabled or update config (admin only)
automationsRouter.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body as { enabled?: boolean };
    if (enabled === undefined) return res.status(400).json({ error: 'Campo enabled requerido' });

    const row = await queryOne(
      `UPDATE automation_rules
       SET enabled = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [enabled, id, req.auth!.organizationId],
    );
    if (!row) return res.status(404).json({ error: 'Automatización no encontrada' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar automatización' });
  }
});

// PUT /:id — reemplazar config completa (admin only)
automationsRouter.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, trigger_type, config, enabled } = req.body as {
      name?: string;
      description?: string;
      trigger_type?: string;
      config?: unknown;
      enabled?: boolean;
    };
    if (!name || !trigger_type) {
      return res.status(400).json({ error: 'Campos name y trigger_type son requeridos' });
    }
    const cfg = await parseConfig(req, res, config);
    if (!cfg) return;
    const row = await queryOne(
      `UPDATE automation_rules
       SET name = $1, description = $2, trigger_type = $3, config = $4,
           enabled = COALESCE($5, enabled), updated_at = NOW()
       WHERE id = $6 AND organization_id = $7
       RETURNING *`,
      [name, description ?? null, trigger_type, JSON.stringify(cfg),
       enabled ?? null, id, req.auth!.organizationId],
    );
    if (!row) return res.status(404).json({ error: 'Automatización no encontrada' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar automatización' });
  }
});

// DELETE /:id — eliminar automatización (admin only)
automationsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `DELETE FROM automation_rules WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, req.auth!.organizationId],
    );
    if (!row) return res.status(404).json({ error: 'Automatización no encontrada' });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar automatización' });
  }
});
