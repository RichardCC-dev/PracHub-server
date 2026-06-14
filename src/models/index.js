const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Company = require('./Company');
const PasswordResetToken = require('./PasswordResetToken');
const EmailVerificationToken = require('./EmailVerificationToken');
const Resume = require('./Resume');
const ResumeVersion = require('./ResumeVersion');
const Offer = require('./Offer');
const Application = require('./Application');
const Simulation = require('./Simulation');
const Notification = require('./Notification');
const CVAnalysis = require('./CVAnalysis');
const AlertSettings = require('./AlertSettings');
const SavedCompany = require('./SavedCompany');
const AlertHistory = require('./AlertHistory');
const DirectMessage = require('./DirectMessage');

// Validación de carga de todos los modelos (16 en total)
[
  { name: 'User', model: User },
  { name: 'Student', model: Student },
  { name: 'Company', model: Company },
  { name: 'PasswordResetToken', model: PasswordResetToken },
  { name: 'EmailVerificationToken', model: EmailVerificationToken },
  { name: 'Resume', model: Resume },
  { name: 'ResumeVersion', model: ResumeVersion },
  { name: 'Offer', model: Offer },
  { name: 'Application', model: Application },
  { name: 'Notification', model: Notification },
  { name: 'CVAnalysis', model: CVAnalysis },
  { name: 'Simulation', model: Simulation },
  { name: 'AlertSettings', model: AlertSettings },
  { name: 'SavedCompany', model: SavedCompany },
  { name: 'AlertHistory', model: AlertHistory },
  { name: 'DirectMessage', model: DirectMessage }
].forEach(item => {
  if (!item.model || !item.model.prototype || !item.model.prototype.constructor.name) {
    throw new Error(`¡El modelo ${item.name} no se cargó correctamente! Revisa el archivo ${item.name}.js`);
  }
});

// ==========================================
// Relaciones de Usuarios, Perfiles y Tokens
// ==========================================

// --- Relaciones de User ---
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

// ==========================================
// Relaciones del Estudiante (CVs y Simulaciones)
// ==========================================

// --- Relaciones de Student ---
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

// Nueva característica: Simulación de entrevistas con IA
Student.hasMany(Simulation, {
  foreignKey: 'studentId',
  as: 'simulations',
  onDelete: 'CASCADE',
});

Simulation.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

// ==========================================
// Relaciones de Ofertas Laborales (Offer)
// ==========================================

// --- Relaciones de Offer ---
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

ResumeVersion.hasMany(Application, {
  foreignKey: 'resumeVersionId',
  as: 'applications',
  onDelete: 'SET NULL',
});

Application.belongsTo(ResumeVersion, {
  foreignKey: 'resumeVersionId',
  as: 'resumeVersion',
});

// Relaciones de Notification
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Relaciones de CVAnalysis
Student.hasMany(CVAnalysis, {
  foreignKey: 'studentId',
  as: 'cvAnalyses',
  onDelete: 'CASCADE',
});

CVAnalysis.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

Resume.hasMany(CVAnalysis, {
  foreignKey: 'resumeId',
  as: 'cvAnalyses',
  onDelete: 'CASCADE',
});

CVAnalysis.belongsTo(Resume, {
  foreignKey: 'resumeId',
  as: 'resume',
});

Offer.hasMany(CVAnalysis, {
  foreignKey: 'offerId',
  as: 'cvAnalyses',
  onDelete: 'SET NULL',
});

CVAnalysis.belongsTo(Offer, {
  foreignKey: 'offerId',
  as: 'offer',
});

// ==========================================
// Relaciones de Alertas y Empresas Seguidas (HU-13, HU-21)
// ==========================================

// --- Relaciones de AlertSettings ---
Student.hasOne(AlertSettings, {
  foreignKey: 'studentId',
  as: 'alertSettings',
  onDelete: 'CASCADE',
});

AlertSettings.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

// --- Relaciones de SavedCompany ---
Student.belongsToMany(Company, {
  through: SavedCompany,
  foreignKey: 'studentId',
  otherKey: 'companyId',
  as: 'followedCompanies',
});

Company.belongsToMany(Student, {
  through: SavedCompany,
  foreignKey: 'companyId',
  otherKey: 'studentId',
  as: 'followers',
});

SavedCompany.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

SavedCompany.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company',
});

// --- Relaciones de AlertHistory ---
Student.hasMany(AlertHistory, {
  foreignKey: 'studentId',
  as: 'alertHistory',
  onDelete: 'CASCADE',
});

AlertHistory.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

Offer.hasMany(AlertHistory, {
  foreignKey: 'offerId',
  as: 'alertHistory',
  onDelete: 'CASCADE',
});

AlertHistory.belongsTo(Offer, {
  foreignKey: 'offerId',
  as: 'offer',
});


// ==========================================
// Relaciones de Mensajes Directos (HU-24, HU-25, HU-26)
// ==========================================

// --- Relaciones de DirectMessage ---
User.hasMany(DirectMessage, {
  foreignKey: 'senderId',
  as: 'sentMessages',
  onDelete: 'CASCADE',
});

DirectMessage.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender',
});

User.hasMany(DirectMessage, {
  foreignKey: 'receiverId',
  as: 'receivedMessages',
  onDelete: 'CASCADE',
});

DirectMessage.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver',
});

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
  Application,
  Simulation,
  Notification,
  CVAnalysis,
  AlertSettings,
  SavedCompany,
  AlertHistory,
  DirectMessage,
};
