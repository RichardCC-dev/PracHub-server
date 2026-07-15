const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Cargar variables de entorno
dotenv.config();

const { sequelize, User, Company, Offer } = require('../src/models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // Verificar si existe al menos una empresa
    let company = await Company.findOne();
    
    // Si no existe, crear una empresa de prueba
    if (!company) {
      console.log('No se encontraron empresas. Creando empresa de prueba...');
      
      // Crear un usuario para la empresa
      const passwordHash = await bcrypt.hash(
        process.env.SEED_COMPANY_PASSWORD || 'password123',
        12
      );
      const user = await User.create({
        email: 'empresa_test@ejemplo.com',
        passwordHash,
        role: 'company',
        authProvider: 'local',
        isEmailVerified: true,
      });

      company = await Company.create({
        userId: user.id,
        taxId: '20123456789',
        tradeName: 'Tech Solutions SAC',
        legalName: 'Tech Solutions SAC',
        description: 'Empresa líder en desarrollo de software y tecnología.',
        websiteUrl: 'https://www.techsolutions.com',
        industry: 'Tecnología',
        companySize: 'small',
        country: 'Perú',
        city: 'Lima',
        address: 'Av. Javier Prado Este 123, San Borja, Lima',
        responsibleName: 'Ana Torres',
        responsiblePosition: 'Jefa de Recursos Humanos',
        responsiblePhone: '999888777',
        verificationStatus: 'verified',
        isVerified: true,
        canPublishOffers: true,
      });
      
      console.log(`Empresa de prueba creada con ID: ${company.id}`);
    }

    console.log('Creando ofertas de prueba asociadas a la empresa...');

    const offers = [
      {
        companyId: company.id,
        title: 'Practicante de Desarrollo Web (React/Node.js)',
        description: 'Buscamos estudiante de ingeniería de software o sistemas para prácticas pre-profesionales en desarrollo fullstack. Participará en la creación de nuevas funcionalidades para nuestra plataforma principal.',
        requirements: '- Conocimientos sólidos en JavaScript/TypeScript\n- Familiaridad con React y Node.js\n- Nociones básicas de bases de datos relacionales (MySQL/PostgreSQL)\n- Disponibilidad de 30 horas semanales',
        area: 'Tecnología / Desarrollo',
        careerTags: ['Ingeniería de Software', 'Ingeniería de Sistemas', 'Ciencias de la Computación'],
        modality: 'remote',
        duration: '6 meses',
        compensation: 'S/ 1,200 mensual',
        status: 'approved' // Estado aprobado para que sean visibles y recomendables
      },
      {
        companyId: company.id,
        title: 'Practicante de Ciencia de Datos e IA',
        description: 'Buscamos talento para unirse a nuestro equipo de innovación. Participarás en la limpieza de datos, entrenamiento de modelos de machine learning y visualización de resultados.',
        requirements: '- Conocimiento intermedio/avanzado de Python (Pandas, Numpy, Scikit-learn)\n- Nociones de NLP (Natural Language Processing)\n- Inglés técnico nivel intermedio\n- Deseable: experiencia previa con TensorFlow o PyTorch',
        area: 'Tecnología / Data Science',
        careerTags: ['Ciencias de la Computación', 'Ingeniería Estadística', 'Ingeniería de Sistemas', 'Matemática'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,500 mensual',
        status: 'approved'
      },
      {
        companyId: company.id,
        title: 'Practicante de Diseño UX/UI',
        description: 'Buscamos un estudiante apasionado por el diseño de interfaces y la experiencia de usuario para apoyar en el rediseño de nuestras aplicaciones móviles y web.',
        requirements: '- Manejo avanzado de Figma o Adobe XD\n- Conocimientos en principios de diseño centrado en el usuario\n- Armado de prototipos interactivos\n- Portafolio de proyectos académicos (indispensable)',
        area: 'Diseño',
        careerTags: ['Diseño Gráfico', 'Ingeniería de Sistemas', 'Comunicaciones'],
        modality: 'remote',
        duration: '3 meses',
        compensation: 'S/ 1,025 mensual',
        status: 'approved'
      },
      {
        companyId: company.id,
        title: 'Practicante de Marketing Digital',
        description: 'Apoyo en la ejecución de estrategias de marketing digital, gestión de redes sociales, creación de contenido y monitoreo de campañas SEM/SEO.',
        requirements: '- Estudiante de últimos ciclos de Marketing o afines\n- Excelente redacción y ortografía\n- Manejo de herramientas de diseño básicas (Canva)\n- Conocimiento básico de Google Analytics y Meta Ads',
        area: 'Marketing',
        careerTags: ['Marketing', 'Comunicaciones', 'Administración'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,025 mensual',
        status: 'approved'
      },
      {
        companyId: company.id,
        title: 'Practicante de Recursos Humanos (Selección TI)',
        description: 'Apoyo en procesos de reclutamiento y selección de perfiles tecnológicos, filtro de currículums, entrevistas iniciales y gestión del clima laboral.',
        requirements: '- Estudiante de Psicología Organizacional o Administración\n- Interés por el mundo de la tecnología\n- Excelentes habilidades de comunicación\n- Proactividad y organización',
        area: 'Recursos Humanos',
        careerTags: ['Psicología', 'Administración', 'Gestión de Recursos Humanos'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,100 mensual',
        status: 'approved'
      }
    ];

    for (const offerData of offers) {
      await Offer.create(offerData);
    }

    console.log('✅ ¡Se han creado 5 ofertas de prueba correctamente en estado APROBADO!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed:', error);
    process.exit(1);
  }
}

seed();
