const offerService = require('../services/offerService');

const createOffer = async (req, res, next) => {
  try {
    const companyId = req.user.companyProfile?.id;

    if (!companyId) {
      return res.status(403).json({ message: 'No tienes un perfil de empresa asociado.' });
    }

    const offer = await offerService.createOffer(companyId, req.body);

    res.status(201).json({
      message: 'Oferta creada correctamente. Está pendiente de revisión por el administrador.',
      offer,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOffers = async (req, res, next) => {
  try {
    const companyId = req.user.companyProfile?.id;

    if (!companyId) {
      return res.status(403).json({ message: 'No tienes un perfil de empresa asociado.' });
    }

    const offers = await offerService.getCompanyOffers(companyId);

    res.status(200).json({
      message: 'Ofertas obtenidas correctamente.',
      offers,
      count: offers.length,
    });
  } catch (error) {
    next(error);
  }
};

const getOfferById = async (req, res, next) => {
  try {
    const companyId = req.user.companyProfile?.id;
    const { offerId } = req.params;

    const offer = await offerService.getOfferById(offerId, companyId);

    res.status(200).json({ offer });
  } catch (error) {
    next(error);
  }
};

const updateOffer = async (req, res, next) => {
  try {
    const companyId = req.user.companyProfile?.id;
    const { offerId } = req.params;

    if (!companyId) {
      return res.status(403).json({ message: 'No tienes un perfil de empresa asociado.' });
    }

    const offer = await offerService.updateOffer(offerId, companyId, req.body);

    res.status(200).json({
      message: 'Oferta actualizada correctamente.',
      offer,
    });
  } catch (error) {
    next(error);
  }
};

const closeOffer = async (req, res, next) => {
  try {
    const companyId = req.user.companyProfile?.id;
    const { offerId } = req.params;

    if (!companyId) {
      return res.status(403).json({ message: 'No tienes un perfil de empresa asociado.' });
    }

    const offer = await offerService.closeOffer(offerId, companyId);

    res.status(200).json({
      message: 'Oferta cerrada correctamente.',
      offer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/offers
 * Obtener todas las ofertas públicas (para estudiantes)
 */
const getAllOffers = async (req, res, next) => {
  try {
    const filters = {
      status: 'approved',
      modality: req.query.modality,
      search: req.query.search,
    };

    const offers = await offerService.getAllOffers(filters);

    res.status(200).json({
      success: true,
      data: { offers },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOffer,
  getMyOffers,
  getOfferById,
  updateOffer,
  closeOffer,
  getAllOffers,
};
