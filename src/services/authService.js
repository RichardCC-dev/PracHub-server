const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, PasswordResetToken, EmailVerificationToken, sequelize } = require('../models');
const { getUniversityByEmail } = require('../utils/universityDomains');
const emailService = require('./emailService');

const PASSWORD_RESET_EXPIRATION_MINUTES = 30;
const EMAIL_VERIFICATION_EXPIRATION_MINUTES = 30;

const sendEmailVerification = async ({ user, email }) => {
  const token = crypto.randomUUID();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRATION_MINUTES * 60 * 1000);

  await EmailVerificationToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  await emailService.sendEmailVerificationEmail({
    email,
    verifyUrl,
    firstName: user.studentProfile?.firstName || 'estudiante',
  });
};

const sanitizeStudent = (student) => ({
  id: student.id,
  firstName: student.firstName,
  lastName: student.lastName,
  university: student.university,
  career: student.career,
  cycle: student.cycle,
  availability: student.availability,
});

const sanitizeUser = (user, student) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  authProvider: user.authProvider,
  isEmailVerified: user.isEmailVerified,
  studentProfile: sanitizeStudent(student),
});

const signToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET || 'replace-this-secret',
  { expiresIn: '24h' },
);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const registerStudent = async (payload) => {
  const email = payload.email.toLowerCase().trim();

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    const error = new Error('La cuenta ya fue creada previamente. Puedes recuperar tu contraseña.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const university = payload.university || getUniversityByEmail(email) || 'No especificada';

  return sequelize.transaction(async (transaction) => {
    const user = await User.create(
      {
        email,
        passwordHash,
        role: 'student',
        authProvider: 'local',
        isEmailVerified: false,
      },
      { transaction },
    );

    const student = await Student.create(
      {
        userId: user.id,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        university,
        career: payload.career.trim(),
        cycle: payload.cycle.trim(),
        availability: payload.availability.trim(),
        phoneNumber: payload.phoneNumber || null,
      },
      { transaction },
    );

    const result = {
      token: signToken(user),
      user: sanitizeUser(user, student),
    };

    try {
      await sendEmailVerification({ user, email });
    } catch (err) {
      console.error('Email verification could not be sent:', err.message);
    }

    return result;
  });
};

const login = async (payload) => {
  const email = payload.email.toLowerCase().trim();

  const user = await User.findOne({
    where: { email },
    include: [{ model: Student, as: 'studentProfile' }],
  });

  if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
    const error = new Error('Correo o contraseña incorrectos.');
    error.statusCode = 401;
    throw error;
  }

  const studentProfile = user.studentProfile ? sanitizeStudent(user.studentProfile) : null;

  return {
    token: signToken(user),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      isEmailVerified: user.isEmailVerified,
      studentProfile,
    },
  };
};

const requestPasswordReset = async (payload) => {
  const email = payload.email.toLowerCase().trim();
  const user = await User.findOne({ where: { email } });
  const response = {
    message: 'Si el correo existe, enviaremos un enlace de recuperación válido por 30 minutos.',
  };

  if (!user) {
    return response;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000);

  await sequelize.transaction(async (transaction) => {
    await PasswordResetToken.update(
      { usedAt: new Date() },
      {
        where: {
          userId: user.id,
          usedAt: null,
        },
        transaction,
      },
    );

    await PasswordResetToken.create(
      {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
      { transaction },
    );
  });

  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${appUrl}/?resetToken=${rawToken}`;

  try {
    await emailService.sendPasswordResetEmail({ email, resetUrl });
  } catch (error) {
    console.error('Password reset email could not be sent:', error.message);
  }

  return response;
};

const resetPassword = async (payload) => {
  const tokenHash = hashToken(payload.token.trim());
  const resetToken = await PasswordResetToken.findOne({
    where: {
      tokenHash,
      usedAt: null,
    },
    include: [{ model: User, as: 'user' }],
  });

  if (!resetToken || resetToken.expiresAt.getTime() < Date.now()) {
    const error = new Error('El enlace de recuperación es inválido o expiró.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  await sequelize.transaction(async (transaction) => {
    await resetToken.user.update({ passwordHash }, { transaction });
    await resetToken.update({ usedAt: new Date() }, { transaction });
  });

  return {
    token: signToken(resetToken.user),
    user: {
      id: resetToken.user.id,
      email: resetToken.user.email,
      role: resetToken.user.role,
      authProvider: resetToken.user.authProvider,
      isEmailVerified: resetToken.user.isEmailVerified,
    },
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
    const error = new Error('El enlace de verificación es inválido o ha expirado.');
    error.statusCode = 400;
    throw error;
  }

  await sequelize.transaction(async (transaction) => {
    await User.update(
      { isEmailVerified: true },
      { where: { id: verificationToken.user.id }, transaction }
    );
    await verificationToken.update({ usedAt: new Date() }, { transaction });
  });

  const user = await User.findByPk(verificationToken.user.id, {
    include: [{ model: Student, as: 'studentProfile' }],
  });

  emailService.sendWelcomeEmail({
    email: user.email,
    firstName: user.studentProfile?.firstName || 'estudiante',
  }).catch((err) => {
    console.error('Welcome email could not be sent:', err.message);
  });

  return {
    message: 'Correo verificado correctamente. Ya puedes usar tu cuenta.',
    token: signToken(user),
    user: sanitizeUser(user, user.studentProfile),
  };
};

module.exports = {
  registerStudent,
  login,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
};
