/**
 * Tests de integración: Flujo de Postulaciones
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
    Resume: buildModel(),
    ResumeVersion: buildModel(),
    Notification: buildModel({ sync: jest.fn().mockResolvedValue(true) }),
    PasswordResetToken: buildModel(),
    EmailVerificationToken: buildModel(),
  };
});

jest.mock('../src/services/emailService', () => ({
  sendApplicationConfirmation: jest.fn().mockResolvedValue({}),
  sendNewApplicationNotification: jest.fn().mockResolvedValue({}),
}));

const app = require('../src/app');
const { Application, Student, Offer, Resume, User } = require('../src/models');

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest-1234567890';
const makeToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const studentToken = makeToken({ id: 2, email: 'student@test.com', role: 'student' });
const companyToken = makeToken({ id: 1, email: 'empresa@test.com', role: 'company' });

// Objetos de usuario que devuelve authMiddleware (User.findByPk)
const mockStudentUser = {
  id: 2,
  email: 'student@test.com',
  role: 'student',
  studentProfile: { id: 10, userId: 2 },
  companyProfile: null,
};

const mockCompanyUser = {
  id: 1,
  email: 'empresa@test.com',
  role: 'company',
  studentProfile: null,
  companyProfile: { id: 5, userId: 1, legalName: 'TechCo' },
};

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/applications/my-applications', () => {
  it('401 — sin token', async () => {
    const res = await request(app).get('/api/applications/my-applications');
    expect(res.status).toBe(401);
  });

  it('200 — retorna postulaciones del estudiante', async () => {
    User.findByPk.mockResolvedValue(mockStudentUser);
    Student.findOne.mockResolvedValue({ id: 10, userId: 2 });
    Application.findAll.mockResolvedValue([
      {
        id: 1,
        offerId: 5,
        studentId: 10,
        status: 'enviada',
        appliedAt: new Date(),
        offer: { id: 5, title: 'Practicante', company: { legalName: 'TechCo' } },
        resume: { completionPercentage: 80 },
        toJSON: function () { return this; },
      },
    ]);

    const res = await request(app)
      .get('/api/applications/my-applications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/applications — Postular a oferta', () => {
  it('401 — sin token', async () => {
    const res = await request(app).post('/api/applications').send({ offerId: 1 });
    expect(res.status).toBe(401);
  });

  it('403 — empresa no puede postular', async () => {
    User.findByPk.mockResolvedValue(mockCompanyUser);

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ offerId: 1 });

    expect([401, 403]).toContain(res.status);
  });

  it('409 — ya postulado a la misma oferta', async () => {
    User.findByPk.mockResolvedValue(mockStudentUser);
    Student.findOne.mockResolvedValue({ id: 10, userId: 2 });
    Offer.findOne.mockResolvedValue({ id: 1, status: 'approved', companyId: 5 });
    Resume.findOne.mockResolvedValue({ id: 100, completionPercentage: 70 });
    Application.findOne.mockResolvedValue({ id: 99, offerId: 1, studentId: 10 });

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ offerId: 1 });

    expect([400, 409]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/applications/offer/:offerId — Postulantes de oferta (empresa)', () => {
  it('401 — sin token', async () => {
    const res = await request(app).get('/api/applications/offer/1');
    expect(res.status).toBe(401);
  });

  it('403 — estudiante no puede ver postulantes de oferta', async () => {
    User.findByPk.mockResolvedValue(mockStudentUser);

    const res = await request(app)
      .get('/api/applications/offer/1')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('200 — empresa puede ver postulantes de su oferta', async () => {
    User.findByPk.mockResolvedValue(mockCompanyUser);
    Offer.findOne.mockResolvedValue({
      id: 1,
      companyId: 5,
      company: { id: 5, userId: 1 },
    });
    Application.findAll.mockResolvedValue([
      {
        id: 1,
        studentId: 10,
        offerId: 1,
        status: 'enviada',
        student: { firstName: 'Ana', lastName: 'García' },
        toJSON: function () { return this; },
      },
    ]);

    const res = await request(app)
      .get('/api/applications/offer/1')
      .set('Authorization', `Bearer ${companyToken}`);

    expect(res.status).toBe(200);
  });
});
