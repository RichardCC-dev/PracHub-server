const alertService = require('../src/services/alertService');
const emailService = require('../src/services/emailService');
const recommendationService = require('../src/services/recommendationService');
const { AlertSettings, AlertHistory, SavedCompany, Student, Company, Offer, Resume, Notification } =
  require('../src/models');

jest.mock('../src/services/emailService', () => ({
  sendOfferMatchAlert: jest.fn().mockResolvedValue(true),
  sendDailyDigest: jest.fn().mockResolvedValue(true),
  sendWeeklyDigest: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/recommendationService', () => ({
  calculateCompatibilityScore: jest.fn(),
  COMPATIBILITY_THRESHOLD: 40,
}));

jest.mock('../src/models', () => ({
  AlertSettings: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
  AlertHistory: { create: jest.fn(), findOne: jest.fn(), findAndCountAll: jest.fn() },
  SavedCompany: { findOne: jest.fn() },
  Student: { findByPk: jest.fn(), findAll: jest.fn() },
  Company: { findByPk: jest.fn() },
  Offer: { findAll: jest.fn(), findByPk: jest.fn() },
  Resume: { findOne: jest.fn(), findAll: jest.fn() },
  Notification: { create: jest.fn(), findOne: jest.fn() },
  User: {},
  Op: { gte: Symbol('gte') },
}));

