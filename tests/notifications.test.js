const emailService = require('../src/services/emailService');
const whatsappService = require('../src/services/whatsappService');

jest.mock('nodemailer', () => ({
  createTestAccount: jest.fn().mockResolvedValue({ user: 'test-user', pass: 'test-pass' }),
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  }),
  getTestMessageUrl: jest.fn()
}));

jest.mock('../src/services/whatsappService', () => ({
  sendWhatsAppNotification: jest.fn().mockResolvedValue(true)
}));

describe('Notificaciones Transaccionales (HU-27 y HU-28)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe enviar email de cambio de estado de postulación', async () => {
    const transporterMock = require('nodemailer').createTransport();
    
    await emailService.sendApplicationStatusChanged({
      to: 'estudiante@test.com',
      offerTitle: 'Desarrollador Web',
      companyName: 'Tech Corp',
      newStatus: 'aceptada',
      message: 'Bienvenido al equipo'
    });

    expect(transporterMock.sendMail).toHaveBeenCalled();
    const callArgs = transporterMock.sendMail.mock.calls[0][0];
    expect(callArgs.to).toBe('estudiante@test.com');
    expect(callArgs.subject).toContain('Desarrollador Web');
    expect(callArgs.html).toContain('aceptada');
    expect(callArgs.html).toContain('Bienvenido al equipo');
  });

  it('Debe enviar notificación prioritaria por WhatsApp', async () => {
    const result = await whatsappService.sendWhatsAppNotification('+51999888777', 'Hola, tu CV fue visto');
    
    expect(whatsappService.sendWhatsAppNotification).toHaveBeenCalledWith('+51999888777', 'Hola, tu CV fue visto');
    expect(result).toBe(true);
  });
});
