const { Offer, Company } = require('../models');

const createOffer = async (companyId, data) => {
  const company = await Company.findOne({ where: { id: companyId } });

  if (!company) {
    throw Object.assign(new Error('Perfil de empresa no encontrado.'), { statusCode: 404 });
  }

  if (!company.canPublishOffers) {
    throw Object.assign(
      new Error('Tu empresa debe estar verificada para publicar ofertas.'),
      { statusCode: 403 }
    );
  }

  const offer = await Offer.create({
    companyId,
    title: data.title,
    description: data.description,
    requirements: data.requirements || null,
    area: data.area,
    careerTags: data.careerTags || [],
    modality: data.modality,
    duration: data.duration || null,
    compensation: data.compensation || null,
    expiresAt: data.expiresAt || null,
    status: 'pending',
  });

  return offer;
};

const getCompanyOffers = async (companyId) => {
  const offers = await Offer.findAll({
    where: { companyId },
    order: [['created_at', 'DESC']],
  });
  return offers;
};

const getOfferById = async (offerId, companyId) => {
  const where = { id: offerId };
  if (companyId) where.companyId = companyId;

  const offer = await Offer.findOne({ where });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  return offer;
};

const updateOffer = async (offerId, companyId, data) => {
  const offer = await Offer.findOne({ where: { id: offerId, companyId } });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  if (offer.status === 'approved' || offer.status === 'closed') {
    throw Object.assign(
      new Error('No puedes editar una oferta aprobada o cerrada.'),
      { statusCode: 400 }
    );
  }

  const updatableFields = [
    'title', 'description', 'requirements', 'area',
    'careerTags', 'modality', 'duration', 'compensation', 'expiresAt',
  ];

  const updates = {};
  updatableFields.forEach(field => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  // Al editar una oferta rechazada vuelve a pendiente
  if (offer.status === 'rejected') {
    updates.status = 'pending';
    updates.rejectionReason = null;
    updates.moderatedAt = null;
    updates.moderatedBy = null;
  }

  await offer.update(updates);
  return offer;
};

const closeOffer = async (offerId, companyId) => {
  const offer = await Offer.findOne({ where: { id: offerId, companyId } });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  if (offer.status === 'closed') {
    throw Object.assign(new Error('La oferta ya está cerrada.'), { statusCode: 400 });
  }

  await offer.update({ status: 'closed' });
  return offer;
};

module.exports = {
  createOffer,
  getCompanyOffers,
  getOfferById,
  updateOffer,
  closeOffer,
};
