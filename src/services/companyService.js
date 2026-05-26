const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Company, EmailVerificationToken, sequelize } = require('../models');
const emailService = require('./emailService');

const EMAIL_VERIFICATION_EXPIRATION_MINUTES = 30;

const signToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET || 'replace-this-secret',
  { expiresIn: '24h' },
);

const sanitizeCompany = (company) => ({
  id: company.id,
  taxId: company.taxId,
  legalName: company.legalName,
  tradeName: company.tradeName,
  description: company.description,
  industry: company.industry,
  companySize: company.companySize,
  websiteUrl: company.websiteUrl,
  logoUrl: company.logoUrl,
  cultureTags: company.cultureTags || [],
  country: company.country,
  city: company.city,
  address: company.address,
  responsibleName: company.responsibleName,
  responsiblePosition: company.responsiblePosition,
  responsiblePhone: company.responsiblePhone,
  verificationStatus: company.verificationStatus,
  isVerified: company.isVerified,
  canPublishOffers: company.canPublishOffers,
  pendingOffersCount: company.pendingOffersCount,
  createdAt: company.createdAt,
});

const sanitizeUser = (user, company) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  authProvider: user.authProvider,
  isEmailVerified: user.isEmailVerified,
  companyProfile: sanitizeCompany(company),
});

const sendEmailVerification = async ({ user, email, companyName }) => {
  const token = crypto.randomUUID();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRATION_MINUTES * 60 * 1000);

  console.log('[CompanyService] Creando token de verificación para usuario:', user.id);

  try {
    await EmailVerificationToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    console.log('[CompanyService] Token creado exitosamente');
  } catch (dbError) {
    console.error('[CompanyService] Error al crear token:', dbError.message);
    throw dbError;
  }

  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  console.log('[CompanyService] Enviando email de verificación a:', email);

  try {
    await emailService.sendCompanyEmailVerificationEmail({
      email,
      verifyUrl,
      companyName,
    });
    console.log('[CompanyService] Email de verificación enviado exitosamente');
  } catch (emailError) {
    console.error('[CompanyService] Error al enviar email:', emailError.message);
    throw emailError;
  }
};

const validateTaxIdFormat = (taxId, country = 'Perú') => {
  const cleanTaxId = taxId.replace(/\s/g, '');

  if (country === 'Perú') {
    const rucRegex = /^(10|15|16|17|20)\d{9}$/;
    if (!rucRegex.test(cleanTaxId)) {
      throw Object.assign(
        new Error('El RUC no tiene un formato válido. Debe contener 11 dígitos y comenzar con 10, 15, 16, 17 o 20.'),
        { statusCode: 400 }
      );
    }
    return cleanTaxId;
  }

  if (cleanTaxId.length < 6 || cleanTaxId.length > 20) {
    throw Object.assign(
      new Error('El ID fiscal debe tener entre 6 y 20 caracteres.'),
      { statusCode: 400 }
    );
  }

  return cleanTaxId;
};

const checkTaxIdExists = async (taxId) => {
  const existing = await Company.findOne({ where: { taxId } });
  if (existing) {
    throw Object.assign(
      new Error('Este RUC/NIT ya está registrado en la plataforma.'),
      { statusCode: 409 }
    );
  }
};

