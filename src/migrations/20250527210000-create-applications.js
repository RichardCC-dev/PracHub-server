'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
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
        onDelete: 'CASCADE',
      },
      offer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'offers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      resume_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'Resumes',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      cover_letter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('enviada', 'revision', 'descartada', 'aceptada'),
        allowNull: false,
        defaultValue: 'enviada',
      },
      applied_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      company_response_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      company_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Crear índice único para evitar postulaciones duplicadas
    await queryInterface.addIndex('applications', ['student_id', 'offer_id'], {
      unique: true,
      name: 'unique_student_offer_application',
    });

    // Crear índices para consultas frecuentes
    await queryInterface.addIndex('applications', ['student_id']);
    await queryInterface.addIndex('applications', ['offer_id']);
    await queryInterface.addIndex('applications', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('applications');
  },
};
