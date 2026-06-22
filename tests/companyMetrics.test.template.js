/**
 * Tests para Company Metrics Controller
 * 
 * Corre con: npm test (desde server/)
 * 
 * ✅ Casos de prueba:
 * 1. Obtener métricas sin autenticación (401)
 * 2. Obtener métricas sin rol de empresa (403)
 * 3. Obtener métricas exitosamente (200)
 * 4. Distribución correcta por carrera
 * 5. Distribución correcta por universidad
 * 6. Crecimiento de seguidores en 30 días
 */

// Configuración: Esta es una guía de implementación

// ❌ SIN IMPLEMENTAR AÚN (Agregar en server/src/tests/companyMetrics.test.js)

// const request = require('supertest');
// const app = require('../app');
// const { User, Company, Student, SavedCompany, sequelize } = require('../models');
// const jwt = require('jsonwebtoken');

// describe('Company Metrics Controller', () => {
//   let companyToken;
//   let studentToken;
//   let companyId;
//   let studentId;

//   beforeAll(async () => {
//     // Crear usuario empresa de prueba
//     const company = await User.create({
//       email: 'company@test.com',
//       passwordHash: 'fake-hash',
//       role: 'company',
//     });
//     const comp = await Company.create({ userId: company.id });
//     companyId = comp.id;

//     companyToken = jwt.sign(
//       { id: company.id, role: 'company' },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     // Crear usuario estudiante de prueba
//     const student = await User.create({
//       email: 'student@test.com',
//       passwordHash: 'fake-hash',
//       role: 'student',
//     });
//     const stud = await Student.create({
//       userId: student.id,
//       firstName: 'Test',
//       lastName: 'Student',
//       career: 'Ingeniería',
//       university: 'UPCH',
//     });
//     studentId = stud.id;

//     studentToken = jwt.sign(
//       { id: student.id, role: 'student' },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );
//   });

//   afterAll(async () => {
//     await sequelize.close();
//   });

//   describe('GET /api/company-metrics/followers', () => {
//     test('debe rechazar sin autenticación (401)', async () => {
//       const res = await request(app).get('/api/company-metrics/followers');
//       expect(res.status).toBe(401);
//     });

//     test('debe rechazar si usuario no es empresa (403)', async () => {
//       const res = await request(app)
//         .get('/api/company-metrics/followers')
//         .set('Authorization', `Bearer ${studentToken}`);
//       expect(res.status).toBe(403);
//     });

//     test('debe retornar métricas exitosamente (200)', async () => {
//       // Crear un seguidor
//       await SavedCompany.create({ studentId, companyId });

//       const res = await request(app)
//         .get('/api/company-metrics/followers')
//         .set('Authorization', `Bearer ${companyToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body).toHaveProperty('totalFollowers');
//       expect(res.body).toHaveProperty('byCareer');
//       expect(res.body).toHaveProperty('byUniversity');
//       expect(res.body.totalFollowers).toBe(1);
//     });

//     test('debe reflejar distribución correcta por carrera', async () => {
//       const res = await request(app)
//         .get('/api/company-metrics/followers')
//         .set('Authorization', `Bearer ${companyToken}`);

//       expect(res.body.byCareer.length).toBeGreaterThan(0);
//       expect(res.body.byCareer[0]).toHaveProperty('career');
//       expect(res.body.byCareer[0]).toHaveProperty('count');
//     });
//   });

//   describe('GET /api/company-metrics/growth', () => {
//     test('debe retornar crecimiento (200)', async () => {
//       const res = await request(app)
//         .get('/api/company-metrics/growth')
//         .set('Authorization', `Bearer ${companyToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body).toHaveProperty('growth');
//       expect(Array.isArray(res.body.growth)).toBe(true);
//     });
//   });
// });

module.exports = null; // Este archivo es solo un template
