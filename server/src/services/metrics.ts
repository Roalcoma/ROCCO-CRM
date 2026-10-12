// Métricas de Prometheus para el monitoreo del servidor (Grafana "Centro de mando"): usuarios en línea
// por organización (WebSocket), tráfico HTTP y datos de negocio por cliente.
// Se sirven en un puerto interno aparte (METRICS_PORT, 9464) que no se publica: Rocco está en internet
// por el túnel de Cloudflare y /metrics no debe quedar expuesto. Prometheus lo lee por la red crm_net.
// Nombres genéricos (saas_*) con la etiqueta app="rocco": Kora usará los mismos con app="kora".

import http from 'node:http';
import type { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { pool } from '../db.ts';
import { onlineStats } from './ws-manager.ts';

export const registry = new client.Registry();
registry.setDefaultLabels({ app: 'rocco' });
client.collectDefaultMetrics({ register: registry });

// ── HTTP ─────────────────────────────────────────────────────────────────────
const httpRequests = new client.Counter({
  name: 'saas_http_requests_total', help: 'Peticiones HTTP atendidas',
  labelNames: ['method', 'route', 'status'], registers: [registry],
});
const httpDuration = new client.Histogram({
  name: 'saas_http_request_duration_seconds', help: 'Tiempo de respuesta HTTP',
  labelNames: ['route'], buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], registers: [registry],
});

// Agrupa la ruta para que ids y tokens no disparen la cardinalidad: /api/<módulo>[/<acción>].
// Un segmento con dígitos (uuid, secreto de webhook) corta el agrupado.
const SEG = /^[a-z][a-z-]*$/;
export function routeGroup(path: string): string {
  if (!path.startsWith('/api/')) return path.startsWith('/m/') ? '/m' : 'web';
  const [mod, action] = path.slice(5).split('/');
  if (!mod || !SEG.test(mod)) return '/api/other';
  return action && SEG.test(action) ? `/api/${mod}/${action}` : `/api/${mod}`;
}

export function httpMetrics(req: Request, res: Response, next: NextFunction) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = routeGroup(req.originalUrl.split('?')[0]);
    if (route === '/api/health') return;   // el healthcheck de Docker no es tráfico real
    httpRequests.inc({ method: req.method, route, status: String(res.statusCode) });
    end({ route });
  });
  next();
}

// ── Datos de negocio (BD), cacheados 60 s ────────────────────────────────────
interface OrgStats {
  name: string; users: number; active7d: boolean; failedRuns24h: number;
  messages24h: { inbound: number; outbound: number };
  whatsapp: { instance: string; connected: boolean }[];
}
const CACHE_MS = 60_000;
let cache: { at: number; orgs: Map<string, OrgStats> } = { at: 0, orgs: new Map() };
let lastError = 0;

async function loadBusiness(): Promise<Map<string, OrgStats>> {
  const [orgs, users, msgs, runs, active, wa] = await Promise.all([
    pool.query<{ id: string; name: string }>('SELECT id, name FROM organizations'),
    pool.query<{ organization_id: string; n: string }>(
      `SELECT organization_id, count(DISTINCT user_id) AS n FROM (
         SELECT id AS user_id, organization_id FROM users
         UNION SELECT user_id, organization_id FROM user_organizations) t GROUP BY 1`),
    pool.query<{ organization_id: string; direction: string; n: string }>(
      `SELECT organization_id, direction, count(*) AS n FROM conv_messages
       WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY 1, 2`),
    pool.query<{ organization_id: string; n: string }>(
      `SELECT organization_id, count(*) AS n FROM automation_runs
       WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '24 hours' GROUP BY 1`),
    pool.query<{ organization_id: string }>(
      `SELECT organization_id FROM activity_feed WHERE created_at > NOW() - INTERVAL '7 days'
       UNION SELECT organization_id FROM crm_audit_log WHERE created_at > NOW() - INTERVAL '7 days'`),
    pool.query<{ organization_id: string; instance: string; session_status: string }>(
      `SELECT organization_id, COALESCE(NULLIF(display_name, ''), instance_name, id::text) AS instance, session_status
       FROM wa_settings`),
  ]);
  const out = new Map<string, OrgStats>();
  for (const o of orgs.rows) {
    out.set(o.id, { name: o.name, users: 0, active7d: false, failedRuns24h: 0,
      messages24h: { inbound: 0, outbound: 0 }, whatsapp: [] });
  }
  for (const r of users.rows) { const o = out.get(r.organization_id); if (o) o.users = Number(r.n); }
  for (const r of msgs.rows) {
    const o = out.get(r.organization_id);
    if (o && (r.direction === 'inbound' || r.direction === 'outbound')) o.messages24h[r.direction] = Number(r.n);
  }
  for (const r of runs.rows) { const o = out.get(r.organization_id); if (o) o.failedRuns24h = Number(r.n); }
  for (const r of active.rows) { const o = out.get(r.organization_id); if (o) o.active7d = true; }
  for (const r of wa.rows) {
    out.get(r.organization_id)?.whatsapp.push({ instance: r.instance, connected: r.session_status === 'connected' });
  }
  return out;
}

