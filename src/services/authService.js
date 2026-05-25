const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, sequelize } = require('../models');
const { getUniversityByEmail } = require('../utils/universityDomains');

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
        isEmailVerified: true,
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

    return {
      token: signToken(user),
      user: sanitizeUser(user, student),
    };
  });
};

module.exports = {
  registerStudent,
};
