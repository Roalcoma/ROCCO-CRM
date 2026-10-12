// Métricas de Prometheus (services/metrics.ts): usuarios en línea por organización, tráfico HTTP
// agrupado por ruta y que /metrics NO se sirva en el puerto público.
// NUNCA contra producción: crea una organización y un usuario de prueba directo en la BD.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { hashPassword } from '../src/auth/password.ts';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3202';
if (BASE.includes('rocco.arbolaureo.org')) throw new Error('No correr los tests contra producción');
const METRICS = `http://localhost:${process.env.METRICS_PORT ?? '9474'}/metrics`;
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const stamp = Date.now();
const orgName = `Métricas ${stamp}`;
let orgId: string;
let token: string;

before(async () => {
  orgId = (await db.query('INSERT INTO organizations (name) VALUES ($1) RETURNING id', [orgName])).rows[0].id;
  const userId = (await db.query(
    `INSERT INTO users (organization_id, email, password_hash, name, role) VALUES ($1,$2,$3,'Métricas','owner') RETURNING id`,
    [orgId, `metrics-${stamp}@test.local`, await hashPassword('metricas-123')],
  )).rows[0].id;
  token = jwt.sign({ userId, organizationId: orgId, role: 'owner' }, process.env.JWT_SECRET!, { expiresIn: '10m' });
});

after(async () => {
  await db.query('DELETE FROM organizations WHERE id = $1', [orgId]).catch(() => {});
  await db.end();
});

async function metrics(): Promise<string> {
  const r = await fetch(METRICS);
  assert.equal(r.status, 200);
  return r.text();
}
// Valor de una serie: metric{...org="X"...} 3
function value(text: string, name: string, org: string): number | null {
  const line = text.split('\n').find(l => l.startsWith(`${name}{`) && l.includes(`org="${org}"`));
  return line ? Number(line.split(' ').pop()) : null;
}
async function until<T>(what: string, fn: () => Promise<T | null | false>, ms = 5000): Promise<T> {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v !== null && v !== false) return v;
    if (Date.now() - t0 > ms) throw new Error(`Tiempo agotado esperando: ${what}`);
    await new Promise(r => setTimeout(r, 100));
  }
}
async function openWs(): Promise<WebSocket> {
  const r = await fetch(`${BASE}/api/ws-ticket`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  const ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}/ws?ticket=${(await r.json()).ticket}`);
  await new Promise<void>((ok, ko) => {
    ws.onmessage = e => { if (JSON.parse(String(e.data)).type === 'connected') ok(); };
    ws.onerror = () => ko(new Error('WS no conectó'));
  });
  return ws;
}

test('métricas: /metrics no se sirve en el puerto público', async () => {
  const body = await (await fetch(`${BASE}/metrics`)).text();
  assert.ok(!body.includes('saas_'), 'el puerto público expone métricas');
  const text = await metrics();
  assert.match(text, /saas_organizations\{app="rocco"\} \d+/);
  assert.match(text, /nodejs_eventloop_lag_seconds/);
});

test('métricas: HTTP agrupa la ruta (ids fuera) y no cuenta el healthcheck', async () => {
  await fetch(`${BASE}/api/contacts`);                                              // 401 sin sesión
  await fetch(`${BASE}/api/contacts/6f1c2a4e-0000-4000-8000-000000000000`);         // id → mismo grupo
  await fetch(`${BASE}/api/health`);
  const text = await metrics();
  const line = text.split('\n').find(l =>
    l.startsWith('saas_http_requests_total{') && l.includes('route="/api/contacts"') && l.includes('status="401"'));
  assert.ok(line && Number(line.split(' ').pop()) >= 2, `falta la serie de /api/contacts 401:\n${line}`);
  assert.ok(!text.includes('6f1c2a4e'), 'un id se coló en las etiquetas');
  assert.ok(!text.includes('route="/api/health"'), 'el healthcheck se cuenta como tráfico');
});

test('métricas: usuarios en línea cuenta personas, no pestañas', async () => {
  const a = await openWs();
  const b = await openWs();   // mismo usuario, segunda pestaña
  const text = await until('dos conexiones', async () => {
    const t = await metrics();
    return value(t, 'saas_ws_connections', orgName) === 2 ? t : null;
  });
  assert.equal(value(text, 'saas_users_online', orgName), 1);
  assert.equal(value(text, 'saas_org_users', orgName), 1);

  a.close(); b.close();
  await until('sin conexiones', async () => value(await metrics(), 'saas_users_online', orgName) === null);
});