// Una sola carga por ventana aunque varias métricas la pidan en el mismo scrape. Si la BD falla se
// sirven los últimos valores y se marca el error: un fallo de BD no debe parecer la app caída.
let inflight: Promise<Map<string, OrgStats>> | null = null;
async function business(): Promise<Map<string, OrgStats>> {
  if (Date.now() - cache.at < CACHE_MS) return cache.orgs;
  inflight ??= loadBusiness()
    .then(orgs => { cache = { at: Date.now(), orgs }; lastError = 0; return orgs; })
    .catch(err => { console.error('[metrics] error leyendo la BD:', (err as Error).message); lastError = 1; return cache.orgs; })
    .finally(() => { inflight = null; });
  return inflight;
}

const orgName = (orgs: Map<string, OrgStats>, id: string) => orgs.get(id)?.name ?? id;

function gauge(name: string, help: string, labelNames: string[],
               fill: (g: client.Gauge, orgs: Map<string, OrgStats>) => void) {
  new client.Gauge({
    name, help, labelNames, registers: [registry],
    async collect() { const orgs = await business(); this.reset(); fill(this, orgs); },
  });
}

// ── En línea (memoria del proceso) ───────────────────────────────────────────
gauge('saas_users_online', 'Usuarios distintos con la app abierta (WebSocket conectado)', ['org'], (g, orgs) => {
  for (const [id, s] of onlineStats()) g.set({ org: orgName(orgs, id) }, s.users);
});
gauge('saas_ws_connections', 'Conexiones WebSocket abiertas (pestañas/dispositivos)', ['org'], (g, orgs) => {
  for (const [id, s] of onlineStats()) g.set({ org: orgName(orgs, id) }, s.connections);
});

// ── Negocio ──────────────────────────────────────────────────────────────────
gauge('saas_organizations', 'Organizaciones (clientes) registradas', [], (g, orgs) => g.set(orgs.size));
gauge('saas_org_users', 'Usuarios por organización', ['org'], (g, orgs) => {
  for (const o of orgs.values()) g.set({ org: o.name }, o.users);
});
gauge('saas_org_active_7d', '1 si la organización tuvo actividad en los últimos 7 días', ['org'], (g, orgs) => {
  for (const o of orgs.values()) g.set({ org: o.name }, o.active7d ? 1 : 0);
});
gauge('saas_messages_24h', 'Mensajes de WhatsApp de las últimas 24 h', ['org', 'direction'], (g, orgs) => {
  for (const o of orgs.values()) {
    g.set({ org: o.name, direction: 'inbound' }, o.messages24h.inbound);
    g.set({ org: o.name, direction: 'outbound' }, o.messages24h.outbound);
  }
});
gauge('saas_automation_failures_24h', 'Ejecuciones de automatizaciones fallidas en 24 h', ['org'], (g, orgs) => {
  for (const o of orgs.values()) g.set({ org: o.name }, o.failedRuns24h);
});
gauge('saas_whatsapp_connected', '1 si la instancia de WhatsApp está conectada', ['org', 'instance'], (g, orgs) => {
  for (const o of orgs.values()) for (const w of o.whatsapp) g.set({ org: o.name, instance: w.instance }, w.connected ? 1 : 0);
});
gauge('saas_metrics_db_error', '1 si la última lectura de la BD para métricas falló', [], g => g.set(lastError));

// ── Servidor interno ─────────────────────────────────────────────────────────
export function startMetricsServer(port = Number(process.env.METRICS_PORT ?? 9464)): http.Server {
  const srv = http.createServer((req, res) => {
    if (req.url !== '/metrics') { res.writeHead(404).end(); return; }
    registry.metrics()
      .then(body => { res.writeHead(200, { 'Content-Type': registry.contentType }); res.end(body); })
      .catch(err => { res.writeHead(500).end(String(err)); });
  });
  srv.on('error', err => console.error('[metrics] no se pudo abrir el puerto', port, (err as Error).message));
  srv.listen(port);
  return srv;
}
