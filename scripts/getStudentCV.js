const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

const { Student, Resume, User } = require('../src/models');
const recommendationService = require('../src/services/recommendationService');

async function check() {
  try {
    await sequelize.authenticate();
    
    // Buscar al estudiante
    const student = await Student.findOne({
      where: {
        firstName: 'Jose Richard',
        lastName: 'Castillo Carranza'
      },
      include: [
        { model: User, as: 'user' },
        { model: Resume, as: 'resume' }
      ]
    });

    if (!student) {
      console.log('Estudiante no encontrado.');
      process.exit(1);
    }

    console.log('Estudiante encontrado:', student.id);
    
    if (!student.resume) {
      console.log('El estudiante no tiene CV.');
      process.exit(1);
    }

    const textProfile = await recommendationService.buildStudentTextProfile(student.id);
    console.log('Texto del CV para matching:');
    console.log(textProfile);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
