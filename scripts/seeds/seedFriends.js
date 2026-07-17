/**
 * seedFriends.js — Seed adicional que extiende seedMassive.js y seedExtra.js.
 *
 * Crea (encima de los seeds anteriores):
 *   - 20 estudiantes nuevos:
 *       · 5 amigos de otras universidades peruanas (UTP, UPC, ISIL, ESAN)
 *       · 15 compañeros de UNMSM (Escuela de Ing. de Software y Escuela de Ing. de Sistemas)
 *   - Resume + ResumeVersion + AlertSettings por estudiante
 *   - Applications a ofertas existentes (afines a TI cuando sea posible)
 *   - SavedCompanies, Simulations y Notifications
 *
 * NO crea empresas ni ofertas nuevas: reutiliza las de los seeds anteriores.
 *
 * Requisito: ejecutar seedMassive.js y seedExtra.js PRIMERO.
 *
 * Uso:
 *   node scripts/seeds/seedFriends.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker/locale/es');

const {
  sequelize,
  User,
  Student,
  Company,
  Resume,
  ResumeVersion,
  Offer,
  Application,
  Notification,
  AlertSettings,
  AlertHistory,
  SavedCompany,
  Simulation,
} = require('../../src/models');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════
const PASSWORD = 'TestPass123!';

// Dominios institucionales por universidad
const UNMSM = 'Universidad Nacional Mayor de San Marcos';
const UTP = 'Universidad Tecnológica del Perú';
const UPC = 'Universidad Peruana de Ciencias Aplicadas';
const ISIL = 'Instituto San Ignacio de Loyola';
const ESAN = 'Universidad ESAN';

const UNI_DOMAINS = {
  [UNMSM]: 'unmsm.edu.pe',
  [UTP]: 'utp.edu.pe',
  [UPC]: 'upc.edu.pe',
  [ISIL]: 'isil.pe',
  [ESAN]: 'ue.edu.pe', // dominio de estudiantes de pregrado de Universidad ESAN
};

// Normaliza un nombre para usarlo en un correo: minúsculas, sin tildes ni ñ
function normalizeForEmail(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/ñ/g, 'n')
    .replace(/[^a-z]/g, ''); // solo letras
}

// Genera correo institucional: primernombre.primerapellido@dominio
function buildEmail(p) {
  const first = normalizeForEmail(p.firstName.split(' ')[0]);
  const last = normalizeForEmail(p.lastName.split(' ')[0]);
  const domain = UNI_DOMAINS[p.university] || 'prachub.test';
  return `${first}.${last}@${domain}`;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPER: construir un CV completo a partir de un perfil compacto
// ═══════════════════════════════════════════════════════════════════════
function buildCv(p) {
  return {
    profile: { summary: p.summary },
    skills: {
      areas: p.skillAreas,
      soft: p.soft || 'Trabajo en equipo, comunicación, proactividad, aprendizaje continuo',
    },
    education: {
      items: [
        {
          degree: p.career,
          institution: p.university,
          fieldOfStudy: p.career,
        },
      ],
    },
    experience: {
      items: [
        {
          role: p.expRole,
          company: p.expCompany,
          description: p.expDescription,
        },
      ],
    },
    languages: { list: p.languages || 'Inglés intermedio, Español nativo' },
    projects: { items: [{ title: p.projectTitle, description: p.projectDescription }] },
    certifications: { items: [{ name: p.certName, issuer: p.certIssuer }] },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PERFILES — 5 AMIGOS DE OTRAS UNIVERSIDADES
// ═══════════════════════════════════════════════════════════════════════
const FRIEND_PROFILES = [
  {
    firstName: 'Miguel',
    lastName: 'Azaña Verde',
    university: UTP,
    career: 'Negocios Internacionales',
    cycle: '9no ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Negocios Internacionales en UTP, enfocado en comercio exterior, logística internacional y gestión aduanera.',
    summary: 'Estudiante de Negocios Internacionales con experiencia en comercio exterior, gestión aduanera y logística internacional. Conocimientos en Incoterms 2020, documentación de exportación e importación y análisis de mercados.',
    skillAreas: [
      { area: 'Comercio Exterior', skills: 'Incoterms exportaciones importaciones aduanas SUNAT regímenes aduaneros documentación comercial' },
      { area: 'Logística Internacional', skills: 'Transporte internacional cadena de suministro fletes carga distribución física internacional' },
      { area: 'Análisis de Mercados', skills: 'Investigación de mercados internacionales tratados de libre comercio TLC Excel Power BI básico' },
    ],
    expRole: 'Practicante de Comercio Exterior',
    expCompany: 'Neptunia S.A.',
    expDescription: 'Apoyo en gestión documentaria de exportaciones e importaciones. Coordinación con agentes de aduana y seguimiento de embarques.',
    projectTitle: 'Plan de Exportación de Superalimentos',
    projectDescription: 'Plan de exportación de quinua y maca al mercado europeo: análisis de mercado, costos logísticos, Incoterms y requisitos sanitarios.',
    certName: 'Diplomado en Gestión Aduanera',
    certIssuer: 'ADEX',
    languages: 'Inglés avanzado, Portugués básico, Español nativo',
  },
  {
    firstName: 'Rodrigo',
    lastName: 'Rojas',
    university: UPC,
    career: 'Ingeniería de Gestión Empresarial',
    cycle: '8vo ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Gestión Empresarial en UPC, orientado a la mejora de procesos y la gestión de operaciones.',
    summary: 'Estudiante de Ingeniería de Gestión Empresarial con experiencia en mejora continua, gestión de procesos e indicadores de gestión. Manejo de Lean, Six Sigma básico, Bizagi y Excel avanzado.',
    skillAreas: [
      { area: 'Mejora de Procesos', skills: 'Lean Six Sigma mejora continua BPMN Bizagi mapeo de procesos 5S kaizen' },
      { area: 'Gestión de Operaciones', skills: 'Indicadores KPI planificación de operaciones gestión de inventarios costos productividad' },
      { area: 'Herramientas', skills: 'Excel avanzado Power BI Minitab gestión de proyectos Scrum básico' },
    ],
    expRole: 'Practicante de Mejora Continua',
    expCompany: 'Aje Group',
    expDescription: 'Levantamiento y documentación de procesos operativos. Propuestas de mejora con enfoque Lean y seguimiento de KPIs.',
    projectTitle: 'Optimización de Línea de Producción',
    projectDescription: 'Proyecto de mejora con Lean: reducción de tiempos muertos en línea de envasado mediante análisis de cuellos de botella y 5S.',
    certName: 'Yellow Belt Six Sigma',
    certIssuer: 'CertiProf',
  },
  {
    firstName: 'Miguel',
    lastName: 'Orihuela Paucar',
    university: UPC,
    career: 'Arquitectura',
    cycle: '9no ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Arquitectura en UPC, interesado en diseño urbano, vivienda social y modelado BIM.',
    summary: 'Estudiante de Arquitectura con experiencia en diseño arquitectónico, modelado BIM y renderizado. Dominio de Revit, AutoCAD, SketchUp, Lumion y Adobe Creative Suite.',
    skillAreas: [
      { area: 'Diseño Arquitectónico', skills: 'Revit AutoCAD SketchUp modelado BIM planos arquitectónicos anteproyectos detalles constructivos' },
      { area: 'Visualización', skills: 'Lumion V-Ray renderizado fotorrealista Photoshop Illustrator InDesign portafolio láminas' },
      { area: 'Urbanismo', skills: 'Diseño urbano vivienda social espacio público normativa RNE parámetros urbanísticos' },
    ],
    expRole: 'Practicante de Arquitectura',
    expCompany: 'DLPS Arquitectos',
    expDescription: 'Desarrollo de planos y modelado BIM en Revit para proyectos residenciales. Elaboración de renders y láminas de presentación.',
    projectTitle: 'Conjunto de Vivienda Social Progresiva',
    projectDescription: 'Anteproyecto de vivienda social en Lima Norte: diseño modular progresivo, modelado en Revit y renderizado en Lumion.',
    certName: 'Autodesk Revit Architecture Certification',
    certIssuer: 'Autodesk',
  },
  {
    firstName: 'Juan Pablo',
    lastName: 'Andres Guzman',
    university: ISIL,
    career: 'Diseño Gráfico',
    cycle: '5to ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Diseño Gráfico en ISIL, apasionado por el branding, la ilustración digital y el diseño para redes sociales.',
    summary: 'Estudiante de Diseño Gráfico con experiencia en branding, diseño editorial y contenido para redes sociales. Dominio de Adobe Illustrator, Photoshop, InDesign y Figma.',
    skillAreas: [
      { area: 'Diseño Gráfico', skills: 'Adobe Illustrator Photoshop InDesign branding identidad visual diseño editorial tipografía' },
      { area: 'Digital', skills: 'Figma diseño para redes sociales motion graphics básico After Effects Canva contenido digital' },
      { area: 'Ilustración', skills: 'Ilustración digital Procreate vectorización dibujo conceptual dirección de arte básica' },
    ],
    expRole: 'Practicante de Diseño Gráfico',
    expCompany: 'Agencia Fahrenheit DDB',
    expDescription: 'Diseño de piezas para redes sociales y campañas digitales. Apoyo en desarrollo de identidad visual para marcas.',
    projectTitle: 'Rebranding de Cafetería Local',
    projectDescription: 'Rediseño de identidad visual completa: logotipo, paleta, tipografía, packaging y plantillas para redes sociales.',
    certName: 'Adobe Certified Professional - Graphic Design',
    certIssuer: 'Adobe',
  },
  {
    firstName: 'Julio',
    lastName: 'Renzo', // TODO: completar apellido real si se requiere
    university: ESAN,
    career: 'Psicología Organizacional',
    cycle: '7mo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Psicología Organizacional en ESAN, orientado a la gestión del talento, selección de personal y clima laboral.',
    summary: 'Estudiante de Psicología Organizacional con experiencia en procesos de selección, evaluación psicolaboral, clima organizacional y capacitación. Manejo de pruebas psicométricas y entrevistas por competencias.',
    skillAreas: [
      { area: 'Atracción de Talento', skills: 'Reclutamiento selección entrevistas por competencias assessment center headhunting LinkedIn Recruiter' },
      { area: 'Desarrollo Organizacional', skills: 'Clima laboral cultura organizacional capacitación evaluación de desempeño planes de desarrollo' },
      { area: 'Evaluación', skills: 'Pruebas psicométricas evaluación psicolaboral informes de selección Excel People Analytics básico' },
    ],
    expRole: 'Practicante de Recursos Humanos',
    expCompany: 'Manpower Perú',
    expDescription: 'Apoyo en procesos de reclutamiento y selección masiva. Aplicación de pruebas psicométricas y elaboración de informes psicolaborales.',
    projectTitle: 'Diagnóstico de Clima Organizacional',
    projectDescription: 'Estudio de clima laboral en empresa de servicios: diseño de encuesta, análisis de resultados y plan de acción por dimensiones.',
    certName: 'Certificación en Gestión del Talento Humano',
    certIssuer: 'ESAN',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// PERFILES — 15 COMPAÑEROS UNMSM (8 Ing. de Software, 7 Ing. de Sistemas)
// ═══════════════════════════════════════════════════════════════════════
const UNMSM_SOFTWARE = [
  {
    firstName: 'Diego', lastName: 'Huamán Quispe', cycle: '8vo ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, enfocado en desarrollo backend con Node.js.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en backend Node.js, APIs REST y bases de datos SQL/NoSQL.',
    skillAreas: [
      { area: 'Backend', skills: 'Node.js Express Sequelize APIs REST JWT MongoDB PostgreSQL' },
      { area: 'Testing', skills: 'Jest Supertest pruebas unitarias integración TDD' },
    ],
    expRole: 'Practicante Backend', expCompany: 'NTT Data Perú',
    expDescription: 'Desarrollo de microservicios en Node.js y mantenimiento de APIs REST con Express y Sequelize.',
    projectTitle: 'API de Gestión Académica', projectDescription: 'API REST con Node.js, Express y PostgreSQL para matrícula y notas. Documentada con Swagger.',
    certName: 'JavaScript Algorithms and Data Structures', certIssuer: 'freeCodeCamp',
  },
  {
    firstName: 'Andrea', lastName: 'Flores Mamani', cycle: '7mo ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, apasionada por el frontend y la accesibilidad web.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en frontend React, accesibilidad web y diseño responsivo.',
    skillAreas: [
      { area: 'Frontend', skills: 'React JavaScript TypeScript HTML CSS Tailwind accesibilidad WCAG' },
      { area: 'Herramientas', skills: 'Git Figma Vite testing library Storybook' },
    ],
    expRole: 'Practicante Frontend', expCompany: 'Belcorp',
    expDescription: 'Desarrollo de componentes React reutilizables y mejoras de accesibilidad en portales internos.',
    projectTitle: 'Portal Web Accesible para Biblioteca', projectDescription: 'SPA en React con enfoque en accesibilidad WCAG 2.1 y diseño responsivo.',
    certName: 'Meta Front-End Developer', certIssuer: 'Coursera - Meta',
  },
  {
    firstName: 'José', lastName: 'Ccahuana Torres', cycle: '9no ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, interesado en arquitectura de software y microservicios.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en arquitectura de microservicios, Java Spring Boot y mensajería asíncrona.',
    skillAreas: [
      { area: 'Arquitectura', skills: 'Microservicios Spring Boot Java patrones de diseño DDD RabbitMQ' },
      { area: 'Cloud', skills: 'AWS EC2 S3 Docker Kubernetes básico CI/CD GitHub Actions' },
    ],
    expRole: 'Practicante de Desarrollo Java', expCompany: 'Banco de Crédito del Perú',
    expDescription: 'Desarrollo de microservicios bancarios con Spring Boot. Integración con colas de mensajería.',
    projectTitle: 'Sistema de Pagos con Microservicios', projectDescription: 'Arquitectura de microservicios con Spring Boot, RabbitMQ y Docker Compose.',
    certName: 'AWS Cloud Practitioner', certIssuer: 'Amazon Web Services',
  },
  {
    firstName: 'Lucía', lastName: 'Paredes Rojas', cycle: '6to ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, con interés en calidad de software y automatización de pruebas.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en QA, automatización de pruebas con Selenium y Cypress, y gestión de defectos.',
    skillAreas: [
      { area: 'QA Automation', skills: 'Selenium Cypress Postman pruebas E2E casos de prueba JIRA' },
      { area: 'Programación', skills: 'JavaScript Python SQL Git' },
    ],
    expRole: 'Practicante de QA', expCompany: 'Indra Perú',
    expDescription: 'Diseño y ejecución de casos de prueba. Automatización de regresión con Cypress.',
    projectTitle: 'Suite de Pruebas Automatizadas E-commerce', projectDescription: 'Framework de pruebas E2E con Cypress y reportes automáticos en CI.',
    certName: 'ISTQB Foundation Level - preparación', certIssuer: 'ISTQB',
  },
  {
    firstName: 'Kevin', lastName: 'Sánchez Vilca', cycle: '8vo ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, enfocado en desarrollo móvil Android nativo.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en desarrollo Android nativo con Kotlin, Jetpack Compose y arquitectura MVVM.',
    skillAreas: [
      { area: 'Android', skills: 'Kotlin Jetpack Compose MVVM Room Retrofit Firebase' },
      { area: 'Buenas Prácticas', skills: 'Clean Architecture inyección de dependencias Git testing' },
    ],
    expRole: 'Practicante Android', expCompany: 'Yape - BCP',
    expDescription: 'Desarrollo de features en app móvil con Kotlin y Jetpack Compose bajo arquitectura MVVM.',
    projectTitle: 'App de Finanzas Personales', projectDescription: 'App Android en Kotlin con Room y gráficos de gastos. Arquitectura limpia y tests unitarios.',
    certName: 'Android Developer Certification', certIssuer: 'Google - Coursera',
  },
  {
    firstName: 'Fiorella', lastName: 'Gutiérrez Salas', cycle: '7mo ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, interesada en desarrollo web y bases de datos.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en desarrollo web PHP/Laravel y administración de bases de datos MySQL.',
    skillAreas: [
      { area: 'Web', skills: 'PHP Laravel Blade JavaScript Bootstrap APIs REST' },
      { area: 'Bases de Datos', skills: 'MySQL modelado normalización triggers vistas' },
    ],
    expRole: 'Practicante de Desarrollo Web', expCompany: 'Municipalidad de Lima',
    expDescription: 'Mantenimiento de sistemas internos en Laravel y optimización de consultas MySQL.',
    projectTitle: 'Sistema de Trámite Documentario', projectDescription: 'Aplicación Laravel con MySQL para seguimiento de expedientes y reportes.',
    certName: 'Laravel Certified Developer - preparación', certIssuer: 'Laravel',
  },
  {
    firstName: 'Bruno', lastName: 'Chávez Ramos', cycle: '9no ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, con interés en DevOps y automatización de infraestructura.',
    summary: 'Estudiante de Ingeniería de Software con experiencia en DevOps: Docker, CI/CD, monitoreo y scripting en Linux.',
    skillAreas: [
      { area: 'DevOps', skills: 'Docker Kubernetes GitHub Actions Jenkins Terraform básico' },
      { area: 'Sistemas', skills: 'Linux Bash Python monitoreo Grafana Prometheus' },
    ],
    expRole: 'Practicante DevOps', expCompany: 'Interbank',
    expDescription: 'Mantenimiento de pipelines CI/CD y contenedorización de aplicaciones con Docker.',
    projectTitle: 'Pipeline CI/CD para Monorepo', projectDescription: 'Pipeline con GitHub Actions: build, tests, análisis estático y despliegue a contenedores.',
    certName: 'Docker Essentials', certIssuer: 'IBM - Cognitive Class',
  },
  {
    firstName: 'Alessandra', lastName: 'Mendoza Cruz', cycle: '5to ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Software en UNMSM, iniciándose en desarrollo web full stack.',
    summary: 'Estudiante de Ingeniería de Software con bases sólidas en programación, desarrollo web con JavaScript y trabajo colaborativo con Git.',
    skillAreas: [
      { area: 'Fundamentos', skills: 'JavaScript Python POO estructuras de datos SQL' },
      { area: 'Web', skills: 'HTML CSS React básico Node.js básico Git GitHub' },
    ],
    expRole: 'Asistente de Laboratorio de Programación', expCompany: 'FISI - UNMSM',
    expDescription: 'Apoyo en laboratorios de programación: revisión de ejercicios y soporte a estudiantes de primeros ciclos.',
    projectTitle: 'Gestor de Tareas Web', projectDescription: 'Aplicación CRUD con React y Node.js para gestión de tareas con autenticación básica.',
    certName: 'Responsive Web Design', certIssuer: 'freeCodeCamp',
  },
];

const UNMSM_SISTEMAS = [
  {
    firstName: 'Carlos', lastName: 'Quiñones Espinoza', cycle: '9no ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, orientado a inteligencia de negocios y analítica.',
    summary: 'Estudiante de Ingeniería de Sistemas con experiencia en Business Intelligence: Power BI, SQL, ETL y modelado dimensional.',
    skillAreas: [
      { area: 'Business Intelligence', skills: 'Power BI DAX SQL Server Integration Services ETL modelado dimensional' },
      { area: 'Datos', skills: 'SQL Python pandas Excel avanzado data warehouse' },
    ],
    expRole: 'Practicante de BI', expCompany: 'Rimac Seguros',
    expDescription: 'Construcción de dashboards en Power BI y procesos ETL con SSIS para reportes de gestión.',
    projectTitle: 'Data Mart de Ventas', projectDescription: 'Modelo estrella con SQL Server y dashboards Power BI para análisis comercial.',
    certName: 'Power BI Data Analyst Associate (PL-300)', certIssuer: 'Microsoft',
  },
  {
    firstName: 'María', lastName: 'Ticona Huanca', cycle: '8vo ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, interesada en gestión de proyectos TI y procesos.',
    summary: 'Estudiante de Ingeniería de Sistemas con experiencia en gestión de proyectos TI, levantamiento de procesos y metodologías ágiles.',
    skillAreas: [
      { area: 'Gestión TI', skills: 'Scrum PMBOK levantamiento de requerimientos BPMN Bizagi JIRA' },
      { area: 'Análisis', skills: 'UML casos de uso documentación funcional SQL Excel' },
    ],
    expRole: 'Practicante de Proyectos TI', expCompany: 'Telefónica del Perú',
    expDescription: 'Apoyo en seguimiento de proyectos, documentación funcional y modelado de procesos en BPMN.',
    projectTitle: 'Rediseño de Procesos de Atención', projectDescription: 'Modelado AS-IS/TO-BE en Bizagi y propuesta de automatización de flujo de atención al cliente.',
    certName: 'Scrum Master Certified (SMC) - preparación', certIssuer: 'SCRUMstudy',
  },
  {
    firstName: 'Jorge', lastName: 'Apaza Condori', cycle: '7mo ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, enfocado en redes y ciberseguridad.',
    summary: 'Estudiante de Ingeniería de Sistemas con conocimientos en redes, seguridad de la información y administración de servidores Linux.',
    skillAreas: [
      { area: 'Redes y Seguridad', skills: 'CCNA routing switching firewalls VPN análisis de vulnerabilidades' },
      { area: 'Infraestructura', skills: 'Linux Windows Server Active Directory virtualización VMware' },
    ],
    expRole: 'Practicante de Infraestructura TI', expCompany: 'Claro Perú',
    expDescription: 'Soporte en administración de redes, monitoreo de infraestructura y gestión de accesos.',
    projectTitle: 'Laboratorio de Seguridad de Redes', projectDescription: 'Simulación de red corporativa en Packet Tracer con segmentación, ACLs y VPN.',
    certName: 'CCNA: Introduction to Networks', certIssuer: 'Cisco Networking Academy',
  },
  {
    firstName: 'Rosa', lastName: 'Villanueva Ortiz', cycle: '6to ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, con interés en analítica de datos y automatización con Python.',
    summary: 'Estudiante de Ingeniería de Sistemas con experiencia en análisis de datos con Python y automatización de reportes.',
    skillAreas: [
      { area: 'Analítica', skills: 'Python pandas NumPy SQL visualización Matplotlib Power BI' },
      { area: 'Automatización', skills: 'Automatización de reportes openpyxl web scraping tareas programadas' },
    ],
    expRole: 'Practicante de Análisis de Datos', expCompany: 'SUNAT',
    expDescription: 'Automatización de reportes con Python y elaboración de tableros de control.',
    projectTitle: 'Automatización de Reportes Tributarios', projectDescription: 'Scripts Python para consolidar y validar datos, generando reportes Excel automáticos.',
    certName: 'Python for Data Science', certIssuer: 'IBM - Coursera',
  },
  {
    firstName: 'Óscar', lastName: 'Palomino Ríos', cycle: '9no ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, orientado a ERP y sistemas empresariales.',
    summary: 'Estudiante de Ingeniería de Sistemas con experiencia en soporte funcional de ERP (SAP), procesos logísticos y financieros.',
    skillAreas: [
      { area: 'ERP', skills: 'SAP MM SAP FI soporte funcional parametrización procesos empresariales' },
      { area: 'Complementos', skills: 'SQL Excel avanzado gestión de incidencias ITIL' },
    ],
    expRole: 'Practicante Funcional SAP', expCompany: 'Alicorp',
    expDescription: 'Soporte funcional a usuarios SAP MM, gestión de incidencias y documentación de procesos.',
    projectTitle: 'Manual de Procesos Logísticos en SAP', projectDescription: 'Documentación y optimización de flujos de compras y almacenes en SAP MM.',
    certName: 'ITIL 4 Foundation', certIssuer: 'PeopleCert',
  },
  {
    firstName: 'Claudia', lastName: 'Espino Dávila', cycle: '8vo ciclo', availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, interesada en transformación digital y gobierno de TI.',
    summary: 'Estudiante de Ingeniería de Sistemas con conocimientos en gobierno de TI, auditoría de sistemas y transformación digital.',
    skillAreas: [
      { area: 'Gobierno TI', skills: 'COBIT ITIL auditoría de sistemas gestión de riesgos ISO 27001' },
      { area: 'Análisis', skills: 'SQL Power BI documentación levantamiento de procesos' },
    ],
    expRole: 'Practicante de Auditoría de Sistemas', expCompany: 'EY Perú',
    expDescription: 'Apoyo en auditorías de controles generales de TI y revisión de accesos.',
    projectTitle: 'Evaluación de Controles TI', projectDescription: 'Matriz de riesgos y controles TI basada en COBIT para una empresa mediana.',
    certName: 'ISO/IEC 27001 Foundation', certIssuer: 'PECB',
  },
  {
    firstName: 'Renato', lastName: 'Cárdenas Luna', cycle: '7mo ciclo', availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Sistemas en UNMSM, enfocado en desarrollo web y soluciones cloud.',
    summary: 'Estudiante de Ingeniería de Sistemas con experiencia en desarrollo web y despliegue de soluciones en la nube (AWS).',
    skillAreas: [
      { area: 'Cloud', skills: 'AWS Lambda S3 DynamoDB API Gateway serverless CloudFormation básico' },
      { area: 'Desarrollo', skills: 'JavaScript Node.js Python Git APIs REST' },
    ],
    expRole: 'Practicante Cloud', expCompany: 'Globant Perú',
    expDescription: 'Desarrollo de funciones serverless en AWS Lambda y mantenimiento de APIs.',
    projectTitle: 'API Serverless de Notificaciones', projectDescription: 'Arquitectura serverless con Lambda, SQS y DynamoDB para envío de notificaciones.',
    certName: 'AWS Certified Cloud Practitioner', certIssuer: 'Amazon Web Services',
  },
];

// Consolidar: 5 amigos + 8 Software + 7 Sistemas = 20
const ALL_PROFILES = [
  ...FRIEND_PROFILES,
  ...UNMSM_SOFTWARE.map((p) => ({ ...p, university: UNMSM, career: 'Ingeniería de Software' })),
  ...UNMSM_SISTEMAS.map((p) => ({ ...p, university: UNMSM, career: 'Ingeniería de Sistemas' })),
];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
function log(msg) {
  console.log(msg);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. CREAR ESTUDIANTES (amigos + compañeros)
// ═══════════════════════════════════════════════════════════════════════
async function createFriendStudents(hash) {
  const students = [];
  log('\n1️⃣  Creando estudiantes (amigos y compañeros)...\n');

  for (let i = 0; i < ALL_PROFILES.length; i++) {
    const p = ALL_PROFILES[i];
    const email = buildEmail(p);
    const cv = buildCv(p);

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        passwordHash: hash,
        role: 'student',
        authProvider: 'local',
        isEmailVerified: true,
      });
    }

    let student = await Student.findOne({ where: { userId: user.id } });
    if (!student) {
      student = await Student.create({
        userId: user.id,
        firstName: p.firstName,
        lastName: p.lastName,
        university: p.university,
        career: p.career,
        cycle: p.cycle,
        availability: p.availability,
        bio: p.bio,
        phoneNumber: faker.phone.number('9## ### ###'),
      });
    }

    let resume = await Resume.findOne({ where: { studentId: student.id } });
    if (!resume) {
      resume = await Resume.create({
        studentId: student.id,
        profile: cv.profile,
        skills: cv.skills,
        education: cv.education,
        experience: cv.experience,
        languages: cv.languages,
        projects: cv.projects,
        certifications: cv.certifications,
        completionPercentage: 85,
      });
    }

    // AlertSettings
    let settings = await AlertSettings.findOne({ where: { studentId: student.id } });
    if (!settings) {
      await AlertSettings.create({
        studentId: student.id,
        frequency: 'immediate',
        emailEnabled: true,
        platformEnabled: true,
        whatsappEnabled: false,
      });
    }

    // ResumeVersion
    let version = await ResumeVersion.findOne({ where: { studentId: student.id } });
    if (!version) {
      version = await ResumeVersion.create({
        studentId: student.id,
        title: `CV ${p.firstName} - Versión Optimizada`,
        profile: cv.profile,
        skills: cv.skills,
        education: cv.education,
        experience: cv.experience,
        languages: cv.languages,
        projects: cv.projects,
        certifications: cv.certifications,
        completionPercentage: 90,
        template: 'modern',
      });
    }

    students.push({ user, student, resume, version, profile: p });
    log(`  📋 ${p.firstName} ${p.lastName} — ${p.career} @ ${p.university} (${email})`);
  }

  return students;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. APPLICATIONS A OFERTAS EXISTENTES (priorizando ofertas de TI)
// ═══════════════════════════════════════════════════════════════════════
const TECH_TAG_REGEX = /(software|sistemas|computaci[oó]n|inform[aá]tica|datos|ti\b|tecnolog)/i;
const TECH_CAREERS = ['Ingeniería de Software', 'Ingeniería de Sistemas'];

function isTechOffer(offer) {
  const tags = Array.isArray(offer.careerTags) ? offer.careerTags.join(' ') : String(offer.careerTags || '');
  return TECH_TAG_REGEX.test(tags) || TECH_TAG_REGEX.test(offer.title || '');
}

// Para los amigos de otras carreras, intentar hacer match por careerTags de la oferta
function matchesCareer(offer, career) {
  const tags = Array.isArray(offer.careerTags) ? offer.careerTags.join(' ') : String(offer.careerTags || '');
  const keyword = career.split(' ').pop(); // p. ej. 'Arquitectura', 'Gráfico', 'Organizacional'
  return tags.toLowerCase().includes(keyword.toLowerCase());
}

async function createFriendApplications(friendStudents) {
  log('\n2️⃣  Creando postulaciones a ofertas existentes...\n');

  const allOffers = await Offer.findAll({ order: [['id', 'ASC']] });
  if (!allOffers.length) {
    log('  ⚠️  No hay ofertas en la BD. Ejecuta seedMassive/seedExtra primero.');
    return;
  }

  const techOffers = allOffers.filter(isTechOffer);
  const statuses = ['enviada', 'revision', 'aceptada', 'descartada'];

  for (let i = 0; i < friendStudents.length; i++) {
    const { student, resume } = friendStudents[i];

    // Pool según carrera: TI → ofertas tech; otras carreras → ofertas afines o todas
    let pool;
    if (TECH_CAREERS.includes(student.career)) {
      pool = techOffers.length ? techOffers : allOffers;
    } else {
      const matched = allOffers.filter((o) => matchesCareer(o, student.career));
      pool = matched.length ? matched : allOffers;
    }
    // 1 o 2 postulaciones por estudiante, rotando sobre el pool
    const numApps = (i % 3 === 0) ? 2 : 1;

    for (let j = 0; j < numApps; j++) {
      const offer = pool[(i + j * 3) % pool.length];
      const existing = await Application.findOne({
        where: { studentId: student.id, offerId: offer.id },
      });
      if (!existing) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await Application.create({
          studentId: student.id,
          offerId: offer.id,
          resumeId: resume.id,
          status,
          appliedAt: faker.date.recent({ days: 15 }),
          companyResponseAt: status !== 'enviada' ? faker.date.recent({ days: 7 }) : null,
        });
        log(`  📨 ${student.firstName} → "${offer.title}" (${status})`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 3. SAVED COMPANIES (empresas existentes)
// ═══════════════════════════════════════════════════════════════════════
async function createFriendSavedCompanies(friendStudents) {
  log('\n3️⃣  Creando empresas guardadas...\n');

  const companies = await Company.findAll({ order: [['id', 'ASC']] });
  if (!companies.length) return;

  for (let i = 0; i < friendStudents.length; i++) {
    const student = friendStudents[i].student;
    const company = companies[i % companies.length];

    const existing = await SavedCompany.findOne({
      where: { studentId: student.id, companyId: company.id },
    });
    if (!existing) {
      await SavedCompany.create({ studentId: student.id, companyId: company.id });
      log(`  ⭐ ${student.firstName} guardó a ${company.tradeName}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 4. SIMULATIONS
// ═══════════════════════════════════════════════════════════════════════
async function createFriendSimulations(friendStudents) {
  log('\n4️⃣  Creando simulaciones de entrevista...\n');

  const roleByCareer = {
    'Ingeniería de Software': 'Desarrollador de Software Junior',
    'Ingeniería de Sistemas': 'Analista de Sistemas Junior',
    'Negocios Internacionales': 'Analista de Comercio Exterior Junior',
    'Ingeniería de Gestión Empresarial': 'Analista de Procesos Junior',
    'Arquitectura': 'Arquitecto Junior',
    'Diseño Gráfico': 'Diseñador Gráfico Junior',
    'Psicología Organizacional': 'Analista de Selección Junior',
  };

  for (const { student } of friendStudents) {
    const existing = await Simulation.findOne({ where: { studentId: student.id } });
    if (!existing) {
      const completed = Math.random() > 0.3;
      await Simulation.create({
        studentId: student.id,
        simulatedRole: roleByCareer[student.career] || 'Practicante de TI',
        career: student.career,
        sector: TECH_CAREERS.includes(student.career) ? 'Tecnología' : 'Diverso',
        overallScore: completed ? Math.floor(Math.random() * 40) + 55 : null,
        aiFeedbackSummary: completed
          ? 'Buen desempeño general. Reforzar respuestas técnicas con ejemplos concretos y estructura STAR.'
          : null,
        status: completed ? 'completed' : 'in_progress',
        chatHistory: [
          { role: 'ai', content: 'Hola, cuéntame sobre tu experiencia y por qué te interesa esta posición.' },
          { role: 'user', content: 'He trabajado en proyectos universitarios y prácticas relacionadas al desarrollo de software.' },
          { role: 'ai', content: '¿Puedes darme un ejemplo de un desafío técnico que enfrentaste y cómo lo resolviste?' },
          { role: 'user', content: 'En un proyecto tuvimos problemas de rendimiento; identifiqué el cuello de botella con profiling y optimicé las consultas.' },
        ],
      });
      log(`  🤖 Simulación para ${student.firstName} (${completed ? 'completada' : 'en progreso'})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════
async function createFriendNotifications(friendStudents) {
  log('\n5️⃣  Creando notificaciones...\n');

  const offers = await Offer.findAll({ order: [['id', 'ASC']] });

  const notifTypes = [
    { type: 'status_change', title: 'Estado de postulación actualizado', msg: 'Tu postulación ha pasado a revisión' },
    { type: 'cv_viewed', title: 'Tu CV fue visto', msg: 'Una empresa revisó tu CV' },
    { type: 'message_received', title: 'Nuevo mensaje', msg: 'Has recibido un mensaje de una empresa' },
    { type: 'offer_match', title: 'Nueva oferta compatible', msg: 'Encontramos una oferta que coincide con tu perfil' },
  ];

  for (let i = 0; i < friendStudents.length; i++) {
    const user = friendStudents[i].user;
    for (let j = 0; j < 2; j++) {
      const n = notifTypes[(i * 2 + j) % notifTypes.length];
      await Notification.create({
        userId: user.id,
        type: n.type,
        title: n.title,
        message: n.msg,
        isRead: Math.random() > 0.4,
        relatedId: offers[(i + j) % offers.length]?.id || null,
      });
    }
    log(`  🔔 2 notificaciones para ${friendStudents[i].student.firstName}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 6. ALERT HISTORY
// ═══════════════════════════════════════════════════════════════════════
async function createFriendAlertHistory(friendStudents) {
  log('\n6️⃣  Creando entradas de AlertHistory...\n');

  const offers = await Offer.findAll({ order: [['id', 'ASC']] });
  if (!offers.length) return;

  for (let i = 0; i < friendStudents.length; i++) {
    const student = friendStudents[i].student;
    const offer = offers[i % offers.length];

    const existing = await AlertHistory.findOne({
      where: { studentId: student.id, offerId: offer.id },
    });
    if (!existing) {
      await AlertHistory.create({
        studentId: student.id,
        offerId: offer.id,
        compatibilityScore: Math.floor(Math.random() * 40) + 50,
        channel: ['email', 'platform', 'both'][Math.floor(Math.random() * 3)],
        isFromFollowedCompany: Math.random() > 0.5,
        sentAt: faker.date.recent({ days: 10 }),
        wasIncludedInDigest: Math.random() > 0.7,
        digestType: Math.random() > 0.5 ? 'daily' : null,
      });
      log(`  📨 AlertHistory para ${student.firstName} — "${offer.title}"`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
async function run() {
  try {
    await sequelize.authenticate();
    log('\n🟢 Conectado a la base de datos.\n');

    const hash = await bcrypt.hash(PASSWORD, 12);

    log('═══════════════════════════════════════════════');
    log('  SEED FRIENDS — PracHub (amigos y compañeros)');
    log('═══════════════════════════════════════════════');

    // Verificar que exista el seed base
    const admin = await User.findOne({ where: { email: 'admin@prachub.test' } });
    if (!admin) {
      log('❌ No se encontró el admin. Ejecuta seedMassive.js primero.');
      process.exit(1);
    }

    const friendStudents = await createFriendStudents(hash);
    await createFriendApplications(friendStudents);
    await createFriendSavedCompanies(friendStudents);
    await createFriendSimulations(friendStudents);
    await createFriendNotifications(friendStudents);
    await createFriendAlertHistory(friendStudents);

    log('\n═══════════════════════════════════════════════');
    log('  ✅ SEED FRIENDS COMPLETADO');
    log('═══════════════════════════════════════════════');
    log(`\n  👨‍🎓 Estudiantes creados (${friendStudents.length}):`);
    friendStudents.forEach((s) => {
      log(`     ${s.user.email} / ${PASSWORD} — ${s.student.firstName} ${s.student.lastName} (${s.profile.university} · ${s.student.career})`);
    });
    log('═══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

run();