const registerCompany = async (payload) => {
  const email = payload.email.toLowerCase().trim();

  console.log('[CompanyService] Iniciando registro de empresa:', email);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw Object.assign(
      new Error('La cuenta ya fue creada previamente. Puedes recuperar tu contraseña.'),
      { statusCode: 409 }
    );
  }

  const taxId = validateTaxIdFormat(payload.taxId, payload.country);
  await checkTaxIdExists(taxId);
  console.log('[CompanyService] RUC validado:', taxId);

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const result = await sequelize.transaction(async (transaction) => {
    console.log('[CompanyService] Creando usuario...');
    const user = await User.create(
      {
        email,
        passwordHash,
        role: 'company',
        authProvider: 'local',
        isEmailVerified: false,
      },
      { transaction },
    );
    console.log('[CompanyService] Usuario creado:', user.id);

    console.log('[CompanyService] Creando empresa...');
    const company = await Company.create(
      {
        userId: user.id,
        taxId,
        legalName: payload.legalName.trim(),
        tradeName: payload.tradeName?.trim() || null,
        description: payload.description?.trim() || null,
        industry: payload.industry.trim(),
        companySize: payload.companySize,
        websiteUrl: payload.websiteUrl?.trim() || null,
        country: payload.country?.trim() || 'Perú',
        city: payload.city?.trim() || null,
        address: payload.address?.trim() || null,
        responsibleName: payload.responsibleName.trim(),
        responsiblePosition: payload.responsiblePosition.trim(),
        responsiblePhone: payload.responsiblePhone.trim(),
        verificationStatus: 'pending',
        isVerified: false,
        canPublishOffers: false,
        pendingOffersCount: 0,
      },
      { transaction },
    );
    console.log('[CompanyService] Empresa creada:', company.id);

    return { user, company, token: signToken(user) };
  });

  console.log('[CompanyService] Transacción completada, enviando emails...');

  // Enviar emails fuera de la transacción para evitar deadlocks
  try {
    await sendEmailVerification({
      user: result.user,
      email,
      companyName: result.company.legalName,
    });
    console.log('[CompanyService] Email de verificación enviado a:', email);
  } catch (err) {
    console.error('Company verification email could not be sent:', err.message);
  }

  try {
    await emailService.sendCompanyRegistrationConfirmationEmail({
      email,
      companyName: result.company.legalName,
      responsibleName: result.company.responsibleName,
    });
    console.log('[CompanyService] Email de confirmación enviado a:', email);
  } catch (err) {
    console.error('Company registration confirmation email could not be sent:', err.message);
  }

  return {
    token: result.token,
    user: sanitizeUser(result.user, result.company),
  };
};

const verifyEmail = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const verificationToken = await EmailVerificationToken.findOne({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() },
    },
    include: [{ model: User, as: 'user' }],
  });

  if (!verificationToken) {
    throw Object.assign(
      new Error('El enlace de verificación es inválido o ha expirado.'),
      { statusCode: 400 }
    );
  }

  await sequelize.transaction(async (transaction) => {
    await User.update(
      { isEmailVerified: true },
      { where: { id: verificationToken.user.id }, transaction }
    );
    await verificationToken.update({ usedAt: new Date() }, { transaction });
  });

  // Recargar el usuario desde BD para obtener isEmailVerified actualizado
  const user = await User.findOne({
    where: { id: verificationToken.user.id },
    include: [{ model: Company, as: 'companyProfile' }],
  });

  console.log('[CompanyService] Usuario recargado, isEmailVerified:', user.isEmailVerified);

  if (!user.isEmailVerified) {
    console.error('[CompanyService] ERROR: isEmailVerified sigue siendo false después de actualizar');
  }

  emailService.sendCompanyWelcomeEmail({
    email: user.email,
    companyName: user.companyProfile?.legalName || 'su empresa',
    responsibleName: user.companyProfile?.responsibleName || 'responsable',
  }).catch((err) => {
    console.error('Company welcome email could not be sent:', err.message);
  });

  return {
    message: 'Correo verificado correctamente. Su empresa está pendiente de verificación legal.',
    token: signToken(user),
    user: sanitizeUser(user, user.companyProfile),
  };
};

const getCompanyProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Company, as: 'companyProfile' }],
  });

  if (!user || !user.companyProfile) {
    throw Object.assign(
      new Error('Perfil de empresa no encontrado.'),
      { statusCode: 404 }
    );
  }

  return sanitizeUser(user, user.companyProfile);
};

const updateCompanyProfile = async (userId, payload) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Company, as: 'companyProfile' }],
  });

  if (!user || !user.companyProfile) {
    throw Object.assign(
      new Error('Perfil de empresa no encontrado.'),
      { statusCode: 404 }
    );
  }

  const allowedUpdates = [
    'description',
    'websiteUrl',
    'logoUrl',
    'city',
    'address',
    'responsiblePhone',
    'tradeName',
    'cultureTags',
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (payload[field] !== undefined) {
      if (field === 'cultureTags') {
        updates[field] = payload[field]; // Array JSON, no hacer trim
      } else if (typeof payload[field] === 'string') {
        updates[field] = payload[field].trim();
      } else {
        updates[field] = payload[field];
      }
    }
  });

  await user.companyProfile.update(updates);
  
  // Recargar para obtener datos frescos
  await user.companyProfile.reload();

  return sanitizeUser(user, user.companyProfile);
};

module.exports = {
  registerCompany,
  verifyEmail,
  getCompanyProfile,
  updateCompanyProfile,
};
