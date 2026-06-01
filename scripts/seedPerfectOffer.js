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

const { Company, Offer } = require('../src/models');

async function seedPerfectOffer() {
  try {
    await sequelize.authenticate();
    
    // Obtener la empresa de prueba
    const company = await Company.findOne();
    if (!company) {
      console.log('No hay empresa creada');
      process.exit(1);
    }

    const perfectOffer = {
      companyId: company.id,
      title: 'Desarrollador Fullstack en React, Node.js y Python (IA)',
      description: 'Buscamos un Desarrollador Fullstack apasionado por crear plataformas de búsqueda con IA. Tendrás la oportunidad de trabajar con React, Node.js y Python para sistemas de gestión (valorable experiencia en gestión veterinaria). Buscamos estudiantes de Ingeniería de Software de la Universidad Nacional Mayor de San Marcos.',
      requirements: '- Estudiante de Ingeniería de Software (Universidad Nacional Mayor de San Marcos)\n- Manejo de React, Node.js y Python\n- Interés por plataformas de búsqueda con IA\n- Experiencia en sistemas de gestión (veterinaria u otros)',
      area: 'Tecnología',
      careerTags: ['Ingeniería de Software'],
      modality: 'remoto',
      duration: '6 meses',
      compensation: 'S/ 1,500 mensual',
      status: 'approved'
    };

    await Offer.create(perfectOffer);
    
    console.log('✅ Oferta con >80% de matching creada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedPerfectOffer();
