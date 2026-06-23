const logger = require('../utils/logger');

const sendWhatsAppNotification = async (phoneNumber, message) => {
  if (!phoneNumber) return false;
  // Mock de Twilio / WhatsApp API
  logger.info(`[WhatsAppService MOCK] Enviando mensaje a ${phoneNumber}:\n${message}`);
  return true;
};

module.exports = {
  sendWhatsAppNotification,
};
