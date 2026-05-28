const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Company = require('./Company');
const PasswordResetToken = require('./PasswordResetToken');
const EmailVerificationToken = require('./EmailVerificationToken');
const Resume = require('./Resume');
const ResumeVersion = require('./ResumeVersion');
const Offer = require('./Offer');
<<<<<<< HEAD
const Application = require('./Application');
=======
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
const Simulation = require('./Simulation');

// Validación de carga de todos los modelos (10 en total)
[
  { name: 'User', model: User },
  { name: 'Student', model: Student },
  { name: 'Company', model: Company },
  { name: 'PasswordResetToken', model: PasswordResetToken },
  { name: 'EmailVerificationToken', model: EmailVerificationToken },
  { name: 'Resume', model: Resume },
  { name: 'ResumeVersion', model: ResumeVersion },
  { name: 'Offer', model: Offer },
<<<<<<< HEAD
  { name: 'Application', model: Application },
=======
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
  { name: 'Simulation', model: Simulation }
].forEach(item => {
  if (!item.model || !item.model.prototype || !item.model.prototype.constructor.name) {
    throw new Error(`¡El modelo ${item.name} no se cargó correctamente! Revisa el archivo ${item.name}.js`);
  }
});

<<<<<<< HEAD
// ==========================================
// Relaciones de Usuarios, Perfiles y Tokens
// ==========================================

=======
// --- Relaciones de User ---
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
User.hasOne(Student, {
  foreignKey: 'userId',
  as: 'studentProfile',
  onDelete: 'CASCADE',
});

Student.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasOne(Company, {
  foreignKey: 'userId',
  as: 'companyProfile',
  onDelete: 'CASCADE',
});

Company.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'userId',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE',
});

PasswordResetToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(EmailVerificationToken, {
  foreignKey: 'userId',
  as: 'emailVerificationTokens',
  onDelete: 'CASCADE',
});

EmailVerificationToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

<<<<<<< HEAD
// ==========================================
// Relaciones del Estudiante (CVs y Simulaciones)
// ==========================================

=======
// --- Relaciones de Student ---
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
Student.hasOne(Resume, {
  foreignKey: 'studentId',
  as: 'resume',
  onDelete: 'CASCADE',
});

Resume.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

Student.hasMany(ResumeVersion, {
  foreignKey: 'studentId',
  as: 'resumeVersions',
  onDelete: 'CASCADE',
});

ResumeVersion.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

<<<<<<< HEAD
// Nueva característica: Simulación de entrevistas con IA
=======
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
Student.hasMany(Simulation, {
  foreignKey: 'studentId',
  as: 'simulations',
  onDelete: 'CASCADE',
});

Simulation.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

<<<<<<< HEAD
// ==========================================
// Relaciones de Ofertas Laborales (Offer)
// ==========================================

=======
// --- Relaciones de Offer ---
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
Company.hasMany(Offer, {
  foreignKey: 'companyId',
  as: 'offers',
  onDelete: 'CASCADE',
});

Offer.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

User.hasMany(Offer, {
  foreignKey: 'moderatedBy',
  as: 'moderatedOffers',
});

Offer.belongsTo(User, {
  foreignKey: 'moderatedBy',
  as: 'moderator',
});

<<<<<<< HEAD
// ==========================================
// Relaciones de Postulaciones (Application)
// ==========================================

Student.hasMany(Application, {
  foreignKey: 'studentId',
  as: 'applications',
  onDelete: 'CASCADE',
});

Application.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

Offer.hasMany(Application, {
  foreignKey: 'offerId',
  as: 'applications',
  onDelete: 'CASCADE',
});

Application.belongsTo(Offer, {
  foreignKey: 'offerId',
  as: 'offer',
});

Resume.hasMany(Application, {
  foreignKey: 'resumeId',
  as: 'applications',
  onDelete: 'CASCADE',
});

Application.belongsTo(Resume, {
  foreignKey: 'resumeId',
  as: 'resume',
});

=======
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
module.exports = {
  sequelize,
  User,
  Student,
  Company,
  PasswordResetToken,
  EmailVerificationToken,
  Resume,
  ResumeVersion,
  Offer,
<<<<<<< HEAD
  Application,
=======
>>>>>>> ecb4d48 (chore: actualiza dependencias y modelos tras rebase con develop)
  Simulation,
};