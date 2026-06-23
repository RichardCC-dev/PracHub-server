const alertService = require('../src/services/alertService');
const emailService = require('../src/services/emailService');
const { AlertSettings, Student, User, Company } = require('../src/models');

jest.mock('../src/services/emailService', () => ({
  sendOfferMatchAlert: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/models', () => ({
  AlertSettings: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Student: {
    findByPk: jest.fn()
  },
  Company: {
    findByPk: jest.fn()
  },
  User: {},
  AlertHistory: { create: jest.fn(), findOne: jest.fn() },
  SavedCompany: { findOne: jest.fn() },
  Notification: { create: jest.fn() },
  Offer: {},
  Resume: {}
}));

describe('Alert Service - Módulo de Alertas Compatibles y Empresas Seguidas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe enviar alerta inmediata si la compatibilidad es alta y tiene emailEnabled', async () => {
    // Configuración de alertas
    AlertSettings.findOne.mockResolvedValue({
      frequency: 'immediate',
      emailEnabled: true,
      platformEnabled: false
    });
    
    // Mock que no fue alertado antes
    const { AlertHistory } = require('../src/models');
    AlertHistory.findOne.mockResolvedValue(null);

    // Mock Estudiante y Empresa
    Student.findByPk.mockResolvedValue({ id: 1, firstName: 'Maria', user: { email: 'maria@test.com' } });
    Company.findByPk.mockResolvedValue({ legalName: 'Google Peru' });
    AlertHistory.create.mockResolvedValue({});

    const offerMock = { id: 10, title: 'Practicante Data', companyId: 2 };
    
    // Llamar método (asumiendo que compatibilidad 90 pasa el umbral de 70)
    const result = await alertService.sendImmediateAlert(1, offerMock, 90, false);
    
    expect(emailService.sendOfferMatchAlert).toHaveBeenCalledWith(expect.objectContaining({
      to: 'maria@test.com',
      offerTitle: 'Practicante Data',
      compatibilityScore: 90
    }));
    
    expect(result.sent).toBe(true);
  });
});
