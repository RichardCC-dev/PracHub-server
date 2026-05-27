const { Offer, Company, User } = require('../models');
const { Op } = require('sequelize');

const PENDING_REVIEW_THRESHOLD_HOURS = 48;

const getPendingOffers = async () => {
  const offers = await Offer.findAll({
    where: { status: 'pending' },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  // Marcar las que tienen más de 48h pendientes
  const now = new Date();
  const offersWithAlert = offers.map(offer => {
    const hoursPending = (now - offer.createdAt) / (1000 * 60 * 60);
    return {
      ...offer.toJSON(),
      hoursPending: Math.floor(hoursPending),
      isOverdue: hoursPending > PENDING_REVIEW_THRESHOLD_HOURS,
    };
  });

  return offersWithAlert;
};

const getOfferStats = async () => {
  const total = await Offer.count();
  const pending = await Offer.count({ where: { status: 'pending' } });
  const approved = await Offer.count({ where: { status: 'approved' } });
  const rejected = await Offer.count({ where: { status: 'rejected' } });
  const closed = await Offer.count({ where: { status: 'closed' } });

  const overdue = await Offer.count({
    where: {
      status: 'pending',
      createdAt: {
        [Op.lt]: new Date(Date.now() - PENDING_REVIEW_THRESHOLD_HOURS * 60 * 60 * 1000),
      },
    },
  });

  return {
    total,
    pending,
    approved,
    rejected,
    closed,
    overdue,
  };
};

const approveOffer = async (offerId, adminId) => {
  const offer = await Offer.findByPk(offerId, {
    include: [
      {
        model: Company,
        as: 'company',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      },
    ],
  });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  if (offer.status !== 'pending') {
    throw Object.assign(new Error('La oferta ya ha sido moderada.'), { statusCode: 400 });
  }

  await offer.update({
    status: 'approved',
    moderatedAt: new Date(),
    moderatedBy: adminId,
    rejectionReason: null,
  });

  return {
    offer: offer.toJSON(),
    companyEmail: offer.company?.user?.email,
    action: 'approved',
  };
};

const rejectOffer = async (offerId, adminId, rejectionReason) => {
  if (!rejectionReason || rejectionReason.trim().length < 10) {
    throw Object.assign(
      new Error('El motivo de rechazo debe tener al menos 10 caracteres.'),
      { statusCode: 400 }
    );
  }

  const offer = await Offer.findByPk(offerId, {
    include: [
      {
        model: Company,
        as: 'company',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      },
    ],
  });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  if (offer.status !== 'pending') {
    throw Object.assign(new Error('La oferta ya ha sido moderada.'), { statusCode: 400 });
  }

  await offer.update({
    status: 'rejected',
    moderatedAt: new Date(),
    moderatedBy: adminId,
    rejectionReason: rejectionReason.trim(),
  });

  return {
    offer: offer.toJSON(),
    companyEmail: offer.company?.user?.email,
    action: 'rejected',
  };
};

const getModerationHistory = async (limit = 50) => {
  const offers = await Offer.findAll({
    where: {
      status: { [Op.in]: ['approved', 'rejected'] },
    },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'legalName', 'tradeName'],
      },
      {
        model: User,
        as: 'moderator',
        attributes: ['id', 'email'],
      },
    ],
    order: [['moderatedAt', 'DESC']],
    limit,
  });

  return offers;
};

module.exports = {
  getPendingOffers,
  getOfferStats,
  approveOffer,
  rejectOffer,
  getModerationHistory,
};

const { Offer, Company, User } = require('../models');
const { Op } = require('sequelize');

const PENDING_REVIEW_THRESHOLD_HOURS = 48;

const getPendingOffers = async () => {
  const offers = await Offer.findAll({
    where: { status: 'pending' },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      },
    ],
    order: [['created_at', 'ASC']],
  });

  // Marcar las que tienen más de 48h pendientes
  const now = new Date();
  const offersWithAlert = offers.map(offer => {
    const hoursPending = (now - new Date(offer.created_at)) / (1000 * 60 * 60);
    return {
      ...offer.toJSON(),
      hoursPending: Math.floor(hoursPending),
      isOverdue: hoursPending > PENDING_REVIEW_THRESHOLD_HOURS,
    };
  });

  return offersWithAlert;
};

const getOfferStats = async () => {
  const total = await Offer.count();
  const pending = await Offer.count({ where: { status: 'pending' } });
  const approved = await Offer.count({ where: { status: 'approved' } });
  const rejected = await Offer.count({ where: { status: 'rejected' } });
  const closed = await Offer.count({ where: { status: 'closed' } });

  const overdue = await Offer.count({
    where: {
      status: 'pending',
      created_at: {
        [Op.lt]: new Date(Date.now() - PENDING_REVIEW_THRESHOLD_HOURS * 60 * 60 * 1000),
      },
    },
  });

  return {
    total,
    pending,
    approved,
    rejected,
    closed,
    overdue,
  };
};

const approveOffer = async (offerId, adminId) => {
  const offer = await Offer.findByPk(offerId, {
    include: [
      {
        model: Company,
        as: 'company',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      },
    ],
  });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  if (offer.status !== 'pending') {
    throw Object.assign(new Error('La oferta ya ha sido moderada.'), { statusCode: 400 });
  }

  await offer.update({
    status: 'approved',
    moderatedAt: new Date(),
    moderatedBy: adminId,
    rejectionReason: null,
  });

  return {
    offer: offer.toJSON(),
    companyEmail: offer.company?.user?.email,
    action: 'approved',
  };
};

const rejectOffer = async (offerId, adminId, rejectionReason) => {
  if (!rejectionReason || rejectionReason.trim().length < 10) {
    throw Object.assign(
      new Error('El motivo de rechazo debe tener al menos 10 caracteres.'),
      { statusCode: 400 }
    );
  }

  const offer = await Offer.findByPk(offerId, {
    include: [
      {
        model: Company,
        as: 'company',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email'],
          },
        ],
      },
    ],
  });

  if (!offer) {
    throw Object.assign(new Error('Oferta no encontrada.'), { statusCode: 404 });
  }

  if (offer.status !== 'pending') {
    throw Object.assign(new Error('La oferta ya ha sido moderada.'), { statusCode: 400 });
  }

  await offer.update({
    status: 'rejected',
    moderatedAt: new Date(),
    moderatedBy: adminId,
    rejectionReason: rejectionReason.trim(),
  });

  return {
    offer: offer.toJSON(),
    companyEmail: offer.company?.user?.email,
    action: 'rejected',
  };
};

const getModerationHistory = async (limit = 50) => {
  const offers = await Offer.findAll({
    where: {
      status: { [Op.in]: ['approved', 'rejected'] },
    },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'legalName', 'tradeName'],
      },
      {
        model: User,
        as: 'moderator',
        attributes: ['id', 'email'],
      },
    ],
    order: [['moderated_at', 'DESC']],
    limit,
  });

  return offers;
};

module.exports = {
  getPendingOffers,
  getOfferStats,
  approveOffer,
  rejectOffer,
  getModerationHistory,
};
