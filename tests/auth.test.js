/**
 * Tests de integración: Flujo de Autenticación
 * Mockea la capa de BD (Sequelize) para ejecutar sin base de datos real.
 * NOTA: Los rate limiters están desactivados en tests (ver tests/setup.js).
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');

// ── Mocks de Sequelize y modelos ─────────────────────────────────────────────
jest.mock('../src/models', () => {
  const buildModel = (overrides = {}) => ({
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
    PasswordResetToken: buildModel(),
    EmailVerificationToken: buildModel(),
    Notification: buildModel({ sync: jest.fn().mockResolvedValue(true) }),
  };
});

jest.mock('../src/services/emailService', () => ({
  sendEmailVerificationEmail: jest.fn().mockResolvedValue({}),
  sendWelcomeEmail: jest.fn().mockResolvedValue({}),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
  sendAdminLoginAlert: jest.fn().mockResolvedValue({}),
}));

const app = require('../src/app');
const { User, Student } = require('../src/models');

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  const endpoint = '/api/auth/login';

  it('400 — campos faltantes', async () => {
    const res = await request(app).post(endpoint).send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('401 — usuario no encontrado', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post(endpoint)
      .send({ email: 'noexiste@test.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrectos/i);
  });

  it('401 — contraseña incorrecta', async () => {
    const passwordHash = await bcrypt.hash('OtraPassword1', 12);
    User.findOne.mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      passwordHash,
      role: 'student',
      authProvider: 'local',
      isEmailVerified: true,
      studentProfile: null,
    });

    const res = await request(app)
      .post(endpoint)
      .send({ email: 'user@test.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });

  it('200 — login exitoso de estudiante', async () => {
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 12);

    User.findOne.mockResolvedValue({
      id: 1,
      email: 'student@test.com',
      passwordHash,
      role: 'student',
      authProvider: 'local',
      isEmailVerified: true,
      studentProfile: {
        id: 10,
        firstName: 'Juan',
        lastName: 'Pérez',
        university: 'UNMSM',
        career: 'Sistemas',
        cycle: '7',
        availability: 'Mañanas',
      },
    });

    const res = await request(app)
      .post(endpoint)
      .send({ email: 'student@test.com', password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('student');
  });

  it('401 — rol incorrecto en el portal (empresa intenta login como estudiante)', async () => {
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 12);

    User.findOne.mockResolvedValue({
      id: 5,
      email: 'empresa@test.com',
      passwordHash,
      role: 'company',
      authProvider: 'local',
      isEmailVerified: true,
      studentProfile: null,
    });

    const res = await request(app)
      .post(endpoint)
      .send({ email: 'empresa@test.com', password, role: 'student' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/estudiante/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/students/register', () => {
  const endpoint = '/api/auth/students/register';

  const validPayload = {
    email: 'newstudent@unmsm.edu.pe',
    password: 'Password123',
    firstName: 'Ana',
    lastName: 'García',
    career: 'Ingeniería de Sistemas',
    cycle: '5',
    availability: 'Tardes',
  };

  it('400 — email inválido', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ ...validPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('400 — contraseña débil (sin mayúsculas)', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ ...validPayload, password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('409 — email ya registrado', async () => {
    User.findOne.mockResolvedValue({ id: 1, email: validPayload.email });

    const res = await request(app).post(endpoint).send(validPayload);
    expect(res.status).toBe(409);
  });

  it('201 — registro exitoso', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 2,
      email: validPayload.email,
      role: 'student',
      authProvider: 'local',
      isEmailVerified: false,
    });
    Student.create.mockResolvedValue({
      id: 20,
      userId: 2,
      firstName: validPayload.firstName,
      lastName: validPayload.lastName,
      university: 'UNMSM',
      career: validPayload.career,
      cycle: validPayload.cycle,
      availability: validPayload.availability,
    });

    const res = await request(app).post(endpoint).send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.message).toMatch(/completado/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  const endpoint = '/api/auth/forgot-password';

  it('400 — email inválido', async () => {
    const res = await request(app).post(endpoint).send({ email: 'bad' });
    expect(res.status).toBe(400);
  });

  it('200 — respuesta genérica si el email no existe (seguridad anti-enumeración)', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post(endpoint)
      .send({ email: 'noexiste@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/enviaremos/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Rate Limiter middleware — unidad', () => {
  it('globalApiLimiter exporta como función middleware', () => {
    // En tests el limiter es un passthrough; en producción sería el limiter real.
    // Este test verifica que el módulo exporte funciones con la firma correcta.
    const rl = require('../src/middlewares/rateLimit');
    expect(typeof rl.globalApiLimiter).toBe('function');
    expect(typeof rl.loginLimiter).toBe('function');
    expect(typeof rl.registerLimiter).toBe('function');
    expect(typeof rl.aiImproveLimiter).toBe('function');
    expect(typeof rl.adminLoginLimiter).toBe('function');
  });
});
