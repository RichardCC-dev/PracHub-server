'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ResumeVersions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      profile: {
        type: Sequelize.JSON,
        allowNull: true,
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
      certifications: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      completion_percentage: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      template: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      pdf_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ResumeVersions', ['student_id', 'created_at'], {
      name: 'idx_resume_versions_student_created',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('ResumeVersions', 'idx_resume_versions_student_created');
    await queryInterface.dropTable('ResumeVersions');
  },
};
