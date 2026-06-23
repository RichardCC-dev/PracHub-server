const adminService = require('../src/services/adminService');
const { Offer, Company, User, Application, Simulation, CVAnalysis } = require('../src/models');
const { Op } = require('sequelize');

jest.mock('../src/models', () => ({
  Offer: { count: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  Company: { findAll: jest.fn() },
  User: { count: jest.fn() },
  Application: { count: jest.fn() },
  Simulation: { count: jest.fn() },
  CVAnalysis: { count: jest.fn() }
}));

describe('Admin Service - Generación de Reportes (HU-20)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe generar el reporte con todas las métricas correctamente', async () => {
    // Mocks
    Application.count.mockResolvedValueOnce(100); // totalApplications
    Application.count.mockResolvedValueOnce(25);  // hiredApplications
    User.count.mockResolvedValueOnce(50);         // newStudents
    User.count.mockResolvedValueOnce(10);         // newCompanies
    Simulation.count.mockResolvedValueOnce(200);  // totalSimulations
    CVAnalysis.count.mockResolvedValueOnce(150);  // totalCVAnalysis
    Offer.count.mockResolvedValueOnce(30);        // totalOffers

    const reports = await adminService.getReports('2026-01-01', '2026-12-31');

    expect(Application.count).toHaveBeenCalledTimes(2);
    expect(User.count).toHaveBeenCalledTimes(2);
    expect(reports.totalApplications).toBe(100);
    expect(reports.hiredApplications).toBe(25);
    expect(reports.hiringRate).toBe(25.0);
    expect(reports.newStudents).toBe(50);
    expect(reports.newCompanies).toBe(10);
    expect(reports.totalSimulations).toBe(200);
    expect(reports.totalCVAnalysis).toBe(150);
    expect(reports.totalOffers).toBe(30);
  });

  it('Debe manejar correctamente cuando no hay postulaciones (tasa 0%)', async () => {
    Application.count.mockResolvedValueOnce(0); // totalApplications
    Application.count.mockResolvedValueOnce(0); // hiredApplications
    User.count.mockResolvedValue(0);
    Simulation.count.mockResolvedValue(0);
    CVAnalysis.count.mockResolvedValue(0);
    Offer.count.mockResolvedValue(0);

    const reports = await adminService.getReports();
    expect(reports.hiringRate).toBe(0);
  });
});
