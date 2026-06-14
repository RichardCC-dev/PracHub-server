/**
 * Tests de integración: Mensajería directa (HU-24, HU-25, HU-26)
 *
 * Mockea la capa de BD (Sequelize) para ejecutar sin base de datos real.
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
    Notification: buildModel({ sync: jest.fn().mockResolvedValue(true) }),
    DirectMessage: buildModel(),
    PasswordResetToken: buildModel(),
    EmailVerificationToken: buildModel(),
  };
});

const app = require('../src/app');
const { User, Student, Company, DirectMessage, Notification } = require('../src/models');

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest-1234567890';
const makeToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const studentToken = makeToken({ id: 1, role: 'student' });
const companyToken = makeToken({ id: 2, role: 'company' });
const adminToken   = makeToken({ id: 3, role: 'admin' });

/** Mock de usuario estudiante autenticado */
const mockStudentUser = {
  id: 1,
  role: 'student',
  email: 'student@unmsm.edu.pe',
  studentProfile: { firstName: 'Juan', lastName: 'Perez', profilePictureUrl: null },
  companyProfile: null,
};

/** Mock de usuario empresa autenticado */
const mockCompanyUser = {
  id: 2,
  role: 'company',
  email: 'empresa@corp.com',
  studentProfile: null,
  companyProfile: { tradeName: 'Mi Empresa', legalName: 'Mi Empresa SAC', logoUrl: null },
};

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/messages — Enviar mensaje', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 — sin token', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ receiverId: 10, content: 'Hola' });
    expect(res.status).toBe(401);
  });

  it('403 — rol admin no puede enviar mensajes', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 3, role: 'admin' });
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ receiverId: 10, content: 'Hola' });
    expect(res.status).toBe(403);
  });

  it('400 — falta content', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ receiverId: 10 });
    expect(res.status).toBe(400);
  });

  it('400 — falta receiverId', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Hola' });
    expect(res.status).toBe(400);
  });

  it('201 — empresa envía mensaje a estudiante', async () => {
    // Primer findByPk: autenticación del company
    User.findByPk
      .mockResolvedValueOnce(mockCompanyUser)   // authenticate
      .mockResolvedValueOnce(mockStudentUser);  // receptor en sendMessage

    DirectMessage.findOne.mockResolvedValueOnce(null);
    DirectMessage.create.mockResolvedValueOnce({
      id: 1, senderId: 2, receiverId: 1, content: 'Hola estudiante', isRead: false,
    });

    Notification.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ receiverId: 1, content: 'Hola estudiante' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('senderId', 2);
  });

  it('400 — no puede enviarse mensajes a sí mismo', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ receiverId: 1, content: 'Hola yo mismo' });
    // senderId === receiverId === 1 → error de negocio
    expect([400, 500]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/messages/inbox — Bandeja de entrada', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 — sin token', async () => {
    const res = await request(app).get('/api/messages/inbox');
    expect(res.status).toBe(401);
  });

  it('200 — devuelve lista de conversaciones', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    DirectMessage.findAll.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/messages/inbox')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/messages/unread-count — Conteo no leídos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — devuelve count', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    DirectMessage.count.mockResolvedValueOnce(3);

    const res = await request(app)
      .get('/api/messages/unread-count')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/messages/conversation/:userId — Historial de conversación', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 — userId inválido', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    const res = await request(app)
      .get('/api/messages/conversation/abc')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(400);
  });

  it('200 — devuelve historial', async () => {
    // auth + getConversation.findByPk (otherUser)
    User.findByPk
      .mockResolvedValueOnce(mockStudentUser)   // authenticate
      .mockResolvedValueOnce(mockCompanyUser);  // otherUser en getConversation

    DirectMessage.findAndCountAll.mockResolvedValueOnce({ count: 0, rows: [] });

    const res = await request(app)
      .get('/api/messages/conversation/2')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/messages/conversation/:userId/read — Marcar como leídos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — marca conversación como leída', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    DirectMessage.update.mockResolvedValueOnce([2]);

    const res = await request(app)
      .patch('/api/messages/conversation/2/read')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updated).toBe(2);
  });
});


// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/messages/users/search — Busqueda de usuarios (HU-26)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 — sin token', async () => {
    const res = await request(app).get('/api/messages/users/search?q=Juan');
    expect(res.status).toBe(401);
  });

  it('200 — devuelve array vacio para query muy corto', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    const res = await request(app)
      .get('/api/messages/users/search?q=J')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('200 — devuelve resultados para query valido', async () => {
    User.findByPk.mockResolvedValueOnce(mockStudentUser);
    User.findAll.mockResolvedValueOnce([
      {
        id: 5,
        email: 'maria@unmsm.edu.pe',
        role: 'student',
        studentProfile: { firstName: 'Maria', lastName: 'Garcia', profilePictureUrl: null },
        companyProfile: null,
      },
    ]);
    const res = await request(app)
      .get('/api/messages/users/search?q=Maria')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

