/**
 * Smoke test de verificación pre-despliegue PRD (sin BD).
 * Cubre los puntos del checklist de DEPLOYMENT.md verificables sin MySQL.
 */
const request = require('supertest');

// Aislar NODE_ENV para este proceso sin afectar a otros tests
const ORIGINAL_ENV = { ...process.env };

afterAll(() => {
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
  process.env.ENABLE_SWAGGER = ORIGINAL_ENV.ENABLE_SWAGGER;
  process.env.CLIENT_URL = ORIGINAL_ENV.CLIENT_URL;
  // Limpiar cache de app para recargar con cada configuración
  jest.resetModules();
});

describe('Smoke PRD — health y seguridad', () => {
  it('GET /health → 200 { status: ok, service: prachub-api }', async () => {
    const app = require('../src/app');
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'prachub-api' });
  });

  it('production sin ENABLE_SWAGGER → /api-docs responde 404', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_SWAGGER;
    const app = require('../src/app');
    const res = await request(app).get('/api-docs');
    expect(res.status).toBe(404);
  });

  it('CORS permite el origen configurado en CLIENT_URL', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://prachub-client.vercel.app';
    const app = require('../src/app');
    const res = await request(app)
      .options('/health')
      .set('Origin', 'https://prachub-client.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBe('https://prachub-client.vercel.app');
  });

  it('CORS rechaza un origen no permitido', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://prachub-client.vercel.app';
    const app = require('../src/app');
    const res = await request(app)
      .options('/health')
      .set('Origin', 'https://evil.example.com');
    // Helmet/CORS responde sin reflejar el origen malicioso
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });
});
