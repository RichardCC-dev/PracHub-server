const invitationService = require('../src/services/invitationService');
const { InvitationToApply, DirectMessage, Offer, Student, Application, Resume, User } = require('../src/models');
const { Op } = require('sequelize');

jest.mock('../src/models', () => ({
  InvitationToApply: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn()
  },
  DirectMessage: { create: jest.fn() },
  Offer: { findByPk: jest.fn() },
  Student: { findByPk: jest.fn() },
  Application: { create: jest.fn(), findOne: jest.fn() },
  Resume: { findOne: jest.fn() },
  User: {}
}));

describe('Invitation Service - Invitación Directa (HU-18)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe crear una invitación y un mensaje directo', async () => {
    // Mock Offer
    Offer.findByPk.mockResolvedValue({
      id: 1,
      status: 'active',
      title: 'Desarrollador Junior',
      company: { userId: 10 }
    });

    // Mock Student
    Student.findByPk.mockResolvedValue({
      id: 5,
      firstName: 'Juan',
      user: { id: 20 }
    });

    // Validar duplicados
    InvitationToApply.findOne.mockResolvedValue(null);
    Application.findOne.mockResolvedValue(null); // No ha aplicado ya

    // Mock Create
    DirectMessage.create.mockResolvedValue({ id: 100, content: 'Unete a nosotros' });
    InvitationToApply.create.mockResolvedValue({ id: 200, messageId: 100 });

    const result = await invitationService.createInvitation(10, 5, 1, 'Unete a nosotros');

    expect(DirectMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      senderId: 10,
      receiverId: 20,
      content: expect.stringContaining('Unete a nosotros')
    }));
    
    expect(InvitationToApply.create).toHaveBeenCalledWith(expect.objectContaining({
      messageId: 100,
      offerId: 1,
      studentId: 5,
      recruiterMessage: 'Unete a nosotros'
    }));

    expect(result.invitation.id).toBe(200);
  });

  it('Debe fallar si la oferta no pertenece al reclutador', async () => {
    Offer.findByPk.mockResolvedValue({
      id: 1,
      status: 'active',
      company: { userId: 999 } // Otro usuario
    });

    await expect(invitationService.createInvitation(10, 5, 1, 'Hola')).rejects.toThrow('Unauthorized: offer does not belong to recruiter');
  });

  it('Debe fallar si ya existe una invitación', async () => {
    Offer.findByPk.mockResolvedValue({ id: 1, status: 'active', company: { userId: 10 } });
    Student.findByPk.mockResolvedValue({ id: 5, user: { id: 20 } });
    InvitationToApply.findOne.mockResolvedValue({ id: 99 }); // Ya existe

    await expect(invitationService.createInvitation(10, 5, 1, 'Hola')).rejects.toThrow('Invitation already exists for this student-offer pair');
  });
});
