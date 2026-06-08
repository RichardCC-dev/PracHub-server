const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Student,
  Company,
  Resume,
  Offer,
  AlertSettings,
} = require('../src/models');

const STUDENT_EMAIL = 'teststudent_alerts@prachub.local';
const COMPANY_EMAIL = 'testcompany_alerts@prachub.local';

async function ensureStudent() {
  let user = await User.findOne({ where: { email: STUDENT_EMAIL } });
  if (!user) {
    const hash = await bcrypt.hash('TestPass123', 12);
    user = await User.create({
      email: STUDENT_EMAIL,
      passwordHash: hash,
      role: 'student',
      authProvider: 'local',
      isEmailVerified: true,
    });
    console.log(`  Usuario estudiante creado: ${user.email} (id=${user.id})`);
  } else {
    console.log(`  Usuario estudiante existente: ${user.email} (id=${user.id})`);
  }

  let student = await Student.findOne({ where: { userId: user.id } });
  if (!student) {
    student = await Student.create({
      userId: user.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      university: 'Universidad Nacional Mayor de San Marcos',
      career: 'Ingeniería de Software',
      cycle: '8vo',
      availability: 'Tiempo completo',
      bio: 'Desarrollador fullstack apasionado por React, Node.js y Python. Interés en plataformas web, sistemas de gestión y bases de datos MySQL.',
      phoneNumber: '987654321',
    });
    console.log(`  Estudiante creado: id=${student.id}`);
  } else {
    console.log(`  Estudiante existente: id=${student.id}`);
  }

  let resume = await Resume.findOne({ where: { studentId: student.id } });
  if (!resume) {
    resume = await Resume.create({
      studentId: student.id,
      profile: {
        summary:
          'Desarrollador fullstack con experiencia en React, Node.js, JavaScript, HTML, CSS, Python y MySQL. Apasionado por crear plataformas web y sistemas de gestión.',
      },
      skills: {
        areas: [
          { area: 'Desarrollo Web Frontend', skills: 'React JavaScript HTML CSS Tailwind TypeScript Redux' },
          { area: 'Desarrollo Backend', skills: 'Node.js Express Python Django REST API GraphQL MySQL PostgreSQL' },
          { area: 'DevOps y Herramientas', skills: 'Git Docker AWS Linux' },
        ],
        soft: 'Trabajo en equipo, comunicación efectiva, proactividad, resolución de problemas, autodidacta',
      },
      education: {
        items: [
          { degree: 'Ingeniería de Software', institution: 'Universidad Nacional Mayor de San Marcos', fieldOfStudy: 'Ingeniería de Software' },
        ],
      },
      experience: {
        items: [
          { role: 'Desarrollador Web Junior', company: 'Startup Local', description: 'Desarrollo de aplicaciones web con React y Node.js. Gestión de bases de datos MySQL. Implementación de APIs REST. Trabajo en equipo con metodologías ágiles.' },
        ],
      },
      languages: { list: 'Inglés técnico avanzado, Español nativo' },
      projects: {
        items: [
          { title: 'Plataforma de Gestión Interna', description: 'Sistema de gestión interna usando React, Node.js, Express y MySQL. Incluye autenticación JWT, dashboards y reportes.' },
          { title: 'App de Búsqueda con IA', description: 'Aplicación de búsqueda inteligente usando Python, NLP y TF-IDF para matching de perfiles.' },
        ],
      },
      certifications: {
        items: [
          { name: 'Fullstack JavaScript Developer', issuer: 'FreeCodeCamp' },
          { name: 'Python for Data Science', issuer: 'Coursera' },
        ],
      },
    });
    console.log(`  Resume creado: id=${resume.id}`);
  } else {
    console.log(`  Resume existente: id=${resume.id}`);
  }

  return { user, student };
}

async function ensureCompany() {
  let user = await User.findOne({ where: { email: COMPANY_EMAIL } });
  if (!user) {
    const hash = await bcrypt.hash('TestPass123', 12);
    user = await User.create({
      email: COMPANY_EMAIL,
      passwordHash: hash,
      role: 'company',
      authProvider: 'local',
      isEmailVerified: true,
    });
    console.log(`  Usuario empresa creado: ${user.email} (id=${user.id})`);
  } else {
    console.log(`  Usuario empresa existente: ${user.email} (id=${user.id})`);
  }

  let company = await Company.findOne({ where: { userId: user.id } });
  if (!company) {
    company = await Company.create({
      userId: user.id,
      taxId: '20987654321',
      legalName: 'TechNova Solutions SAC',
      tradeName: 'TechNova',
      description: 'Empresa de desarrollo de software especializada en plataformas web, sistemas de gestión y soluciones cloud.',
      industry: 'Tecnología',
      companySize: 'medium',
      responsibleName: 'María García',
      responsiblePosition: 'Gerente de RRHH',
      responsiblePhone: '999888777',
      country: 'Perú',
      city: 'Lima',
      address: 'Av. Arequipa 1234, Miraflores',
      verificationStatus: 'verified',
      isVerified: true,
      canPublishOffers: true,
    });
    console.log(`  Empresa creada: ${company.legalName} (id=${company.id})`);
  } else {
    await company.update({ canPublishOffers: true });
    console.log(`  Empresa existente: ${company.legalName} (id=${company.id})`);
  }

  return { user, company };
}

