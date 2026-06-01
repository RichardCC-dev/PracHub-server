'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar columna resume_version_id a la tabla applications
    await queryInterface.addColumn('applications', 'resume_version_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'ResumeVersions',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    // Crear índice para consultas por resume_version_id
    await queryInterface.addIndex('applications', ['resume_version_id'], {
      name: 'idx_applications_resume_version_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('applications', 'idx_applications_resume_version_id');
    await queryInterface.removeColumn('applications', 'resume_version_id');
  },
};