describe('Alert Service - Módulo de Alertas Compatibles y Empresas Seguidas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateSettings', () => {
    it('devuelve la configuración existente', async () => {
      const existing = { id: 1, studentId: 10, frequency: 'immediate' };
      AlertSettings.findOne.mockResolvedValue(existing);

      const result = await alertService.getOrCreateSettings(10);
      expect(result).toBe(existing);
      expect(AlertSettings.create).not.toHaveBeenCalled();
    });

    it('crea configuración por defecto cuando no existe', async () => {
      AlertSettings.findOne.mockResolvedValue(null);
      const created = { id: 2, studentId: 10, frequency: 'immediate' };
      AlertSettings.create.mockResolvedValue(created);

      const result = await alertService.getOrCreateSettings(10);
      expect(AlertSettings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 10,
          frequency: 'immediate',
          emailEnabled: true,
          platformEnabled: true,
          whatsappEnabled: false,
        })
      );
      expect(result).toBe(created);
    });
  });

  describe('updateSettings', () => {
    it('actualiza solo los campos permitidos', async () => {
      const save = jest.fn();
      const settings = {
        id: 1,
        frequency: 'immediate',
        emailEnabled: true,
        platformEnabled: true,
        whatsappEnabled: false,
        save,
      };
      AlertSettings.findOne.mockResolvedValue(settings);

      await alertService.updateSettings(10, {
        frequency: 'daily',
        emailEnabled: false,
        campoNoPermitido: 'x',
      });

      expect(settings.frequency).toBe('daily');
      expect(settings.emailEnabled).toBe(false);
      expect(settings.campoNoPermitido).toBeUndefined();
      expect(save).toHaveBeenCalled();
    });
  });

  describe('wasOfferAlreadyAlerted / isCompanyFollowed', () => {
    it('retorna true si ya existe historial de alerta para la oferta', async () => {
      AlertHistory.findOne.mockResolvedValue({ id: 5 });
      const result = await alertService.wasOfferAlreadyAlerted(10, 99);
      expect(result).toBe(true);
    });

    it('retorna false si no existe historial', async () => {
      AlertHistory.findOne.mockResolvedValue(null);
      const result = await alertService.wasOfferAlreadyAlerted(10, 99);
      expect(result).toBe(false);
    });

    it('retorna true si el estudiante sigue a la empresa', async () => {
      SavedCompany.findOne.mockResolvedValue({ id: 1 });
      const result = await alertService.isCompanyFollowed(10, 7);
      expect(result).toBe(true);
    });
  });

  describe('calculateCompatibility', () => {
    it('delega el cálculo a recommendationService', async () => {
      recommendationService.calculateCompatibilityScore.mockResolvedValue(88);

      const result = await alertService.calculateCompatibility(10, { id: 1 });
      expect(recommendationService.calculateCompatibilityScore).toHaveBeenCalledWith(10, { id: 1 });
      expect(result).toBe(88);
    });
  });

  describe('sendImmediateAlert', () => {
    const offerMock = { id: 10, title: 'Practicante Data', companyId: 2 };

    it('no envía si la compatibilidad está bajo el umbral', async () => {
      AlertSettings.findOne.mockResolvedValue({ emailEnabled: true, platformEnabled: true });
      AlertHistory.findOne.mockResolvedValue(null);

      const result = await alertService.sendImmediateAlert(1, offerMock, 20, false);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('below_threshold');
    });

    it('no envía si la oferta ya fue alertada', async () => {
      AlertSettings.findOne.mockResolvedValue({ emailEnabled: true, platformEnabled: true });
      AlertHistory.findOne.mockResolvedValue({ id: 1 });

      const result = await alertService.sendImmediateAlert(1, offerMock, 90, false);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('already_alerted');
    });

    it('no envía si el estudiante no existe', async () => {
      AlertSettings.findOne.mockResolvedValue({ emailEnabled: true, platformEnabled: true });
      AlertHistory.findOne.mockResolvedValue(null);
      Student.findByPk.mockResolvedValue(null);

      const result = await alertService.sendImmediateAlert(1, offerMock, 90, false);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('student_not_found');
    });

    it('envía alerta inmediata por email si emailEnabled y compatibilidad alta', async () => {
      AlertSettings.findOne.mockResolvedValue({
        frequency: 'immediate',
        emailEnabled: true,
        platformEnabled: false,
      });
      AlertHistory.findOne.mockResolvedValue(null);
      Student.findByPk.mockResolvedValue({ id: 1, firstName: 'Maria', user: { email: 'maria@test.com' } });
      Company.findByPk.mockResolvedValue({ legalName: 'Google Peru' });
      AlertHistory.create.mockResolvedValue({});

      const result = await alertService.sendImmediateAlert(1, offerMock, 90, false);

      expect(emailService.sendOfferMatchAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'maria@test.com',
          offerTitle: 'Practicante Data',
          compatibilityScore: 90,
        })
      );
      expect(result.sent).toBe(true);
      expect(result.emailSent).toBe(true);
    });

    it('crea notificación en plataforma con tipo followed_company_offer cuando es empresa seguida', async () => {
      AlertSettings.findOne.mockResolvedValue({
        frequency: 'immediate',
        emailEnabled: false,
        platformEnabled: true,
      });
      AlertHistory.findOne.mockResolvedValue(null);
      Student.findByPk.mockResolvedValue({ id: 1, firstName: 'Maria', userId: 50, user: { email: 'm@t.com' } });
      Company.findByPk.mockResolvedValue({ legalName: 'BCP' });
      AlertHistory.create.mockResolvedValue({});
      Notification.findOne.mockResolvedValue(null);

      await alertService.sendImmediateAlert(1, offerMock, 90, true);

      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 50,
          type: 'followed_company_offer',
          title: expect.stringContaining('BCP'),
        })
      );
    });
  });

  describe('processNewOffer', () => {
    const offerMock = { id: 10, title: 'Dev', companyId: 2 };

    it('salta estudiantes con frecuencia no immediate', async () => {
      Student.findAll.mockResolvedValue([
        { id: 1, firstName: 'A', userId: 11, user: { email: 'a@t.com' } },
      ]);
      AlertSettings.findOne.mockResolvedValue({ frequency: 'daily', emailEnabled: true });
      AlertHistory.findOne.mockResolvedValue(null);

      const result = await alertService.processNewOffer(offerMock);

      expect(result.totalProcessed).toBe(1);
      expect(result.alertsSent).toBe(0);
      expect(recommendationService.calculateCompatibilityScore).not.toHaveBeenCalled();
    });

    it('salta estudiantes ya alertados', async () => {
      Student.findAll.mockResolvedValue([
        { id: 1, firstName: 'A', userId: 11, user: { email: 'a@t.com' } },
      ]);
      AlertSettings.findOne.mockResolvedValue({ frequency: 'immediate', emailEnabled: true });
      AlertHistory.findOne.mockResolvedValue({ id: 1 }); // ya alertado

      const result = await alertService.processNewOffer(offerMock);

      expect(result.alertsSent).toBe(0);
      expect(recommendationService.calculateCompatibilityScore).not.toHaveBeenCalled();
    });

    it('envía alerta para estudiantes compatibles (umbral cumplido)', async () => {
      Student.findAll.mockResolvedValue([
        { id: 1, firstName: 'A', userId: 11, user: { email: 'a@t.com' } },
      ]);
      AlertSettings.findOne.mockResolvedValue({ frequency: 'immediate', emailEnabled: true, platformEnabled: false });
      AlertHistory.findOne.mockResolvedValue(null);
      recommendationService.calculateCompatibilityScore.mockResolvedValue(75);
      SavedCompany.findOne.mockResolvedValue(null);
      Student.findByPk.mockResolvedValue({ id: 1, firstName: 'A', userId: 11, user: { email: 'a@t.com' } });
      Company.findByPk.mockResolvedValue({ legalName: 'X' });
      AlertHistory.create.mockResolvedValue({});

      const result = await alertService.processNewOffer(offerMock);

      expect(result.alertsSent).toBe(1);
    });

    it('no envía si compatibilidad baja y no es empresa seguida', async () => {
      Student.findAll.mockResolvedValue([
        { id: 1, firstName: 'A', userId: 11, user: { email: 'a@t.com' } },
      ]);
      AlertSettings.findOne.mockResolvedValue({ frequency: 'immediate', emailEnabled: true, platformEnabled: false });
      AlertHistory.findOne.mockResolvedValue(null);
      recommendationService.calculateCompatibilityScore.mockResolvedValue(20);
      SavedCompany.findOne.mockResolvedValue(null);

      const result = await alertService.processNewOffer(offerMock);

      expect(result.alertsSent).toBe(0);
    });
  });

  describe('getUnalertedOffersForStudent', () => {
    it('filtra por umbral y ordena: empresas seguidas primero, luego por compatibilidad', async () => {
      const offers = [
        { id: 1, title: 'A', companyId: 5, company: { legalName: 'C1' } },
        { id: 2, title: 'B', companyId: 6, company: { legalName: 'C2' } },
        { id: 3, title: 'C', companyId: 7, company: { legalName: 'C3' } },
      ];
      Offer.findAll.mockResolvedValue(offers);
      AlertHistory.findOne.mockResolvedValue(null);
      // compatibilidades: 50, 30 (bajo umbral), 80
      recommendationService.calculateCompatibilityScore
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(80);
      // empresa seguida solo para oferta 1
      SavedCompany.findOne
        .mockResolvedValueOnce({ id: 1 }) // oferta 1 seguida
        .mockResolvedValueOnce(null) // oferta 2
        .mockResolvedValueOnce(null); // oferta 3

      const result = await alertService.getUnalertedOffersForStudent(10, new Date('2026-01-01'), 40);

      // oferta 2 (score 30, no seguida) se filtra
      expect(result.map((r) => r.offer.id)).toEqual([1, 3]);
      // empresa seguida (id 1) va primero aunque su score (50) sea menor que el de la 3 (80)
      expect(result[0].offer.id).toBe(1);
      expect(result[0].isFromFollowedCompany).toBe(true);
      expect(result[1].compatibilityScore).toBe(80);
    });
  });

  describe('getAlertHistory', () => {
    it('delega en AlertHistory.findAndCountAll con where y paginación', async () => {
      const history = { rows: [], count: 0 };
      AlertHistory.findAndCountAll.mockResolvedValue(history);

      const result = await alertService.getAlertHistory(10, { limit: 10, offset: 5 });

      expect(AlertHistory.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 5,
        })
      );
      expect(result).toBe(history);
    });
  });
});