// Eliminamos setAlertThreshold ya que minCompatibility ya no existe en el AlertSettings o no es configurable

function buildOffers(companyId) {
  return [
    {
      companyId,
      title: 'Practicante de Desarrollo Web Fullstack - React y Node.js',
      description: 'Buscamos estudiante de Ingeniería de Software de la Universidad Nacional Mayor de San Marcos para prácticas pre-profesionales en desarrollo web. Participarás en la creación de plataformas web modernas usando React, JavaScript, HTML, CSS y Node.js. Trabajarás con bases de datos MySQL, APIs REST y metodologías ágiles.',
      requirements: '- Estudiante de Ingeniería de Software (UNMSM preferible)\n- Conocimientos en React, JavaScript, HTML, CSS\n- Familiaridad con Node.js, Express y MySQL\n- Experiencia en desarrollo web y plataformas\n- Trabajo en equipo, proactividad y comunicación\n- Inglés técnico avanzado deseable',
      area: 'Desarrollo Web',
      careerTags: ['Ingeniería de Software', 'Ciencias de la Computación'],
      modality: 'remote',
      duration: '6 meses',
      compensation: 'S/ 1,500 mensual',
    },
    {
      companyId,
      title: 'Desarrollador Python y JavaScript para Sistemas de Gestión',
      description: 'En TechNova buscamos talento apasionado por Python, Django, Node.js y React. Trabajarás en proyectos de sistemas de gestión y plataformas web para clientes de diversos sectores.',
      requirements: '- Estudiante de Ingeniería de Software\n- Manejo de Python, Django, Node.js y React\n- Conocimiento de MySQL y PostgreSQL\n- Experiencia en desarrollo de plataformas web\n- Resolución de problemas y autodidacta\n- Git, Docker y AWS son un plus',
      area: 'Desarrollo de Software',
      careerTags: ['Ingeniería de Software', 'Ingeniería de Sistemas'],
      modality: 'hybrid',
      duration: '6 meses',
      compensation: 'S/ 1,600 mensual',
    },
    {
      companyId,
      title: 'Practicante Frontend React - Plataformas Web',
      description: 'Buscamos estudiante de Ingeniería de Software para unirse a nuestro equipo de frontend. Desarrollarás interfaces modernas con React, JavaScript, HTML y CSS.',
      requirements: '- Estudiante avanzado de Ingeniería de Software\n- Dominio de React, JavaScript, HTML, CSS\n- Conocimiento de REST APIs y Node.js\n- Experiencia en plataformas web\n- Trabajo en equipo y comunicación efectiva',
      area: 'Frontend Development',
      careerTags: ['Ingeniería de Software', 'Diseño UX/UI'],
      modality: 'remote',
      duration: '4 meses',
      compensation: 'S/ 1,200 mensual',
    },
  ];
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('\n🟢 Conectado a la base de datos.\n');

    console.log('1️⃣  Creando/verificando estudiante...');
    const { user: studentUser, student } = await ensureStudent();

    console.log('\n2️⃣  Creando/verificando empresa...');
    const { company } = await ensureCompany();

    console.log('\n3️⃣  Configurando alertas del estudiante...');
    let settings = await AlertSettings.findOne({ where: { studentId: student.id } });
    if (!settings) {
      await AlertSettings.create({
        studentId: student.id,
        frequency: 'immediate',
        emailEnabled: true,
        platformEnabled: true,
      });
      console.log(`  AlertSettings creado`);
    } else {
      console.log(`  AlertSettings ya existente`);
    }

    console.log('\n4️⃣  Creando ofertas (status=approved)...');
    const offerTemplates = buildOffers(company.id);
    for (const tpl of offerTemplates) {
      const [offer, created] = await Offer.findOrCreate({
        where: { title: tpl.title, companyId: company.id },
        defaults: { ...tpl, status: 'approved' },
      });
      if (!created) {
        await offer.update({ status: 'approved' });
        console.log(`  Oferta actualizada: "${offer.title}" (id=${offer.id})`);
      } else {
        console.log(`  Oferta creada: "${offer.title}" (id=${offer.id})`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  DATOS DE PRUEBA LISTOS');
    console.log('═══════════════════════════════════════');
    console.log(`\n  👨‍🎓 Estudiante:`);
    console.log(`     Email:    ${STUDENT_EMAIL}`);
    console.log(`     Password: TestPass123`);
    console.log(`     CV:       Resume id=${student.id} (skills: React, Node.js, Python, MySQL)`);
    console.log(`     Alerta:   frecuencia inmediata`);
    console.log(`\n  🏢 Empresa:`);
    console.log(`     Email:    ${COMPANY_EMAIL}`);
    console.log(`     Password: TestPass123`);
    console.log(`     Nombre:   TechNova Solutions SAC`);
    console.log(`\n  📋 3 ofertas aprobadas listas en /offers`);
    console.log(`\n  🔧 Para probar:`);
    console.log(`     1. Inicia sesión como ${STUDENT_EMAIL}`);
    console.log(`     2. Ve a "Ver ofertas disponibles" → deberías ver las 3 ofertas`);
    console.log(`     3. Las ofertas tienen texto compatible con el CV del estudiante`);
    console.log(`     4. Si el sistema de alertas funciona, deberías recibir notificaciones`);
    console.log(`\n  🧹 Para limpiar: node server/scripts/cleanupTestAlerts.js`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

run();
