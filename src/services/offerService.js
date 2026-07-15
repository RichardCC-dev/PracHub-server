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
    order: [['id', 'DESC']],
  });
  return offers;
};

/**
 * Obtener el detalle público de una oferta (estudiantes / acceso por URL).
 * Solo devuelve ofertas aprobadas e incluye los datos públicos de la empresa.
 */
const getPublicOfferById = async (offerId) => {
  const offer = await Offer.findOne({
    where: { id: offerId, status: 'approved' },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'legalName', 'tradeName', 'logoUrl', 'industry', 'description', 'websiteUrl', 'city'],
      },
    ],
  });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada o no disponible.'), { statusCode: 404 });
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

/**
 * Obtener todas las ofertas públicas (para estudiantes)
 * @param {object} filters - Filtros opcionales
 */
const getAllOffers = async (filters = {}) => {
  const { Op } = require('sequelize');
  const where = {
    status: 'approved',
  };

  // Filtro por modalidad
  if (filters.modality) {
    where.modality = filters.modality;
  }

  // Filtro por área
  if (filters.area) {
    where.area = filters.area;
  }

  // Filtro por búsqueda de texto
  if (filters.search) {
    where.title = { [Op.like]: `%${filters.search}%` };
  }

  return await Offer.findAll({
    where,
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
      },
    ],
    order: [['id', 'DESC']],
  });
};

module.exports = {
  createOffer,
  getCompanyOffers,
  getPublicOfferById,
  updateOffer,
  closeOffer,
  getAllOffers,
};
