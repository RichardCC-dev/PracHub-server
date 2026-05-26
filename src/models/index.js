const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Company = require('./Company');
const PasswordResetToken = require('./PasswordResetToken');
const EmailVerificationToken = require('./EmailVerificationToken');
const Resume = require('./Resume');

[
  { name: 'User', model: User },
  { name: 'Student', model: Student },
  { name: 'Company', model: Company },
  { name: 'PasswordResetToken', model: PasswordResetToken },
  { name: 'EmailVerificationToken', model: EmailVerificationToken },
  { name: 'Resume', model: Resume }
].forEach(item => {
  if (!item.model || !item.model.prototype || !item.model.prototype.constructor.name) {
    throw new Error(`¡El modelo ${item.name} no se cargó correctamente! Revisa el archivo ${item.name}.js`);
  }
});

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

Student.hasOne(Resume, {
  foreignKey: 'studentId',
  as: 'resume',
  onDelete: 'CASCADE',
});

Resume.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student',
});

module.exports = {
  sequelize,
  User,
  Student,
  Company,
  PasswordResetToken,
  EmailVerificationToken,
  Resume,
};
