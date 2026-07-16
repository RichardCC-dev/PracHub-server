/**
 * seedMassive.js — Seed masivo para probar TODAS las funcionalidades de PracHub.
 *
 * Crea:
 *   - 1 admin
 *   - 8 estudiantes con CVs diversos (diferentes carreras)
 *   - 5 empresas verificadas con canPublishOffers
 *   - 15 ofertas (3 por empresa) creadas como pending → aprobadas vía adminService
 *   - AlertSettings (frequency: immediate, platformEnabled: true) para cada estudiante
 *   - SavedCompany (estudiantes siguiendo empresas)
 *   - Applications (postulaciones)
 *   - DirectMessages (mensajes empresa→estudiante)
 *   - Simulations (simulaciones de entrevista)
 *   - Notifications (notificaciones varias)
 *
 * CRÍTICO: Las ofertas se aprueban vía adminService.approveOffer() para que
 * se disparen las alertas automáticas (alertService.processNewOffer).
 *
 * Uso:
 *   cd server && node scripts/seeds/seedMassive.js
 *
 * Limpiar:
 *   node scripts/seeds/seedMassive.js --clean
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
  Offer,
  Application,
  Notification,
  AlertSettings,
  AlertHistory,
  SavedCompany,
  DirectMessage,
  Simulation,
} = require('../../src/models');

const adminService = require('../../src/services/adminService');
const alertService = require('../../src/services/alertService');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════
const PASSWORD = 'TestPass123!';
const ADMIN_EMAIL = 'admin@prachub.test';
const DOMAIN = 'prachub.test';

// ═══════════════════════════════════════════════════════════════════════
// PERFILES DE ESTUDIANTES (con CVs ricos para TF-IDF)
// ═══════════════════════════════════════════════════════════════════════
const STUDENT_PROFILES = [
  {
    firstName: 'Juan',
    lastName: 'Pérez García',
    career: 'Ingeniería de Software',
    university: 'Universidad Nacional Mayor de San Marcos',
    cycle: '8vo ciclo',
    availability: 'Tiempo completo',
    bio: 'Desarrollador fullstack apasionado por React, Node.js y Python. Experiencia en plataformas web, APIs REST y bases de datos MySQL.',
    cv: {
      profile: { summary: 'Desarrollador fullstack con experiencia en React, Node.js, JavaScript, HTML, CSS, Python y MySQL. Apasionado por crear plataformas web y sistemas de gestión.' },
      skills: {
        areas: [
          { area: 'Desarrollo Web Frontend', skills: 'React JavaScript HTML CSS Tailwind TypeScript Redux' },
          { area: 'Desarrollo Backend', skills: 'Node.js Express Python Django REST API GraphQL MySQL PostgreSQL' },
          { area: 'DevOps y Herramientas', skills: 'Git Docker AWS Linux' },
        ],
        soft: 'Trabajo en equipo, comunicación efectiva, proactividad, resolución de problemas, autodidacta',
      },
      education: { items: [{ degree: 'Ingeniería de Software', institution: 'Universidad Nacional Mayor de San Marcos', fieldOfStudy: 'Ingeniería de Software' }] },
      experience: { items: [{ role: 'Desarrollador Web Junior', company: 'Startup Local', description: 'Desarrollo de aplicaciones web con React y Node.js. Gestión de bases de datos MySQL. Implementación de APIs REST.' }] },
      languages: { list: 'Inglés técnico avanzado, Español nativo' },
      projects: { items: [
        { title: 'Plataforma de Gestión Interna', description: 'Sistema de gestión usando React, Node.js, Express y MySQL. Autenticación JWT, dashboards y reportes.' },
        { title: 'App de Búsqueda con IA', description: 'Aplicación de búsqueda inteligente usando Python, NLP y TF-IDF para matching de perfiles.' },
      ] },
      certifications: { items: [
        { name: 'Fullstack JavaScript Developer', issuer: 'FreeCodeCamp' },
        { name: 'Python for Data Science', issuer: 'Coursera' },
      ] },
    },
  },
  {
    firstName: 'María',
    lastName: 'Quispe Rojas',
    career: 'Ingeniería Industrial',
    university: 'Universidad Nacional de Ingeniería',
    cycle: '6to ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Ingeniería Industrial con interés en optimización de procesos, logística y análisis de datos. Conocimientos en Excel avanzado, Power BI y Python.',
    cv: {
      profile: { summary: 'Estudiante de Ingeniería Industrial con experiencia en optimización de procesos, análisis de datos, logística y cadena de suministro. Conocimientos en Excel avanzado, Power BI, Python y SAP.' },
      skills: {
        areas: [
          { area: 'Análisis de Datos', skills: 'Excel avanzado Power BI Python pandas SQL análisis estadístico' },
          { area: 'Gestión de Procesos', skills: 'Lean Six Sigma optimización procesos logística cadena de suministro SAP' },
          { area: 'Gestión de Proyectos', skills: 'Microsoft Project gestión proyectos ágil scrum kanban' },
        ],
        soft: 'Liderazgo, análisis crítico, organización, trabajo bajo presión, comunicación efectiva',
      },
      education: { items: [{ degree: 'Ingeniería Industrial', institution: 'Universidad Nacional de Ingeniería', fieldOfStudy: 'Ingeniería Industrial' }] },
      experience: { items: [{ role: 'Practicante de Logística', company: 'Logística Andina SAC', description: 'Optimización de rutas de distribución usando Python y Excel. Análisis de datos de inventario con Power BI. Implementación de metodologías Lean.' }] },
      languages: { list: 'Inglés intermedio, Español nativo, Quechua básico' },
      projects: { items: [
        { title: 'Optimización de Cadena de Suministro', description: 'Proyecto de optimización de inventarios usando Python, pandas y modelos de pronóstico. Reducción de costos en 15%.' },
      ] },
      certifications: { items: [{ name: 'Lean Six Sigma Yellow Belt', issuer: 'IASSC' }] },
    },
  },
  {
    firstName: 'Carlos',
    lastName: 'Mendoza Lara',
    career: 'Marketing',
    university: 'Universidad de Lima',
    cycle: '5to ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Marketing con pasión por el marketing digital, redes sociales y análisis de campañas. Experiencia con Google Ads, Facebook Ads y SEO.',
    cv: {
      profile: { summary: 'Estudiante de Marketing digital con experiencia en gestión de redes sociales, Google Ads, Facebook Ads, SEO, contenido digital y análisis de campañas. Conocimientos en Google Analytics y Canva.' },
      skills: {
        areas: [
          { area: 'Marketing Digital', skills: 'Google Ads Facebook Ads Instagram Ads SEO SEM email marketing Mailchimp' },
          { area: 'Análisis y Métricas', skills: 'Google Analytics Facebook Pixel métricas conversión embudo ventas KPIs' },
          { area: 'Contenido Digital', skills: 'Canva Adobe Photoshop copywriting storytelling branding community manager' },
        ],
        soft: 'Creatividad, comunicación, adaptabilidad, trabajo en equipo, proactividad',
      },
      education: { items: [{ degree: 'Marketing', institution: 'Universidad de Lima', fieldOfStudy: 'Marketing y Publicidad' }] },
      experience: { items: [{ role: 'Community Manager Practicante', company: 'Agencia Digital Creativa', description: 'Gestión de redes sociales para 5 clientes. Creación de contenido con Canva. Campañas de Google Ads y Facebook Ads. Análisis con Google Analytics.' }] },
      languages: { list: 'Inglés avanzado, Español nativo' },
      projects: { items: [
        { title: 'Campaña Digital para Startup', description: 'Campaña 360° con Google Ads, Facebook Ads e email marketing. Aumento de conversión del 30%.' },
      ] },
      certifications: { items: [
        { name: 'Google Ads Certification', issuer: 'Google' },
        { name: 'HubSpot Content Marketing', issuer: 'HubSpot' },
      ] },
    },
  },
  {
    firstName: 'Ana',
    lastName: 'Vargas Torres',
    career: 'Contabilidad',
    university: 'Universidad Nacional Mayor de San Marcos',
    cycle: '7mo ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Contabilidad con conocimientos en tributación, auditoría y estados financieros. Manejo de SAP, Excel avanzado y QuickBooks.',
    cv: {
      profile: { summary: 'Estudiante de Contabilidad con experiencia en tributación, auditoría, estados financieros, conciliación bancaria y análisis financiero. Manejo de SAP, Excel avanzado, QuickBooks y declaraciones SUNAT.' },
      skills: {
        areas: [
          { area: 'Contabilidad y Finanzas', skills: 'Contabilidad general tributación auditoría estados financieros conciliación bancaria SUNAT IGV renta' },
          { area: 'Herramientas Financieras', skills: 'SAP QuickBooks Excel avanzado Concar SUNAT operaciones en línea' },
          { area: 'Análisis Financiero', skills: 'Análisis financiero presupuestos costos flujo de caja ratios financieros' },
        ],
        soft: 'Meticulosidad, ética, organización, análisis, responsabilidad',
      },
      education: { items: [{ degree: 'Contabilidad', institution: 'Universidad Nacional Mayor de San Marcos', fieldOfStudy: 'Ciencias Contables' }] },
      experience: { items: [{ role: 'Practicante de Contabilidad', company: 'Estudio Contable Pérez & Asociados', description: 'Conciliación bancaria, declaración de impuestos SUNAT, estados financieros. Manejo de SAP y Concar.' }] },
      languages: { list: 'Inglés intermedio, Español nativo' },
      projects: { items: [
        { title: 'Auditoría Interna de Procesos', description: 'Auditoría de procesos contables en empresa comercial. Revisión de estados financieros y control interno.' },
      ] },
      certifications: { items: [{ name: 'Diplomado en Tributación SUNAT', issuer: 'Colegio de Contadores' }] },
    },
  },
  {
    firstName: 'Lucía',
    lastName: 'Fernández Cruz',
    career: 'Diseño Gráfico',
    university: 'Universidad Peruana de Ciencias Aplicadas',
    cycle: '4to ciclo',
    availability: 'Tiempo completo',
    bio: 'Diseñadora gráfica con experiencia en branding, ilustración digital y UX/UI design. Dominio de Adobe Creative Suite y Figma.',
    cv: {
      profile: { summary: 'Diseñadora gráfica con experiencia en branding, identidad visual, ilustración digital, UX/UI design y diseño editorial. Dominio de Adobe Photoshop, Illustrator, InDesign y Figma.' },
      skills: {
        areas: [
          { area: 'Diseño Gráfico', skills: 'Adobe Photoshop Illustrator InDesign branding identidad visual ilustración diseño editorial' },
          { area: 'UX/UI Design', skills: 'Figma Adobe XD Sketch prototipado wireframing design system investigación usuarios' },
          { area: 'Motion Graphics', skills: 'Adobe After Effects Premiere Pro animación motion graphics edición video' },
        ],
        soft: 'Creatividad, atención al detalle, comunicación visual, trabajo en equipo, receptividad al feedback',
      },
      education: { items: [{ degree: 'Diseño Gráfico', institution: 'Universidad Peruana de Ciencias Aplicadas', fieldOfStudy: 'Diseño Gráfico y Comunicación Visual' }] },
      experience: { items: [{ role: 'Diseñadora Gráfica Practicante', company: 'Agencia Creativa Pixel', description: 'Diseño de identidad visual para marcas. Creación de piezas gráficas con Adobe Creative Suite. Prototipado en Figma.' }] },
      languages: { list: 'Inglés avanzado, Español nativo' },
      projects: { items: [
        { title: 'Rediseño de Marca para Startup', description: 'Rediseño completo de identidad visual: logo, paleta, tipografía y manual de marca. Prototipado en Figma.' },
      ] },
      certifications: { items: [{ name: 'Google UX Design Certificate', issuer: 'Google' }] },
    },
  },
  {
    firstName: 'Diego',
    lastName: 'Ramos Salazar',
    career: 'Ingeniería de Sistemas',
    university: 'Universidad Nacional de Trujillo',
    cycle: '9no ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería de Sistemas con foco en data science y machine learning. Experiencia en Python, R, SQL y TensorFlow.',
    cv: {
      profile: { summary: 'Estudiante de Ingeniería de Sistemas especializado en data science, machine learning y análisis de datos. Experiencia en Python, R, SQL, TensorFlow, scikit-learn y visualización de datos.' },
      skills: {
        areas: [
          { area: 'Data Science', skills: 'Python R pandas numpy scikit-learn TensorFlow machine learning análisis estadístico' },
          { area: 'Bases de Datos', skills: 'SQL MySQL PostgreSQL MongoDB Redis ETL data warehouse' },
          { area: 'Visualización', skills: 'Tableau Power BI matplotlib seaborn dashboards visualización datos' },
        ],
        soft: 'Pensamiento analítico, curiosidad, autodidacta, resolución de problemas, comunicación de datos',
      },
      education: { items: [{ degree: 'Ingeniería de Sistemas', institution: 'Universidad Nacional de Trujillo', fieldOfStudy: 'Ingeniería de Sistemas e Informática' }] },
      experience: { items: [{ role: 'Practicante Data Analyst', company: 'DataTech Solutions', description: 'Análisis de datos con Python y SQL. Modelos de machine learning con scikit-learn. Dashboards en Tableau y Power BI.' }] },
      languages: { list: 'Inglés técnico avanzado, Español nativo' },
      projects: { items: [
        { title: 'Modelo de Predicción de Churn', description: 'Modelo de machine learning con Python, scikit-learn y TensorFlow para predecir cancelación de clientes. Accuracy 92%.' },
        { title: 'Dashboard de Ventas en Power BI', description: 'Dashboard interactivo de ventas con KPIs, tendencias y segmentación de clientes usando Power BI y SQL.' },
      ] },
      certifications: { items: [
        { name: 'Google Data Analytics Certificate', issuer: 'Google' },
        { name: 'TensorFlow Developer Certificate', issuer: 'Google' },
      ] },
    },
  },
  {
    firstName: 'Sofía',
    lastName: 'Castillo Vega',
    career: 'Psicología',
    university: 'Pontificia Universidad Católica del Perú',
    cycle: '6to ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Psicología con interés en psicología organizacional, selección de personal y bienestar laboral. Conocimientos en evaluación psicométrica.',
    cv: {
      profile: { summary: 'Estudiante de Psicología con enfoque en psicología organizacional, selección de personal, evaluación psicométrica y bienestar laboral. Conocimientos en gestión del talento humano y clima organizacional.' },
      skills: {
        areas: [
          { area: 'Psicología Organizacional', skills: 'Selección de personal reclutamiento evaluación psicométrica gestión talento humano clima organizacional bienestar laboral' },
          { area: 'Evaluación', skills: 'Test psicométricos entrevistas por competencias assessment center evaluación 360° informes psicológicos' },
          { area: 'Herramientas', skills: 'Excel SPSS encuestas online Google Forms análisis estadístico descriptivo' },
        ],
        soft: 'Empatía, escucha activa, confidencialidad, ética profesional, comunicación asertiva',
      },
      education: { items: [{ degree: 'Psicología', institution: 'Pontificia Universidad Católica del Perú', fieldOfStudy: 'Psicología' }] },
      experience: { items: [{ role: 'Practicante de Recursos Humanos', company: 'Consultora HR Partners', description: 'Apoyo en procesos de selección de personal. Aplicación de pruebas psicométricas. Entrevistas por competencias. Evaluación de clima organizacional.' }] },
      languages: { list: 'Inglés intermedio, Español nativo' },
      projects: { items: [
        { title: 'Estudio de Clima Organizacional', description: 'Investigación de clima laboral en empresa de retail. Análisis con SPSS y Excel. Propuestas de mejora.' },
      ] },
      certifications: { items: [{ name: 'Diplomado en Gestión del Talento', issuer: 'PUCP' }] },
    },
  },
  {
    firstName: 'Pedro',
    lastName: 'Huamán López',
    career: 'Ingeniería Mecánica',
    university: 'Universidad Nacional de Ingeniería',
    cycle: '8vo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería Mecánica con interés en diseño CAD, mantenimiento industrial y automatización. Conocimientos en SolidWorks, AutoCAD y PLC.',
    cv: {
      profile: { summary: 'Estudiante de Ingeniería Mecánica con experiencia en diseño CAD, mantenimiento industrial, automatización y control. Manejo de SolidWorks, AutoCAD, ANSYS y programación de PLC Siemens.' },
      skills: {
        areas: [
          { area: 'Diseño CAD', skills: 'SolidWorks AutoCAD Inventor CATIA diseño mecánico planos técnicos tolerancias' },
          { area: 'Mantenimiento Industrial', skills: 'Mantenimiento preventivo correctivo predictivo TPM RCM gestión mantenimiento planificación' },
          { area: 'Automatización', skills: 'PLC Siemens Allen Bradley SCADA HMI programación ladder control industrial sensores actuadores' },
        ],
        soft: 'Análisis, precisión, trabajo en equipo, seguridad industrial, resolución de problemas técnicos',
      },
      education: { items: [{ degree: 'Ingeniería Mecánica', institution: 'Universidad Nacional de Ingeniería', fieldOfStudy: 'Ingeniería Mecánica' }] },
      experience: { items: [{ role: 'Practicante de Mantenimiento', company: 'Manufactura Industrial SAC', description: 'Planificación de mantenimiento preventivo. Diseño de piezas en SolidWorks. Programación de PLC Siemens para línea de producción.' }] },
      languages: { list: 'Inglés técnico intermedio, Español nativo' },
      projects: { items: [
        { title: 'Automatización de Línea de Ensamblaje', description: 'Diseño e implementación de automatización con PLC Siemens. Reducción de tiempo de ciclo en 20%.' },
      ] },
      certifications: { items: [{ name: 'SolidWorks Associate Certification', issuer: 'Dassault Systèmes' }] },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// PERFILES DE EMPRESAS
// ═══════════════════════════════════════════════════════════════════════
const COMPANY_PROFILES = [
  {
    legalName: 'TechNova Solutions SAC',
    tradeName: 'TechNova',
    industry: 'Tecnología',
    description: 'Empresa de desarrollo de software especializada en plataformas web, sistemas de gestión y soluciones cloud. Trabajamos con React, Node.js, Python y AWS.',
    companySize: 'medium',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Desarrollo Web Fullstack - React y Node.js',
        description: 'Buscamos estudiante de Ingeniería de Software para prácticas en desarrollo web. Participarás en la creación de plataformas web modernas usando React, JavaScript, HTML, CSS y Node.js. Trabajarás con bases de datos MySQL, APIs REST y metodologías ágiles.',
        requirements: '- Estudiante de Ingeniería de Software\n- Conocimientos en React, JavaScript, HTML, CSS\n- Familiaridad con Node.js, Express y MySQL\n- Experiencia en desarrollo web y plataformas\n- Trabajo en equipo, proactividad y comunicación\n- Inglés técnico avanzado deseable',
        area: 'Desarrollo Web',
        careerTags: ['Ingeniería de Software', 'Ciencias de la Computación'],
        modality: 'remote',
        duration: '6 meses',
        compensation: 'S/ 1,500 mensual',
      },
      {
        title: 'Desarrollador Python y JavaScript para Sistemas de Gestión',
        description: 'Buscamos talento apasionado por Python, Django, Node.js y React. Trabajarás en proyectos de sistemas de gestión y plataformas web para clientes de diversos sectores. Usamos MySQL, PostgreSQL y AWS.',
        requirements: '- Estudiante de Ingeniería de Software\n- Manejo de Python, Django, Node.js y React\n- Conocimiento de MySQL y PostgreSQL\n- Experiencia en desarrollo de plataformas web\n- Resolución de problemas y autodidacta\n- Git, Docker y AWS son un plus',
        area: 'Desarrollo de Software',
        careerTags: ['Ingeniería de Software', 'Ingeniería de Sistemas'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,600 mensual',
      },
      {
        title: 'Practicante de Data Science - Python y Machine Learning',
        description: 'Buscamos estudiante de Ingeniería de Sistemas o Software con interés en data science y machine learning. Trabajarás con Python, pandas, scikit-learn, TensorFlow y SQL en proyectos de análisis de datos y modelos predictivos.',
        requirements: '- Estudiante de Ingeniería de Sistemas o Software\n- Conocimientos en Python, pandas, numpy, scikit-learn\n- Experiencia con SQL y bases de datos\n- Conocimiento de machine learning y TensorFlow\n- Visualización de datos con Tableau o Power BI\n- Pensamiento analítico y autodidacta',
        area: 'Data Science',
        careerTags: ['Ingeniería de Sistemas', 'Ingeniería de Software', 'Ciencia de Datos'],
        modality: 'remote',
        duration: '6 meses',
        compensation: 'S/ 1,800 mensual',
      },
    ],
  },
  {
    legalName: 'Logística Andina SAC',
    tradeName: 'LogAndina',
    industry: 'Logística',
    description: 'Empresa de logística y cadena de suministro con cobertura nacional. Especialistas en optimización de rutas, gestión de inventarios y distribución.',
    companySize: 'large',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Ingeniería Industrial - Optimización de Procesos',
        description: 'Buscamos estudiante de Ingeniería Industrial para prácticas en optimización de procesos logísticos. Trabajarás con Excel avanzado, Power BI, Python y metodologías Lean Six Sigma en proyectos de mejora continua.',
        requirements: '- Estudiante de Ingeniería Industrial\n- Conocimientos en Excel avanzado y Power BI\n- Familiaridad con Python y análisis de datos\n- Conocimiento de Lean Six Sigma\n- Análisis de procesos y cadena de suministro\n- Liderazgo y trabajo bajo presión',
        area: 'Ingeniería de Procesos',
        careerTags: ['Ingeniería Industrial', 'Ingeniería de Sistemas'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,200 mensual',
      },
      {
        title: 'Practicante de Análisis de Datos Logísticos',
        description: 'Buscamos estudiante con interés en análisis de datos para optimizar nuestra cadena de suministro. Usarás Python, SQL, Excel y Power BI para análisis de inventarios, rutas y pronósticos de demanda.',
        requirements: '- Estudiante de Ingeniería Industrial o Sistemas\n- Manejo de Python, pandas y SQL\n- Excel avanzado y Power BI\n- Conocimientos de logística y cadena de suministro\n- Análisis estadístico y pronósticos\n- Organización y atención al detalle',
        area: 'Análisis de Datos',
        careerTags: ['Ingeniería Industrial', 'Ingeniería de Sistemas'],
        modality: 'hybrid',
        duration: '4 meses',
        compensation: 'S/ 1,000 mensual',
      },
      {
        title: 'Practicante de Contabilidad y Finanzas',
        description: 'Buscamos estudiante de Contabilidad para prácticas en área financiera. Trabajarás con SAP, Excel avanzado, conciliaciones bancarias, declaraciones SUNAT y estados financieros.',
        requirements: '- Estudiante de Contabilidad\n- Conocimientos en SAP y Excel avanzado\n- Tributación SUNAT, IGV, renta\n- Estados financieros y conciliación bancaria\n- Análisis financiero y presupuestos\n- Meticulosidad y ética profesional',
        area: 'Contabilidad y Finanzas',
        careerTags: ['Contabilidad', 'Ciencias Contables'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,100 mensual',
      },
    ],
  },
  {
    legalName: 'Agencia Digital Creativa SAC',
    tradeName: 'CreativaDigital',
    industry: 'Marketing Digital',
    description: 'Agencia de marketing digital especializada en campañas 360°, redes sociales, SEO, SEM y contenido digital. Trabajamos con marcas de consumo masivo.',
    companySize: 'small',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Marketing Digital - Google Ads y Redes Sociales',
        description: 'Buscamos estudiante de Marketing para prácticas en marketing digital. Gestionarás campañas de Google Ads, Facebook Ads, Instagram Ads, SEO y email marketing. Analizarás resultados con Google Analytics.',
        requirements: '- Estudiante de Marketing o Comunicaciones\n- Conocimientos en Google Ads y Facebook Ads\n- SEO, SEM y email marketing\n- Google Analytics y métricas de conversión\n- Canva y copywriting\n- Creatividad y proactividad',
        area: 'Marketing Digital',
        careerTags: ['Marketing', 'Publicidad', 'Comunicaciones'],
        modality: 'hybrid',
        duration: '4 meses',
        compensation: 'S/ 1,000 mensual',
      },
      {
        title: 'Community Manager y Content Creator',
        description: 'Buscamos estudiante creativo para gestionar redes sociales de marcas. Crearás contenido con Canva y Adobe, escribirás copy, gestionarás comunidad y analizarás métricas con Google Analytics.',
        requirements: '- Estudiante de Marketing, Comunicaciones o Diseño\n- Experiencia en gestión de redes sociales\n- Canva, Adobe Photoshop o Illustrator\n- Copywriting y storytelling\n- Community management y branding\n- Creatividad y comunicación',
        area: 'Contenido Digital',
        careerTags: ['Marketing', 'Diseño Gráfico', 'Comunicaciones'],
        modality: 'remote',
        duration: '3 meses',
        compensation: 'S/ 900 mensual',
      },
      {
        title: 'Practicante de Diseño Gráfico y UX/UI',
        description: 'Buscamos estudiante de Diseño Gráfico para prácticas en branding y UX/UI. Trabajarás con Adobe Photoshop, Illustrator, InDesign y Figma en proyectos de identidad visual y diseño de interfaces.',
        requirements: '- Estudiante de Diseño Gráfico\n- Dominio de Adobe Photoshop, Illustrator e InDesign\n- Figma y prototipado UX/UI\n- Branding e identidad visual\n- Portafolio de trabajos previos\n- Creatividad y atención al detalle',
        area: 'Diseño',
        careerTags: ['Diseño Gráfico', 'Diseño UX/UI', 'Comunicación Visual'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,200 mensual',
      },
    ],
  },
  {
    legalName: 'Consultora HR Partners SAC',
    tradeName: 'HRPartners',
    industry: 'Recursos Humanos',
    description: 'Consultora especializada en selección de personal, evaluación psicométrica, clima organizacional y gestión del talento humano.',
    companySize: 'small',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Psicología Organizacional - Selección de Personal',
        description: 'Buscamos estudiante de Psicología para prácticas en selección de personal. Realizarás entrevistas por competencias, aplicarás pruebas psicométricas, evaluarás candidatos y elaborarás informes psicológicos.',
        requirements: '- Estudiante de Psicología\n- Conocimientos en selección de personal y reclutamiento\n- Evaluación psicométrica y entrevistas por competencias\n- Assessment center y evaluación 360°\n- Elaboración de informes psicológicos\n- Empatía y ética profesional',
        area: 'Recursos Humanos',
        careerTags: ['Psicología', 'Recursos Humanos'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,000 mensual',
      },
      {
        title: 'Practicante de Clima y Bienestar Organizacional',
        description: 'Buscamos estudiante de Psicología para apoyar en proyectos de clima organizacional y bienestar laboral. Usarás encuestas, SPSS y Excel para análisis de datos y propuestas de mejora.',
        requirements: '- Estudiante de Psicología\n- Conocimientos en clima organizacional y bienestar laboral\n- SPSS y análisis estadístico descriptivo\n- Diseño de encuestas y Google Forms\n- Gestión del talento humano\n- Comunicación asertiva y confidencialidad',
        area: 'Psicología Organizacional',
        careerTags: ['Psicología', 'Recursos Humanos'],
        modality: 'hybrid',
        duration: '4 meses',
        compensation: 'S/ 900 mensual',
      },
    ],
  },
  {
    legalName: 'Manufactura Industrial SAC',
    tradeName: 'ManuInd',
    industry: 'Manufactura',
    description: 'Empresa de manufactura industrial especializada en piezas metálicas, automatización de líneas de producción y mantenimiento industrial.',
    companySize: 'medium',
    city: 'Arequipa',
    offers: [
      {
        title: 'Practicante de Ingeniería Mecánica - Diseño CAD y Mantenimiento',
        description: 'Buscamos estudiante de Ingeniería Mecánica para prácticas en diseño CAD y mantenimiento industrial. Trabajarás con SolidWorks, AutoCAD, mantenimiento preventivo y programación de PLC Siemens.',
        requirements: '- Estudiante de Ingeniería Mecánica\n- Dominio de SolidWorks y AutoCAD\n- Mantenimiento preventivo, correctivo y predictivo\n- Programación de PLC Siemens y SCADA\n- Conocimientos de TPM y RCM\n- Análisis y seguridad industrial',
        area: 'Ingeniería Mecánica',
        careerTags: ['Ingeniería Mecánica', 'Ingeniería Industrial'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,300 mensual',
      },
      {
        title: 'Practicante de Mantenimiento y Automatización Industrial',
        description: 'Buscamos estudiante de Ingeniería Mecánica o Industrial para prácticas en automatización. Trabajarás con PLC Allen Bradley, SCADA, HMI, sensores y actuadores en líneas de producción.',
        requirements: '- Estudiante de Ingeniería Mecánica o Industrial\n- Programación de PLC Allen Bradley y Siemens\n- SCADA, HMI y control industrial\n- Sensores y actuadores\n- Mantenimiento industrial y TPM\n- Resolución de problemas técnicos',
        area: 'Automatización',
        careerTags: ['Ingeniería Mecánica', 'Ingeniería Industrial', 'Ingeniería Electrónica'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,400 mensual',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
async function hashPassword() {
  return bcrypt.hash(PASSWORD, 12);
}

function log(msg) {
  console.log(msg);
}

// ═══════════════════════════════════════════════════════════════════════
// CLEAN (opcional)
// ═══════════════════════════════════════════════════════════════════════
async function cleanAll() {
  log('\n🧹 Limpiando data de prueba...\n');
  // Desactivar FK checks para evitar errores de orden
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  // Truncar todas las tablas en orden seguro
  await sequelize.query('TRUNCATE TABLE invitations_to_apply');
  await sequelize.query('TRUNCATE TABLE direct_messages');
  await sequelize.query('TRUNCATE TABLE Simulations');
  await sequelize.query('TRUNCATE TABLE notifications');
  await sequelize.query('TRUNCATE TABLE alert_history');
  await sequelize.query('TRUNCATE TABLE applications');
  await sequelize.query('TRUNCATE TABLE saved_companies');
  await sequelize.query('TRUNCATE TABLE cv_analyses');
  await sequelize.query('TRUNCATE TABLE offers');
  await sequelize.query('TRUNCATE TABLE ResumeVersions');
  await sequelize.query('TRUNCATE TABLE Resumes');
  await sequelize.query('TRUNCATE TABLE alert_settings');
  await sequelize.query('TRUNCATE TABLE Students');
  await sequelize.query('TRUNCATE TABLE Companies');

  // Borrar usuarios de prueba (por email pattern)
  await sequelize.query(`DELETE FROM Users WHERE email LIKE '%@${DOMAIN}'`);

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  log('✅ Data de prueba eliminada.\n');
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR ADMIN
// ═══════════════════════════════════════════════════════════════════════
async function ensureAdmin(hash) {
  let admin = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    admin = await User.create({
      email: ADMIN_EMAIL,
      passwordHash: hash,
      role: 'admin',
      authProvider: 'local',
      isEmailVerified: true,
    });
    log(`  ✅ Admin creado: ${admin.email}`);
  } else {
    log(`  ℹ️  Admin existente: ${admin.email}`);
  }
  return admin;
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR ESTUDIANTES
// ═══════════════════════════════════════════════════════════════════════
async function createStudents(hash) {
  const students = [];
  log('\n1️⃣  Creando estudiantes con CVs...\n');

  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const p = STUDENT_PROFILES[i];
    const email = `student${i + 1}@${DOMAIN}`;

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
        profile: p.cv.profile,
        skills: p.cv.skills,
        education: p.cv.education,
        experience: p.cv.experience,
        languages: p.cv.languages,
        projects: p.cv.projects,
        certifications: p.cv.certifications,
        completionPercentage: 85,
      });
    }

    // AlertSettings: immediate + platformEnabled (CRÍTICO para notificaciones)
    let settings = await AlertSettings.findOne({ where: { studentId: student.id } });
    if (!settings) {
      settings = await AlertSettings.create({
        studentId: student.id,
        frequency: 'immediate',
        emailEnabled: true,
        platformEnabled: true,
        whatsappEnabled: false,
      });
    } else {
      await settings.update({ frequency: 'immediate', emailEnabled: true, platformEnabled: true });
    }

    students.push({ user, student, resume });
    log(`  📋 ${p.firstName} ${p.lastName} — ${p.career} (${email})`);
  }

  return students;
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR EMPRESAS
// ═══════════════════════════════════════════════════════════════════════
async function createCompanies(hash) {
  const companies = [];
  log('\n2️⃣  Creando empresas...\n');

  for (let i = 0; i < COMPANY_PROFILES.length; i++) {
    const p = COMPANY_PROFILES[i];
    const email = `company${i + 1}@${DOMAIN}`;

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        passwordHash: hash,
        role: 'company',
        authProvider: 'local',
        isEmailVerified: true,
      });
    }

    let company = await Company.findOne({ where: { userId: user.id } });
    if (!company) {
      company = await Company.create({
        userId: user.id,
        taxId: `20${String(10000000000 + i * 11111111).slice(0, 10)}`,
        legalName: p.legalName,
        tradeName: p.tradeName,
        description: p.description,
        industry: p.industry,
        companySize: p.companySize,
        responsibleName: faker.person.fullName(),
        responsiblePosition: 'Gerente de RRHH',
        responsiblePhone: faker.phone.number('9## ### ###'),
        country: 'Perú',
        city: p.city,
        verificationStatus: 'verified',
        isVerified: true,
        verifiedAt: new Date(),
        canPublishOffers: true,
      });
    } else {
      await company.update({ canPublishOffers: true, isVerified: true, verificationStatus: 'verified' });
    }

    companies.push({ user, company, offers: p.offers });
    log(`  🏢 ${p.legalName} (${email}) — ${p.industry}`);
  }

  return companies;
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR Y APROBAR OFERTAS (dispara alertas)
// ═══════════════════════════════════════════════════════════════════════
async function createAndApproveOffers(companies, admin) {
  const allOffers = [];
  log('\n3️⃣  Creando ofertas como pending y aprobando vía adminService...\n');

  for (const { company, offers: offerTemplates } of companies) {
    for (const tpl of offerTemplates) {
      // Crear como pending (como lo haría una empresa real)
      let offer = await Offer.findOne({
        where: { title: tpl.title, companyId: company.id },
      });

      if (!offer) {
        offer = await Offer.create({
          companyId: company.id,
          title: tpl.title,
          description: tpl.description,
          requirements: tpl.requirements,
          area: tpl.area,
          careerTags: tpl.careerTags,
          modality: tpl.modality,
          duration: tpl.duration,
          compensation: tpl.compensation,
          status: 'pending',
        });
        log(`  📝 Creada (pending): "${tpl.title}"`);
      } else {
        // Reset a pending para que la aprobación dispare alertas
        await offer.update({ status: 'pending', moderatedAt: null, moderatedBy: null });
      }

      // Aprobar vía adminService → dispara alertService.processNewOffer (async con process.nextTick)
      try {
        await adminService.approveOffer(offer.id, admin.id);
        log(`  ✅ Aprobada: "${tpl.title}"`);
      } catch (err) {
        // Si ya estaba aprobada, forzar reset y re-aprobar
        if (err.message?.includes('ya ha sido moderada')) {
          await offer.update({ status: 'pending', moderatedAt: null, moderatedBy: null, rejectionReason: null });
          // Limpiar alert history para que se redisparen las alertas
          await AlertHistory.destroy({ where: { offerId: offer.id } });
          await adminService.approveOffer(offer.id, admin.id);
          log(`  ✅ Re-aprobada: "${tpl.title}"`);
        } else {
          log(`  ❌ Error aprobando "${tpl.title}": ${err.message}`);
        }
      }

      // Re-fetch approved offer y disparar alertas DIRECTAMENTE (no esperar process.nextTick)
      offer = await Offer.findByPk(offer.id);
      try {
        const results = await alertService.processNewOffer(offer);
        log(`     📨 Alertas: ${results.alertsSent} enviadas de ${results.totalProcessed} estudiantes`);
        if (results.errors.length > 0) {
          results.errors.forEach((e) => log(`     ⚠️  Error estudiante ${e.studentId}: ${e.error}`));
        }
      } catch (alertErr) {
        log(`     ❌ Error en alertas: ${alertErr.message}`);
      }
      allOffers.push(offer);
    }
  }

  return allOffers;
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR SAVED COMPANIES (estudiantes siguiendo empresas)
// ═══════════════════════════════════════════════════════════════════════
async function createSavedCompanies(students, companies) {
  log('\n4️⃣  Creando relaciones de seguimiento (SavedCompany)...\n');

  // Cada estudiante sigue 2-3 empresas
  const followMap = [
    [0, 2], // Juan → TechNova, CreativaDigital
    [1, 1], // María → LogAndina
    [2, 2], // Carlos → CreativaDigital
    [3, 1], // Ana → LogAndina
    [4, 2], // Lucía → CreativaDigital
    [5, 0], // Diego → TechNova
    [6, 3], // Sofía → HRPartners
    [7, 4], // Pedro → ManuInd
  ];

  for (const [studentIdx, companyIdx] of followMap) {
    const student = students[studentIdx]?.student;
    const company = companies[companyIdx]?.company;
    if (!student || !company) continue;

    const existing = await SavedCompany.findOne({
      where: { studentId: student.id, companyId: company.id },
    });
    if (!existing) {
      await SavedCompany.create({
        studentId: student.id,
        companyId: company.id,
        notificationsEnabled: true,
      });
      log(`  ⭐ ${student.firstName} sigue a ${company.tradeName}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR APPLICATIONS (postulaciones)
// ═══════════════════════════════════════════════════════════════════════
async function createApplications(students, offers) {
  log('\n5️⃣  Creando postulaciones...\n');

  // Postulaciones intencionales: estudiantes a ofertas de su área
  const applicationMap = [
    [0, 0], [0, 1], // Juan → TechNova fullstack, Python
    [5, 2], // Diego → TechNova data science
    [1, 3], [1, 4], // María → LogAndina procesos, datos
    [2, 6], [2, 7], // Carlos → CreativaDigital marketing, community
    [4, 8], // Lucía → CreativaDigital diseño
    [3, 5], // Ana → LogAndina contabilidad
    [6, 9], [6, 10], // Sofía → HRPartners selección, clima
    [7, 11], [7, 12], // Pedro → ManuInd CAD, automatización
  ];

  const statuses = ['enviada', 'revision', 'aceptada', 'descartada'];

  for (const [studentIdx, offerIdx] of applicationMap) {
    const student = students[studentIdx]?.student;
    const offer = offers[offerIdx];
    if (!student || !offer) continue;

    const existing = await Application.findOne({
      where: { studentId: student.id, offerId: offer.id },
    });
    if (!existing) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await Application.create({
        studentId: student.id,
        offerId: offer.id,
        resumeId: students[studentIdx].resume.id,
        status,
        appliedAt: faker.date.recent({ days: 15 }),
        companyResponseAt: status !== 'enviada' ? faker.date.recent({ days: 7 }) : null,
      });
      log(`  📨 ${student.firstName} → "${offer.title}" (${status})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR MESSAGES (mensajes empresa→estudiante)
// ═══════════════════════════════════════════════════════════════════════
async function createMessages(students, companies) {
  log('\n6️⃣  Creando mensajes...\n');

  // Empresa escribe a estudiantes que se postularon
  const messageMap = [
    [0, 0], // TechNova → Juan
    [0, 5], // TechNova → Diego
    [1, 1], // LogAndina → María
    [2, 2], // CreativaDigital → Carlos
    [3, 6], // HRPartners → Sofía
  ];

  const messages = [
    'Hola, gracias por tu postulación. ¿Podrías coordinar una entrevista para esta semana?',
    'Nos gustó mucho tu perfil. ¿Tienes disponibilidad para una entrevista virtual?',
    'Tu CV es muy interesante. Nos gustaría conocerte mejor en una entrevista.',
  ];

  for (const [companyIdx, studentIdx] of messageMap) {
    const companyUser = companies[companyIdx]?.user;
    const studentUser = students[studentIdx]?.user;
    if (!companyUser || !studentUser) continue;

    const existing = await DirectMessage.findOne({
      where: { senderId: companyUser.id, receiverId: studentUser.id },
    });
    if (!existing) {
      await DirectMessage.create({
        senderId: companyUser.id,
        receiverId: studentUser.id,
        content: messages[Math.floor(Math.random() * messages.length)],
        isRead: Math.random() > 0.5,
      });
      log(`  💬 ${companies[companyIdx].company.tradeName} → ${students[studentIdx].student.firstName}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR SIMULATIONS (simulaciones de entrevista)
// ═══════════════════════════════════════════════════════════════════════
async function createSimulations(students) {
  log('\n7️⃣  Creando simulaciones de entrevista...\n');

  const roles = ['Desarrollador Fullstack', 'Analista de Datos', 'Marketing Digital', 'Contador Junior'];

  for (let i = 0; i < students.length; i++) {
    const student = students[i].student;
    const existing = await Simulation.findOne({ where: { studentId: student.id } });
    if (!existing) {
      const completed = Math.random() > 0.4;
      await Simulation.create({
        studentId: student.id,
        simulatedRole: roles[i % roles.length],
        career: student.career,
        sector: 'Tecnología',
        overallScore: completed ? Math.floor(Math.random() * 40) + 60 : null,
        aiFeedbackSummary: completed ? 'Buen desempeño general. Mejorar respuestas técnicas.' : null,
        status: completed ? 'completed' : 'in_progress',
        chatHistory: [
          { role: 'ai', content: 'Hola, cuéntame sobre tu experiencia.' },
          { role: 'user', content: 'Tengo experiencia en proyectos universitarios y prácticas.' },
        ],
      });
      log(`  🤖 Simulación para ${student.firstName} (${completed ? 'completada' : 'en progreso'})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR NOTIFICATIONS ADICIONALES (variadas)
// ═══════════════════════════════════════════════════════════════════════
async function createExtraNotifications(students, offers) {
  log('\n8️⃣  Creando notificaciones adicionales...\n');

  const notifTypes = [
    { type: 'status_change', title: 'Estado de postulación actualizado', msg: 'Tu postulación ha pasado a revisión' },
    { type: 'application_received', title: 'Nueva postulación recibida', msg: 'Un estudiante se ha postulado a tu oferta' },
    { type: 'cv_viewed', title: 'Tu CV fue visto', msg: 'Una empresa revisó tu CV' },
  ];

  for (let i = 0; i < students.length; i++) {
    const user = students[i].user;
    const n = notifTypes[i % notifTypes.length];
    await Notification.create({
      userId: user.id,
      type: n.type,
      title: n.title,
      message: n.msg,
      isRead: Math.random() > 0.5,
      relatedId: offers[i % offers.length]?.id || null,
    });
    log(`  🔔 Notificación para ${students[i].student.firstName}: ${n.title}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// VERIFICAR RESULTADOS
// ═══════════════════════════════════════════════════════════════════════
async function verifyResults(students) {
  log('\n9️⃣  Verificando resultados...\n');

  const recommendationService = require('../../src/services/recommendationService');

  for (const { student, user } of students) {
    try {
      const recos = await recommendationService.getRecommendedOffers(student.id);
      const notifCount = await Notification.count({ where: { userId: user.id, isRead: false } });
      const alertCount = await AlertHistory.count({ where: { studentId: student.id } });

      log(`  📊 ${student.firstName} ${student.lastName} (${student.career}):`);
      log(`     Recomendaciones: ${recos.length} ofertas sobre umbral 40%`);
      if (recos.length > 0) {
        recos.slice(0, 3).forEach((r, i) => {
          log(`       ${i + 1}. ${r.matchScore}% — "${r.offer?.title}"`);
        });
      }
      log(`     Notificaciones sin leer: ${notifCount}`);
      log(`     Alertas en historial: ${alertCount}`);
    } catch (e) {
      log(`  ❌ Error verificando ${student.firstName}: ${e.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
async function run() {
  const isClean = process.argv.includes('--clean');

  try {
    await sequelize.authenticate();
    log('\n🟢 Conectado a la base de datos.\n');

    if (isClean) {
      await cleanAll();
      process.exit(0);
    }

    const hash = await hashPassword();

    log('═══════════════════════════════════════');
    log('  SEED MASIVO — PracHub');
    log('═══════════════════════════════════════');

    // 0. Admin
    log('\n0️⃣  Creando admin...');
    const admin = await ensureAdmin(hash);

    // 1. Estudiantes
    const students = await createStudents(hash);

    // 2. Empresas
    const companies = await createCompanies(hash);

    // 3. Ofertas (crear + aprobar → dispara alertas)
    const offers = await createAndApproveOffers(companies, admin);

    // 4. Saved companies
    await createSavedCompanies(students, companies);

    // 5. Applications
    await createApplications(students, offers);

    // 6. Messages
    await createMessages(students, companies);

    // 7. Simulations
    await createSimulations(students);

    // 8. Notificaciones extra
    await createExtraNotifications(students, offers);

    // 9. Verificar
    await verifyResults(students);

    log('\n═══════════════════════════════════════');
    log('  ✅ SEED MASIVO COMPLETADO');
    log('═══════════════════════════════════════');
    log(`\n  👨‍💼 Admin: ${ADMIN_EMAIL} / ${PASSWORD}`);
    log(`\n  👨‍🎓 Estudiantes (${students.length}):`);
    students.forEach((s, i) => {
      log(`     student${i + 1}@${DOMAIN} / ${PASSWORD} — ${s.student.career}`);
    });
    log(`\n  🏢 Empresas (${companies.length}):`);
    companies.forEach((c, i) => {
      log(`     company${i + 1}@${DOMAIN} / ${PASSWORD} — ${c.company.tradeName}`);
    });
    log(`\n  📋 ${offers.length} ofertas aprobadas (alertas disparadas)`);
    log(`\n  🔧 Para limpiar: node scripts/seeds/seedMassive.js --clean`);
    log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

run();
