const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    firstName: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'last_name',
    },
    university: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    career: {
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    cycle: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    availability: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'phone_number',
    },
    profilePictureUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_picture_url',
    },
  },
  {
    tableName: 'Students',
  },
);

module.exports = Student;
