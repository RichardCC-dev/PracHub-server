const adminService = require('../services/adminService');
const emailService = require('../services/emailService');

const getPendingOffers = async (req, res, next) => {
  try {
    const offers = await adminService.getPendingOffers();
    res.status(200).json({
      message: 'Ofertas pendientes obtenidas correctamente.',
      offers,
      count: offers.length,
    });
  } catch (error) {
    next(error);
  }
};

const getOfferStats = async (req, res, next) => {
  try {
    const stats = await adminService.getOfferStats();
    res.status(200).json({
      message: 'Estadísticas de ofertas obtenidas correctamente.',
      stats,
    });
  } catch (error) {
    next(error);
  }
};

const approveOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const adminId = req.user.id;

    const result = await adminService.approveOffer(offerId, adminId);

    // Notificar a la empresa
    if (result.companyEmail) {
      try {
        await emailService.sendOfferApprovedNotification({
          to: result.companyEmail,
          offerTitle: result.offer.title,
          offerId: result.offer.id,
        });
      } catch (emailError) {
        console.error('Error al enviar notificación de aprobación:', emailError);
      }
    }

    res.status(200).json({
      message: 'Oferta aprobada correctamente.',
      offer: result.offer,
    });
  } catch (error) {
    next(error);
  }
};

const rejectOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        message: 'Se requiere un motivo de rechazo.',
      });
    }

    const result = await adminService.rejectOffer(offerId, adminId, rejectionReason);

    // Notificar a la empresa
    if (result.companyEmail) {
      try {
        await emailService.sendOfferRejectedNotification({
          to: result.companyEmail,
          offerTitle: result.offer.title,
          offerId: result.offer.id,
          rejectionReason: result.offer.rejectionReason,
        });
      } catch (emailError) {
        console.error('Error al enviar notificación de rechazo:', emailError);
      }
    }

    res.status(200).json({
      message: 'Oferta rechazada correctamente.',
      offer: result.offer,
    });
  } catch (error) {
    next(error);
  }
};

const getModerationHistory = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const history = await adminService.getModerationHistory(limit ? parseInt(limit) : 50);
    res.status(200).json({
      message: 'Historial de moderación obtenido correctamente.',
      history,
      count: history.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingOffers,
  getOfferStats,
  approveOffer,
  rejectOffer,
  getModerationHistory,
};
