'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Resumes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'Students',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      personal: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      education: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      experience: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      skills: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      languages: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      projects: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      completion_percentage: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Resumes');
  },
};
