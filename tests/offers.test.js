/**
 * Tests de integración: Flujo de Ofertas
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../src/models', () => {
  const buildModel = (overrides = {}) => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    ...overrides,
  });

  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
      transaction: jest.fn((cb) => cb({})),
      Sequelize: { Op: require('sequelize').Op },
    },
    User: buildModel(),
    Student: buildModel(),
    Company: buildModel(),
    Offer: buildModel(),
    Application: buildModel(),
    Notification: buildModel({ sync: jest.fn().mockResolvedValue(true) }),
    PasswordResetToken: buildModel(),
    EmailVerificationToken: buildModel(),
  };
});

jest.mock('../src/services/emailService', () => ({
  sendOfferApprovedNotification: jest.fn().mockResolvedValue({}),
  sendOfferRejectedNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/services/alertService', () => ({
  processNewOffer: jest.fn().mockResolvedValue({ alertsSent: 0, totalProcessed: 0 }),
}));

const app = require('../src/app');
const { Offer, User, Student, Company } = require('../src/models');

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest-1234567890';

const makeToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const companyToken  = makeToken({ id: 1, email: 'empresa@test.com', role: 'company' });
const studentToken  = makeToken({ id: 2, email: 'student@test.com', role: 'student' });

// Mock del user de empresa que devuelve authMiddleware
const mockCompanyUser = {
  id: 1,
  email: 'empresa@test.com',
  role: 'company',
  studentProfile: null,
  companyProfile: { id: 10, userId: 1, legalName: 'TechCo', canPublishOffers: true },
};

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/offers — Listar ofertas públicas (sin auth)', () => {
  it('200 — lista ofertas aprobadas', async () => {
    Offer.findAll.mockResolvedValue([
      {
        id: 1,
        title: 'Practicante de Desarrollo',
        status: 'approved',
        company: { id: 1, legalName: 'TechCo', logoUrl: null },
        toJSON: function () { return this; },
      },
    ]);

    const res = await request(app).get('/api/offers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/offers/:offerId — Detalle público de oferta (sin auth)', () => {
  beforeEach(() => {
    // authMiddleware llama a User.findByPk
    User.findByPk.mockResolvedValue(mockCompanyUser);
  });

  it('404 — sin token y oferta no encontrada', async () => {
    Offer.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/offers/1');
    expect(res.status).toBe(404);
  });

  it('404 — oferta no encontrada', async () => {
    Offer.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/offers/1')
      .set('Authorization', `Bearer ${companyToken}`);

    expect(res.status).toBe(404);
  });

  it('200 — retorna detalle de oferta aprobada', async () => {
    Offer.findOne.mockResolvedValue({
      id: 1,
      title: 'Practicante Backend',
      status: 'approved',
      company: { id: 1, legalName: 'TechCo' },
      toJSON: function () { return this; },
    });

    const res = await request(app)
      .get('/api/offers/1')
      .set('Authorization', `Bearer ${companyToken}`);

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/offers — Crear oferta', () => {
  const validOffer = {
    title: 'Practicante Backend',
    description: 'Desarrollo de APIs REST con Node.js y Express para proyectos internos.',
    requirements: 'Conocimientos de JavaScript y bases de datos relacionales.',
    modality: 'remoto',
    duration: '3 meses',
    area: 'Tecnología',
    careerTags: ['Ingeniería de Sistemas'],
  };

  it('401 — sin token', async () => {
    const res = await request(app).post('/api/offers').send(validOffer);
    expect(res.status).toBe(401);
  });

  it('403 — token de estudiante no puede crear oferta', async () => {
    User.findByPk.mockResolvedValue({
      id: 2,
      email: 'student@test.com',
      role: 'student',
      studentProfile: { id: 10 },
      companyProfile: null,
    });

    const res = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validOffer);

    expect([403, 401]).toContain(res.status);
  });
});
