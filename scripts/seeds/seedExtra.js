/**
 * seedExtra.js — Seed adicional que extiende seedMassive.js con más data.
 *
 * Crea (encima del seed base):
 *   - 12 estudiantes nuevos (carreras no cubiertas: Civil, Arquitectura, Derecho,
 *     Nutrición, Enfermería, Educación, Economía, Administración, Ambiental,
 *     Química, Turismo, Comunicación Social)
 *   - 5 empresas nuevas (Constructora, Estudio Jurídico, Clínica, Banco, ONG)
 *   - 15 ofertas nuevas (3 por empresa)
 *   - ResumeVersions (versiones guardadas de CV)
 *   - InvitationToApply (invitaciones a postular)
 *   - CVAnalysis (análisis de CV con IA)
 *   - Applications, DirectMessages, Simulations, Notifications adicionales
 *
 * Requisito: ejecutar seedMassive.js PRIMERO.
 *
 * Uso:
 *   node scripts/seeds/seedExtra.js
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
  DirectMessage,
  Simulation,
  InvitationToApply,
  CVAnalysis,
} = require('../../src/models');

const adminService = require('../../src/services/adminService');
const alertService = require('../../src/services/alertService');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════
const PASSWORD = 'TestPass123!';
const DOMAIN = 'prachub.test';

// Los estudiantes del seed base van de student1..student8, los extras empiezan en 9
const STUDENT_OFFSET = 8;
// Las empresas del seed base van de company1..company5, las extras empiezan en 6
const COMPANY_OFFSET = 5;

// ═══════════════════════════════════════════════════════════════════════
// PERFILES DE ESTUDIANTES EXTRAS (carreras no cubiertas en seedMassive)
// ═══════════════════════════════════════════════════════════════════════
const EXTRA_STUDENT_PROFILES = [
  {
    firstName: 'Luis',
    lastName: 'Torres Medina',
    career: 'Ingeniería Civil',
    university: 'Universidad Nacional de Ingeniería',
    cycle: '9no ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería Civil con experiencia en diseño estructural, gestión de obras y AutoCAD. Conocimientos en concreto armado, SAP2000 y MS Project.',
    cv: {
      profile: { summary: 'Estudiante de Ingeniería Civil con experiencia en diseño estructural, gestión de obras, presupuestos y control de calidad. Manejo de AutoCAD, SAP2000, ETABS y MS Project.' },
      skills: {
        areas: [
          { area: 'Diseño Estructural', skills: 'AutoCAD SAP2000 ETABS concreto armado estructuras cálculo estructural planos' },
          { area: 'Gestión de Obras', skills: 'MS Project presupuestos control de calidad planificación obras metrados valorizaciones' },
          { area: 'Normativa', skills: 'Norma E.060 E.070 Reglamento Nacional de Edificaciones seguridad construcción' },
        ],
        soft: 'Liderazgo, organización, trabajo bajo presión, análisis, responsabilidad',
      },
      education: { items: [{ degree: 'Ingeniería Civil', institution: 'Universidad Nacional de Ingeniería', fieldOfStudy: 'Ingeniería Civil' }] },
      experience: { items: [{ role: 'Practicante de Obra', company: 'Constructora del Sur', description: 'Control de calidad de concreto, supervisión de obras, metrados y valorizaciones. Uso de AutoCAD y MS Project.' }] },
      languages: { list: 'Inglés intermedio, Español nativo' },
      projects: { items: [
        { title: 'Diseño Estructural de Edificio de 5 Pisos', description: 'Cálculo estructural con SAP2000 y ETABS. Planos en AutoCAD. Concreto armado según norma E.060.' },
      ] },
      certifications: { items: [{ name: 'AutoCAD Civil 3D Certification', issuer: 'Autodesk' }] },
    },
  },
  {
    firstName: 'Valeria',
    lastName: 'Ríos Castro',
    career: 'Arquitectura',
    university: 'Universidad Peruana de Ciencias Aplicadas',
    cycle: '7mo ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Arquitectura apasionada por el diseño sostenible y la arquitectura bioclimática. Dominio de Revit, SketchUp, Lumion y Adobe Photoshop.',
    cv: {
      profile: { summary: 'Estudiante de Arquitectura con experiencia en diseño arquitectónico, modelado 3D, renderizado y arquitectura sostenible. Dominio de Revit, SketchUp, Lumion, AutoCAD y Adobe Creative Suite.' },
      skills: {
        areas: [
          { area: 'Diseño Arquitectónico', skills: 'Revit SketchUp AutoCAD Lumion modelado 3D renderizado planos arquitectónicos' },
          { area: 'Sostenibilidad', skills: 'Arquitectura bioclimática LEED eficiencia energética materiales sostenibles diseño pasivo' },
          { area: 'Presentación', skills: 'Adobe Photoshop Illustrator InDesign portafolio maquetas renderizado fotorrealista' },
        ],
        soft: 'Creatividad, atención al detalle, comunicación visual, trabajo en equipo, receptividad',
      },
      education: { items: [{ degree: 'Arquitectura', institution: 'Universidad Peruana de Ciencias Aplicadas', fieldOfStudy: 'Arquitectura' }] },
      experience: { items: [{ role: 'Practicante de Arquitectura', company: 'Estudio Arquitectura Viva', description: 'Diseño de proyectos residenciales y comerciales. Modelado 3D en Revit y SketchUp. Renderizado en Lumion.' }] },
      languages: { list: 'Inglés avanzado, Español nativo' },
      projects: { items: [
        { title: 'Centro Comunitario Sostenible', description: 'Proyecto de arquitectura bioclimática con materiales locales. Modelado en Revit y renderizado en Lumion.' },
      ] },
      certifications: { items: [{ name: 'Revit Architecture Certification', issuer: 'Autodesk' }] },
    },
  },
  {
    firstName: 'Fernando',
    lastName: 'García Salazar',
    career: 'Derecho',
    university: 'Pontificia Universidad Católica del Perú',
    cycle: '8vo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Derecho con interés en derecho corporativo, laboral y tributario. Experiencia en redacción de contratos y asesoría legal.',
    cv: {
      profile: { summary: 'Estudiante de Derecho con experiencia en derecho corporativo, laboral, tributario y contratos. Redacción jurídica, análisis normativo y asesoría legal empresarial.' },
      skills: {
        areas: [
          { area: 'Derecho Corporativo', skills: 'Constitución de empresas contratos comerciales fusiones acquisitions gobierno corporativo' },
          { area: 'Derecho Laboral', skills: 'Legislación laboral contratos de trabajo despido indemnizaciones SUNAFIL beneficios sociales' },
          { area: 'Derecho Tributario', skills: 'Tributación SUNAT IGV renta impuestos fiscalización defensa tributaria' },
        ],
        soft: 'Análisis, redacción, negociación, ética, comunicación asertiva',
      },
      education: { items: [{ degree: 'Derecho', institution: 'Pontificia Universidad Católica del Perú', fieldOfStudy: 'Derecho' }] },
      experience: { items: [{ role: 'Practicante Legal', company: 'Estudio García & Asociados', description: 'Redacción de contratos comerciales y laborales. Asesoría tributaria a empresas. Análisis normativo.' }] },
      languages: { list: 'Inglés avanzado, Español nativo' },
      projects: { items: [
        { title: 'Análisis de Reforma Laboral', description: 'Investigación sobre impacto de reformas laborales en PYMES. Análisis comparativo con legislación colombiana.' },
      ] },
      certifications: { items: [{ name: 'Diplomado en Derecho Corporativo', issuer: 'PUCP' }] },
    },
  },
  {
    firstName: 'Camila',
    lastName: 'Vega López',
    career: 'Nutrición',
    university: 'Universidad Nacional Mayor de San Marcos',
    cycle: '6to ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Nutrición con interés en nutrición clínica, deportiva y salud pública. Conocimientos en planes alimentarios y evaluación nutricional.',
    cv: {
      profile: { summary: 'Estudiante de Nutrición con experiencia en evaluación nutricional, planes alimentarios, nutrición clínica y deportiva. Conocimientos en salud pública y educación alimentaria.' },
      skills: {
        areas: [
          { area: 'Nutrición Clínica', skills: 'Evaluación nutricional antropometría planes alimentarios dietoterapia nutrición clínica' },
          { area: 'Nutrición Deportiva', skills: 'Nutrición deportiva suplementación composición corporal rendimiento deportivo hidratación' },
          { area: 'Salud Pública', skills: 'Educación alimentaria programas nutricionales salud pública epidemiología nutricional' },
        ],
        soft: 'Empatía, comunicación, organización, ética, trabajo en equipo',
      },
      education: { items: [{ degree: 'Nutrición', institution: 'Universidad Nacional Mayor de San Marcos', fieldOfStudy: 'Nutrición y Dietética' }] },
      experience: { items: [{ role: 'Practicante de Nutrición', company: 'Clínica San Felipe', description: 'Evaluación nutricional de pacientes. Diseño de planes alimentarios. Educación nutricional grupal.' }] },
      languages: { list: 'Inglés intermedio, Español nativo' },
      projects: { items: [
        { title: 'Programa de Alimentación Saludable en Colegios', description: 'Diseño e implementación de programa nutricional en 3 colegios. Talleres educativos y evaluación de impacto.' },
      ] },
      certifications: { items: [{ name: 'Certificación en Nutrición Deportiva', issuer: 'Colegio de Nutricionistas' }] },
    },
  },
  {
    firstName: 'Alejandro',
    lastName: 'Mendoza Cruz',
    career: 'Enfermería',
    university: 'Universidad Cayetano Heredia',
    cycle: '7mo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Enfermería con experiencia en atención clínica, cuidados intensivos y emergencias. Conocimientos en procedimientos de enfermería y manejo de pacientes.',
    cv: {
      profile: { summary: 'Estudiante de Enfermería con experiencia en atención clínica, cuidados intensivos, emergencias y procedimientos de enfermería. Manejo de pacientes, toma de signos vitales y administración de medicamentos.' },
      skills: {
        areas: [
          { area: 'Atención Clínica', skills: 'Procedimientos de enfermería toma de signos vitales administración de medicamentos curaciones vendajes' },
          { area: 'Cuidados Intensivos', skills: 'UCI monitoreo de pacientes ventilación mecánica manejo de emergencias RCP soporte vital' },
          { area: 'Gestión', skills: 'Historias clínicas protocolos de atención control de infecciones bioseguridad' },
        ],
        soft: 'Empatía, calma bajo presión, trabajo en equipo, responsabilidad, comunicación',
      },
      education: { items: [{ degree: 'Enfermería', institution: 'Universidad Cayetano Heredia', fieldOfStudy: 'Enfermería' }] },
      experience: { items: [{ role: 'Practicante de Enfermería', company: 'Hospital Nacional Arzobispo Loayza', description: 'Atención de pacientes en sala de emergencias. Toma de signos vitales, administración de medicamentos, curaciones.' }] },
      languages: { list: 'Inglés técnico intermedio, Español nativo' },
      projects: { items: [
        { title: 'Protocolo de Atención de Emerencias', description: 'Diseño de protocolo de triaje para servicio de emergencias. Capacitación al personal de enfermería.' },
      ] },
      certifications: { items: [
        { name: 'Soporte Vital Básico (BLS)', issuer: 'American Heart Association' },
        { name: 'Soporte Vital Avanzado (ACLS)', issuer: 'American Heart Association' },
      ] },
    },
  },
  {
    firstName: 'Gabriela',
    lastName: 'Flores Ríos',
    career: 'Educación',
    university: 'Universidad Nacional de Educación Enrique Guzmán y Valle',
    cycle: '8vo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Educación con especialidad en educación primaria. Pasión por la pedagogía, diseño de materiales educativos y uso de TICs en el aula.',
    cv: {
      profile: { summary: 'Estudiante de Educación con experiencia en docencia de primaria, diseño de materiales educativos, evaluación del aprendizaje y uso de TICs en el aula. Conocimientos en pedagogía constructivista.' },
      skills: {
        areas: [
          { area: 'Docencia', skills: 'Planificación curricular diseño de clases evaluación del aprendizaje pedagogía didáctica' },
          { area: 'TICs Educativas', skills: 'Google Classroom Canva Genially Kahoot herramientas digitales gamificación educativa' },
          { area: 'Materiales', skills: 'Diseño de materiales educativos recursos visuales talleres proyectos de aprendizaje' },
        ],
        soft: 'Paciencia, creatividad, empatía, comunicación, liderazgo',
      },
      education: { items: [{ degree: 'Educación Primaria', institution: 'Universidad Nacional de Educación Enrique Guzmán y Valle', fieldOfStudy: 'Educación' }] },
      experience: { items: [{ role: 'Practicante Docente', company: 'I.E. Mariscal Cáceres', description: 'Docencia de primaria. Diseño de materiales educativos. Uso de Google Classroom y herramientas digitales.' }] },
      languages: { list: 'Inglés intermedio, Español nativo, Quechua básico' },
      projects: { items: [
        { title: 'Aula Digital Interactiva', description: 'Implementación de aula digital con Google Classroom, Kahoot y Genially. Mejora del engagement estudiantil.' },
      ] },
      certifications: { items: [{ name: 'Google Certified Educator Level 1', issuer: 'Google' }] },
    },
  },
  {
    firstName: 'Ricardo',
    lastName: 'Soto Vega',
    career: 'Economía',
    university: 'Universidad del Pacífico',
    cycle: '9no ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Economía con interés en análisis financiero, macroeconomía y banca. Conocimientos en Excel avanzado, Python, R y Stata.',
    cv: {
      profile: { summary: 'Estudiante de Economía con experiencia en análisis financiero, econometría, modelado económico y análisis de datos. Manejo de Excel avanzado, Python, R, Stata y SQL.' },
      skills: {
        areas: [
          { area: 'Análisis Económico', skills: 'Macroeconomía microeconomía econometría modelado económico análisis financiero proyecciones' },
          { area: 'Herramientas', skills: 'Excel avanzado Python R Stata SQL Tableau análisis estadístico regresiones' },
          { area: 'Banca y Finanzas', skills: 'Banca inversiones valoración de empresas análisis de riesgo finanzas corporativas Bloomberg' },
        ],
        soft: 'Pensamiento analítico, atención al detalle, comunicación de datos, proactividad',
      },
      education: { items: [{ degree: 'Economía', institution: 'Universidad del Pacífico', fieldOfStudy: 'Economía' }] },
      experience: { items: [{ role: 'Practicante de Análisis Financiero', company: 'Banco de Crédito del Perú', description: 'Análisis de indicadores financieros. Modelos econométricos en R y Python. Reportes con Excel y Tableau.' }] },
      languages: { list: 'Inglés avanzado, Español nativo' },
      projects: { items: [
        { title: 'Modelo de Pronóstico de Inflación', description: 'Modelo econométrico con Python y R para pronosticar inflación. Análisis de variables macroeconómicas.' },
      ] },
      certifications: { items: [{ name: 'CFA Level I Candidate', issuer: 'CFA Institute' }] },
    },
  },
  {
    firstName: 'Daniela',
    lastName: 'Quispe Salazar',
    career: 'Administración',
    university: 'Universidad de Lima',
    cycle: '7mo ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Administración con interés en gestión de proyectos, recursos humanos y emprendimiento. Conocimientos en Excel, SAP y metodologías ágiles.',
    cv: {
      profile: { summary: 'Estudiante de Administración con experiencia en gestión de proyectos, recursos humanos, control de gestión y emprendimiento. Manejo de Excel avanzado, SAP, Power BI y metodologías ágiles.' },
      skills: {
        areas: [
          { area: 'Gestión', skills: 'Gestión de proyectos control de gestión presupuestos KPIs balanced scorecard planificación estratégica' },
          { area: 'Recursos Humanos', skills: 'Reclutamiento selección de personal nómina clima organizacional capacitación evaluación de desempeño' },
          { area: 'Herramientas', skills: 'Excel avanzado SAP Power BI Microsoft Project Trello Asana metodologías ágiles scrum' },
        ],
        soft: 'Liderazgo, organización, comunicación, proactividad, trabajo en equipo',
      },
      education: { items: [{ degree: 'Administración', institution: 'Universidad de Lima', fieldOfStudy: 'Administración de Empresas' }] },
      experience: { items: [{ role: 'Practicante de RRHH', company: 'Grupo Palermo', description: 'Procesos de selección de personal. Gestión de nómina. Capacitaciones. Evaluación de clima organizacional.' }] },
      languages: { list: 'Inglés intermedio, Español nativo' },
      projects: { items: [
        { title: 'Plan Estratégico para PYME', description: 'Diseño de plan estratégico con balanced scorecard. KPIs por área. Cronograma en MS Project.' },
      ] },
      certifications: { items: [{ name: 'Scrum Foundation Certificate', issuer: 'Scrum Institute' }] },
    },
  },
  {
    firstName: 'Roberto',
    lastName: 'Huamán Cruz',
    career: 'Ingeniería Ambiental',
    university: 'Universidad Nacional Agraria La Molina',
    cycle: '8vo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería Ambiental con interés en gestión de residuos, energía renovable y evaluación de impacto ambiental. Conocimientos en SIG, Python y AutoCAD.',
    cv: {
      profile: { summary: 'Estudiante de Ingeniería Ambiental con experiencia en evaluación de impacto ambiental, gestión de residuos, energía renovable y SIG. Manejo de QGIS, ArcGIS, Python, AutoCAD y Excel avanzado.' },
      skills: {
        areas: [
          { area: 'Gestión Ambiental', skills: 'Evaluación de impacto ambiental gestión de residuos energía renovable tratamiento de aguas contaminación' },
          { area: 'SIG', skills: 'QGIS ArcGIS SIG cartografía modelado espacial análisis ambiental teledetección' },
          { area: 'Herramientas', skills: 'Python Excel avanzado AutoCAD R análisis estadístico modelado ambiental' },
        ],
        soft: 'Compromiso ambiental, análisis, trabajo en equipo, comunicación, proactividad',
      },
      education: { items: [{ degree: 'Ingeniería Ambiental', institution: 'Universidad Nacional Agraria La Molina', fieldOfStudy: 'Ingeniería Ambiental' }] },
      experience: { items: [{ role: 'Practicante Ambiental', company: 'ONG EcoVerde', description: 'Evaluación de impacto ambiental de proyectos. Gestión de residuos sólidos. Talleres de educación ambiental.' }] },
      languages: { list: 'Inglés intermedio, Español nativo' },
      projects: { items: [
        { title: 'Sistema de Gestión de Residuos para Universidad', description: 'Diseño de sistema de segregación y reciclaje. Campaña educativa. Reducción de residuos en 40%.' },
      ] },
      certifications: { items: [{ name: 'ISO 14001 Internal Auditor', issuer: 'Bureau Veritas' }] },
    },
  },
  {
    firstName: 'Patricia',
    lastName: 'Lara Mendoza',
    career: 'Ingeniería Química',
    university: 'Universidad Nacional de Ingeniería',
    cycle: '9no ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Ingeniería Química con interés en procesos industriales, control de calidad y alimentos. Conocimientos en Aspen Plus, Excel y análisis químico.',
    cv: {
      profile: { summary: 'Estudiante de Ingeniería Química con experiencia en procesos industriales, control de calidad, industria alimentaria y simulación de procesos. Manejo de Aspen Plus, Excel avanzado, HPLC y espectrofotometría.' },
      skills: {
        areas: [
          { area: 'Procesos Industriales', skills: 'Aspen Plus simulación de procesos balances de materia y energía termodinámica operaciones unitarias' },
          { area: 'Control de Calidad', skills: 'HPLC espectrofotometría control de calidad ISO 17025 análisis químico normas técnicas' },
          { area: 'Alimentos', skills: 'Industria alimentaria BPM HACCP inocuidad alimentaria procesamiento de alimentos' },
        ],
        soft: 'Análisis, precisión, organización, trabajo en equipo, resolución de problemas',
      },
      education: { items: [{ degree: 'Ingeniería Química', institution: 'Universidad Nacional de Ingeniería', fieldOfStudy: 'Ingeniería Química' }] },
      experience: { items: [{ role: 'Practicante de Control de Calidad', company: 'Alicorp SAA', description: 'Análisis fisicoquímicos con HPLC y espectrofotometría. Control de calidad de productos alimentarios. BPM y HACCP.' }] },
      languages: { list: 'Inglés técnico avanzado, Español nativo' },
      projects: { items: [
        { title: 'Optimización de Proceso de Pasteurización', description: 'Simulación en Aspen Plus. Optimización de parámetros. Reducción de consumo energético en 15%.' },
      ] },
      certifications: { items: [{ name: 'HACCP Certification', issuer: 'FDA' }] },
    },
  },
  {
    firstName: 'Stefano',
    lastName: 'Ricci Torres',
    career: 'Turismo',
    university: 'Universidad de San Martín de Porres',
    cycle: '6to ciclo',
    availability: 'Medio tiempo',
    bio: 'Estudiante de Turismo con pasión por el turismo sostenible, gestión hotelera y eventos. Conocimientos en Amadeus, Excel e idiomas.',
    cv: {
      profile: { summary: 'Estudiante de Turismo con experiencia en gestión hotelera, planificación de tours, turismo sostenible y organización de eventos. Manejo de Amadeus, Excel, e idiomas (italiano, inglés, portugués).' },
      skills: {
        areas: [
          { area: 'Gestión Turística', skills: 'Planificación de tours gestión hotelera reservas Amadeus turismo sostenible ecoturismo' },
          { area: 'Eventos', skills: 'Organización de eventos coordinación logística protocolo banquetes catering' },
          { area: 'Idiomas', skills: 'Italiano avanzado inglés avanzado portugués intermedio atención al cliente' },
        ],
        soft: 'Comunicación, hospitalidad, organización, adaptabilidad, trabajo en equipo',
      },
      education: { items: [{ degree: 'Turismo y Hotelería', institution: 'Universidad de San Martín de Porres', fieldOfStudy: 'Turismo' }] },
      experience: { items: [{ role: 'Practicante de Recepción', company: 'Hotel Belmond Miraflores Park', description: 'Atención al huésped, check-in/check-out, reservas. Manejo de Amadeus. Coordinación de tours.' }] },
      languages: { list: 'Italiano avanzado, Inglés avanzado, Portugués intermedio, Español nativo' },
      projects: { items: [
        { title: 'Ruta Turística Sostenible en Cusco', description: 'Diseño de ruta turística sostenible con comunidades locales. Plan de gestión ambiental.' },
      ] },
      certifications: { items: [{ name: 'Amadeus Basic Certification', issuer: 'Amadeus' }] },
    },
  },
  {
    firstName: 'Melissa',
    lastName: 'Castillo Vega',
    career: 'Comunicación Social',
    university: 'Universidad de Lima',
    cycle: '7mo ciclo',
    availability: 'Tiempo completo',
    bio: 'Estudiante de Comunicación Social con interés en periodismo digital, comunicación corporativa y relaciones públicas. Experiencia en redacción y redes sociales.',
    cv: {
      profile: { summary: 'Estudiante de Comunicación Social con experiencia en periodismo digital, comunicación corporativa, relaciones públicas y gestión de redes sociales. Redacción, edición de contenido y manejo de crisis.' },
      skills: {
        areas: [
          { area: 'Periodismo Digital', skills: 'Redacción periodística investigación edición de contenido SEO periodismo digital WordPress' },
          { area: 'Comunicación Corporativa', skills: 'Comunicación interna y externa relaciones públicas prensa manejo de crisis discursos' },
          { area: 'Redes Sociales', skills: 'Community management contenido digital Facebook Instagram Twitter LinkedIn Google Analytics' },
        ],
        soft: 'Comunicación, redacción, creatividad, proactividad, trabajo bajo presión',
      },
      education: { items: [{ degree: 'Comunicación Social', institution: 'Universidad de Lima', fieldOfStudy: 'Comunicación Social' }] },
      experience: { items: [{ role: 'Practicante de Comunicaciones', company: 'PR Agency Comunicaciones', description: 'Redacción de notas de prensa. Gestión de redes sociales corporativas. Coordinación con medios.' }] },
      languages: { list: 'Inglés avanzado, Español nativo' },
      projects: { items: [
        { title: 'Blog de Periodismo Digital', description: 'Blog de noticias con WordPress. SEO y redes sociales. 5000 visitas mensuales en 3 meses.' },
      ] },
      certifications: { items: [{ name: 'Google Digital Marketing Certification', issuer: 'Google' }] },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// PERFILES DE EMPRESAS EXTRAS
// ═══════════════════════════════════════════════════════════════════════
const EXTRA_COMPANY_PROFILES = [
  {
    legalName: 'Constructora Andina SAC',
    tradeName: 'ConstAndina',
    industry: 'Construcción',
    description: 'Empresa de construcción con más de 20 años de experiencia en obras civiles, edificaciones y infraestructura. Cobertura nacional.',
    companySize: 'large',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Ingeniería Civil - Supervisión de Obra',
        description: 'Buscamos estudiante de Ingeniería Civil para prácticas en supervisión de obras. Trabajarás con AutoCAD, control de calidad de concreto, metrados, valorizaciones y MS Project.',
        requirements: '- Estudiante de Ingeniería Civil\n- Conocimientos en AutoCAD y MS Project\n- Control de calidad de concreto\n- Metrados y valorizaciones\n- Norma E.060 y RNE\n- Trabajo bajo presión',
        area: 'Construcción',
        careerTags: ['Ingeniería Civil', 'Ingeniería de Construcción'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,500 mensual',
      },
      {
        title: 'Practicante de Arquitectura - Diseño y Planos',
        description: 'Buscamos estudiante de Arquitectura para prácticas en diseño de proyectos. Trabajarás con Revit, AutoCAD, SketchUp y Lumion en proyectos residenciales y comerciales.',
        requirements: '- Estudiante de Arquitectura\n- Dominio de Revit y AutoCAD\n- SketchUp y Lumion para renderizado\n- Planos arquitectónicos y técnicos\n- Portafolio de proyectos\n- Creatividad y atención al detalle',
        area: 'Arquitectura',
        careerTags: ['Arquitectura', 'Diseño Arquitectónico'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,300 mensual',
      },
      {
        title: 'Practicante de Presupuestos y Valorizaciones',
        description: 'Buscamos estudiante de Ingeniería Civil o Arquitectura para prácticas en presupuestos. Trabajarás con Excel avanzado, S10, metrados y análisis de precios unitarios.',
        requirements: '- Estudiante de Ingeniería Civil o Arquitectura\n- Excel avanzado\n- S10 o software de presupuestos\n- Metrados y análisis de precios unitarios\n- Conocimiento de RNE\n- Organización y análisis',
        area: 'Presupuestos',
        careerTags: ['Ingeniería Civil', 'Arquitectura', 'Ingeniería de Construcción'],
        modality: 'in_person',
        duration: '4 meses',
        compensation: 'S/ 1,200 mensual',
      },
    ],
  },
  {
    legalName: 'Estudio Jurídico García & Asociados',
    tradeName: 'GarcíaLegal',
    industry: 'Servicios Legales',
    description: 'Estudio jurídico boutique especializado en derecho corporativo, laboral y tributario. Asesoramos a empresas nacionales y multinacionales.',
    companySize: 'small',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Derecho Corporativo',
        description: 'Buscamos estudiante de Derecho para prácticas en derecho corporativo. Redacción de contratos, constitución de empresas, asesoría legal y gobierno corporativo.',
        requirements: '- Estudiante de Derecho (últimos ciclos)\n- Conocimientos en derecho corporativo\n- Redacción jurídica\n- Contratos comerciales\n- Inglés avanzado deseable\n- Análisis y negociación',
        area: 'Derecho Corporativo',
        careerTags: ['Derecho', 'Derecho Corporativo'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,200 mensual',
      },
      {
        title: 'Practicante de Derecho Laboral y Tributario',
        description: 'Buscamos estudiante de Derecho para prácticas en derecho laboral y tributario. Asesoría a empresas, contratos de trabajo, SUNAT y defensa tributaria.',
        requirements: '- Estudiante de Derecho\n- Conocimientos en derecho laboral\n- Tributación SUNAT\n- Contratos de trabajo\n- Legislación peruana\n- Redacción y análisis',
        area: 'Derecho Laboral',
        careerTags: ['Derecho', 'Derecho Laboral', 'Derecho Tributario'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,000 mensual',
      },
      {
        title: 'Practicante de Comunicación y Relaciones Públicas',
        description: 'Buscamos estudiante de Comunicación Social para prácticas en comunicación corporativa del estudio. Redacción de contenido, gestión de redes y relaciones con medios.',
        requirements: '- Estudiante de Comunicación Social\n- Redacción y edición de contenido\n- Gestión de redes sociales\n- Relaciones públicas\n- WordPress y SEO\n- Comunicación asertiva',
        area: 'Comunicación Corporativa',
        careerTags: ['Comunicación Social', 'Comunicaciones', 'Relaciones Públicas'],
        modality: 'hybrid',
        duration: '4 meses',
        compensation: 'S/ 900 mensual',
      },
    ],
  },
  {
    legalName: 'Clínica San Felipe SAC',
    tradeName: 'SanFelipe',
    industry: 'Salud',
    description: 'Clínica privada con más de 30 especialidades. Atención ambulatoria, hospitalización, emergencias y UCI. Comprometidos con la calidad y seguridad del paciente.',
    companySize: 'medium',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Enfermería - Emergencias',
        description: 'Buscamos estudiante de Enfermería para prácticas en servicio de emergencias. Atención de pacientes, toma de signos vitales, administración de medicamentos y procedimientos.',
        requirements: '- Estudiante de Enfermería\n- Procedimientos de enfermería\n- Toma de signos vitales\n- Administración de medicamentos\n- RCP y soporte vital\n- Calma bajo presión',
        area: 'Enfermería',
        careerTags: ['Enfermería', 'Salud'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,200 mensual',
      },
      {
        title: 'Practicante de Nutrición Clínica',
        description: 'Buscamos estudiante de Nutrición para prácticas en nutrición clínica. Evaluación nutricional de pacientes, planes alimentarios y educación nutricional.',
        requirements: '- Estudiante de Nutrición\n- Evaluación nutricional\n- Planes alimentarios\n- Dietoterapia\n- Antropometría\n- Empatía y comunicación',
        area: 'Nutrición',
        careerTags: ['Nutrición', 'Salud', 'Dietética'],
        modality: 'in_person',
        duration: '4 meses',
        compensation: 'S/ 1,000 mensual',
      },
      {
        title: 'Practicante de Administración - Gestión Hospitalaria',
        description: 'Buscamos estudiante de Administración para prácticas en gestión hospitalaria. Control de gestión, indicadores de calidad, procesos y atención al paciente.',
        requirements: '- Estudiante de Administración\n- Excel avanzado\n- Control de gestión e indicadores\n- Procesos hospitalarios\n- Atención al paciente\n- Organización y comunicación',
        area: 'Gestión Hospitalaria',
        careerTags: ['Administración', 'Gestión en Salud', 'Ingeniería Industrial'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,100 mensual',
      },
    ],
  },
  {
    legalName: 'Banco del Sur SAA',
    tradeName: 'BancoSur',
    industry: 'Banca y Finanzas',
    description: 'Banco peruano con presencia nacional. Banca corporativa, PYME, retail y banca digital. Comprometidos con la inclusión financiera.',
    companySize: 'large',
    city: 'Lima',
    offers: [
      {
        title: 'Practicante de Análisis Financiero y Riesgo',
        description: 'Buscamos estudiante de Economía o Administración para prácticas en análisis financiero. Modelos de riesgo, indicadores financieros, reportes con Excel y Python.',
        requirements: '- Estudiante de Economía o Administración\n- Excel avanzado\n- Análisis financiero y riesgo\n- Python o R deseable\n- Modelos econométricos\n- Pensamiento analítico',
        area: 'Análisis Financiero',
        careerTags: ['Economía', 'Administración', 'Finanzas'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,500 mensual',
      },
      {
        title: 'Practicante de Banca Digital y Tecnología',
        description: 'Buscamos estudiante de Ingeniería de Sistemas o Software para prácticas en banca digital. Desarrollo de features para app móvil, APIs y análisis de datos.',
        requirements: '- Estudiante de Ingeniería de Sistemas o Software\n- Conocimientos en APIs REST\n- JavaScript, Python o Java\n- Bases de datos SQL\n- Análisis de datos\n- Proactividad',
        area: 'Tecnología y Banca Digital',
        careerTags: ['Ingeniería de Sistemas', 'Ingeniería de Software', 'Ciencias de la Computación'],
        modality: 'remote',
        duration: '6 meses',
        compensation: 'S/ 1,800 mensual',
      },
      {
        title: 'Practicante de Recursos Humanos',
        description: 'Buscamos estudiante de Administración o Psicología para prácticas en RRHH. Selección de personal, capacitación, clima organizacional y gestión del talento.',
        requirements: '- Estudiante de Administración o Psicología\n- Selección de personal\n- Capacitación y desarrollo\n- Clima organizacional\n- Excel intermedio\n- Comunicación y organización',
        area: 'Recursos Humanos',
        careerTags: ['Administración', 'Psicología', 'Recursos Humanos'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,200 mensual',
      },
    ],
  },
  {
    legalName: 'ONG EcoVerde Perú',
    tradeName: 'EcoVerde',
    industry: 'Medio Ambiente',
    description: 'ONG dedicada a la conservación ambiental, educación ecológica, energía renovable y gestión de residuos. Proyectos en comunidades rurales y urbanas.',
    companySize: 'small',
    city: 'Cusco',
    offers: [
      {
        title: 'Practicante de Ingeniería Ambiental - Evaluación de Impacto',
        description: 'Buscamos estudiante de Ingeniería Ambiental para prácticas en evaluación de impacto ambiental. Estudios ambientales, SIG (QGIS), gestión de residuos y energía renovable.',
        requirements: '- Estudiante de Ingeniería Ambiental\n- Evaluación de impacto ambiental\n- QGIS o ArcGIS\n- Gestión de residuos\n- Energía renovable\n- Compromiso ambiental',
        area: 'Gestión Ambiental',
        careerTags: ['Ingeniería Ambiental', 'Ingeniería Forestal', 'Ciencias Ambientales'],
        modality: 'hybrid',
        duration: '6 meses',
        compensation: 'S/ 1,000 mensual',
      },
      {
        title: 'Practicante de Comunicación - Educación Ambiental',
        description: 'Buscamos estudiante de Comunicación Social para prácticas en educación ambiental. Campañas, redes sociales, talleres y materiales educativos.',
        requirements: '- Estudiante de Comunicación Social\n- Redacción y contenido digital\n- Redes sociales\n- Canva y diseño básico\n- Educación ambiental\n- Creatividad y pasión ambiental',
        area: 'Comunicación Ambiental',
        careerTags: ['Comunicación Social', 'Educación Ambiental', 'Comunicaciones'],
        modality: 'remote',
        duration: '4 meses',
        compensation: 'S/ 900 mensual',
      },
      {
        title: 'Practicante de Turismo Sostenible',
        description: 'Buscamos estudiante de Turismo para prácticas en turismo sostenible y comunitario. Diseño de rutas, gestión con comunidades y planificación.',
        requirements: '- Estudiante de Turismo\n- Turismo sostenible y comunitario\n- Planificación de rutas\n- Gestión con comunidades\n- Idiomas (inglés)\n- Comunicación y adaptabilidad',
        area: 'Turismo Sostenible',
        careerTags: ['Turismo', 'Gestión Turística', 'Hospitalidad'],
        modality: 'in_person',
        duration: '6 meses',
        compensation: 'S/ 1,000 mensual',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
function log(msg) {
  console.log(msg);
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR ESTUDIANTES EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraStudents(hash) {
  const students = [];
  log('\n1️⃣  Creando estudiantes extras...\n');

  for (let i = 0; i < EXTRA_STUDENT_PROFILES.length; i++) {
    const p = EXTRA_STUDENT_PROFILES[i];
    const email = `student${STUDENT_OFFSET + i + 1}@${DOMAIN}`;

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

    // AlertSettings
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

    // ResumeVersion (versión guardada del CV)
    let version = await ResumeVersion.findOne({ where: { studentId: student.id } });
    if (!version) {
      version = await ResumeVersion.create({
        studentId: student.id,
        title: `CV ${p.firstName} - Versión Optimizada`,
        profile: p.cv.profile,
        skills: p.cv.skills,
        education: p.cv.education,
        experience: p.cv.experience,
        languages: p.cv.languages,
        projects: p.cv.projects,
        certifications: p.cv.certifications,
        completionPercentage: 90,
        template: 'modern',
      });
    }

    students.push({ user, student, resume, version });
    log(`  📋 ${p.firstName} ${p.lastName} — ${p.career} (${email})`);
  }

  return students;
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR EMPRESAS EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraCompanies(hash) {
  const companies = [];
  log('\n2️⃣  Creando empresas extras...\n');

  for (let i = 0; i < EXTRA_COMPANY_PROFILES.length; i++) {
    const p = EXTRA_COMPANY_PROFILES[i];
    const email = `company${COMPANY_OFFSET + i + 1}@${DOMAIN}`;

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
        taxId: `20${String(20000000000 + i * 22222222).slice(0, 10)}`,
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
// CREAR Y APROBAR OFERTAS EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createAndApproveExtraOffers(companies, admin) {
  const allOffers = [];
  log('\n3️⃣  Creando y aprobando ofertas extras...\n');

  for (const { company, offers: offerTemplates } of companies) {
    for (const tpl of offerTemplates) {
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
        await offer.update({ status: 'pending', moderatedAt: null, moderatedBy: null });
      }

      try {
        await adminService.approveOffer(offer.id, admin.id);
        log(`  ✅ Aprobada: "${tpl.title}"`);
      } catch (err) {
        if (err.message?.includes('ya ha sido moderada')) {
          await offer.update({ status: 'pending', moderatedAt: null, moderatedBy: null, rejectionReason: null });
          await AlertHistory.destroy({ where: { offerId: offer.id } });
          await adminService.approveOffer(offer.id, admin.id);
          log(`  ✅ Re-aprobada: "${tpl.title}"`);
        } else {
          log(`  ❌ Error aprobando "${tpl.title}": ${err.message}`);
        }
      }

      offer = await Offer.findByPk(offer.id);
      try {
        const results = await alertService.processNewOffer(offer);
        log(`     📨 Alertas: ${results.alertsSent} enviadas de ${results.totalProcessed} estudiantes`);
      } catch (alertErr) {
        log(`     ❌ Error en alertas: ${alertErr.message}`);
      }
      allOffers.push(offer);
    }
  }

  return allOffers;
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR SAVED COMPANIES EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraSavedCompanies(extraStudents, extraCompanies, baseStudents, baseCompanies) {
  log('\n4️⃣  Creando relaciones de seguimiento extras...\n');

  // Estudiantes extras siguen empresas extras Y de la base
  const allCompanies = [...(baseCompanies || []), ...extraCompanies];
  const followMap = [
    [0, 0], // Luis → ConstAndina
    [0, 5], // Luis → TechNova (base)
    [1, 0], // Valeria → ConstAndina
    [2, 1], // Fernando → GarcíaLegal
    [3, 2], // Camila → SanFelipe
    [4, 2], // Alejandro → SanFelipe
    [5, 1], // Gabriela → GarcíaLegal
    [6, 3], // Ricardo → BancoSur
    [7, 3], // Daniela → BancoSur
    [7, 2], // Daniela → SanFelipe
    [8, 4], // Roberto → EcoVerde
    [9, 3], // Patricia → BancoSur
    [10, 4], // Stefano → EcoVerde
    [11, 1], // Melissa → GarcíaLegal
    [11, 4], // Melissa → EcoVerde
  ];

  for (const [studentIdx, companyIdx] of followMap) {
    const student = extraStudents[studentIdx]?.student;
    const company = allCompanies[companyIdx]?.company || extraCompanies[companyIdx - (baseCompanies?.length || 0)]?.company;
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
// CREAR APPLICATIONS EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraApplications(extraStudents, extraOffers, baseOffers) {
  log('\n5️⃣  Creando postulaciones extras...\n');

  const allOffers = [...(baseOffers || []), ...extraOffers];
  const applicationMap = [
    [0, 0], [0, 2], // Luis → ConstAndina supervisión, presupuestos
    [1, 1], // Valeria → ConstAndina diseño
    [2, 3], [2, 4], // Fernando → GarcíaLegal corporativo, laboral
    [3, 7], // Camila → SanFelipe nutrición
    [4, 6], // Alejandro → SanFelipe enfermería
    [5, 5], // Gabriela → GarcíaLegal comunicación
    [6, 9], [6, 10], // Ricardo → BancoSur análisis, banca digital
    [7, 8], [7, 11], // Daniela → BancoSur RRHH, SanFelipe admin
    [8, 12], // Roberto → EcoVerde ambiental
    [9, 10], // Patricia → BancoSur banca digital
    [10, 14], // Stefano → EcoVerde turismo
    [11, 5], [11, 13], // Melissa → GarcíaLegal comms, EcoVerde comms
  ];

  const statuses = ['enviada', 'revision', 'aceptada', 'descartada'];

  for (const [studentIdx, offerIdx] of applicationMap) {
    const student = extraStudents[studentIdx]?.student;
    const offer = allOffers[offerIdx];
    if (!student || !offer) continue;

    const existing = await Application.findOne({
      where: { studentId: student.id, offerId: offer.id },
    });
    if (!existing) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await Application.create({
        studentId: student.id,
        offerId: offer.id,
        resumeId: extraStudents[studentIdx].resume.id,
        status,
        appliedAt: faker.date.recent({ days: 20 }),
        companyResponseAt: status !== 'enviada' ? faker.date.recent({ days: 10 }) : null,
      });
      log(`  📨 ${student.firstName} → "${offer.title}" (${status})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR MESSAGES + INVITATIONS TO APPLY
// ═══════════════════════════════════════════════════════════════════════
async function createExtraMessagesAndInvitations(extraStudents, extraCompanies, extraOffers) {
  log('\n6️⃣  Creando mensajes e invitaciones a postular...\n');

  const messageMap = [
    { companyIdx: 0, studentIdx: 0, offerIdx: 0, msg: 'Hola Luis, tu perfil en Ingeniería Civil encaja perfectamente con nuestra oferta de supervisión de obra. ¿Te interesa postular?' },
    { companyIdx: 0, studentIdx: 1, offerIdx: 1, msg: 'Hola Valeria, vimos tu portafolio de arquitectura y nos encantó. Tenemos una práctica en diseño que podría interesarte.' },
    { companyIdx: 1, studentIdx: 2, offerIdx: 3, msg: 'Hola Fernando, buscamos un practicante de derecho corporativo y tu perfil es ideal. ¿Te gustaría postular?' },
    { companyIdx: 2, studentIdx: 4, offerIdx: 6, msg: 'Hola Alejandro, tenemos una vacante en enfermería de emergencias. Tu experiencia en el Loayza es muy valiosa.' },
    { companyIdx: 3, studentIdx: 6, offerIdx: 9, msg: 'Hola Ricardo, tu conocimiento en Python y R es justo lo que necesitamos en análisis financiero. ¿Te interesa?' },
    { companyIdx: 4, studentIdx: 8, offerIdx: 12, msg: 'Hola Roberto, tu compromiso ambiental encaja con nuestra misión. Tenemos una práctica en evaluación de impacto.' },
    { companyIdx: 4, studentIdx: 10, offerIdx: 14, msg: 'Hola Stefano, tu experiencia en turismo sostenible es perfecta para nuestro proyecto en Cusco.' },
  ];

  for (const { companyIdx, studentIdx, offerIdx, msg } of messageMap) {
    const companyUser = extraCompanies[companyIdx]?.user;
    const studentUser = extraStudents[studentIdx]?.user;
    const student = extraStudents[studentIdx]?.student;
    const offer = extraOffers[offerIdx];
    if (!companyUser || !studentUser || !student || !offer) continue;

    // Crear DirectMessage
    let dm = await DirectMessage.findOne({
      where: { senderId: companyUser.id, receiverId: studentUser.id },
    });
    if (!dm) {
      dm = await DirectMessage.create({
        senderId: companyUser.id,
        receiverId: studentUser.id,
        content: msg,
        isRead: Math.random() > 0.5,
      });
      log(`  💬 ${extraCompanies[companyIdx].company.tradeName} → ${student.firstName}`);
    }

    // Crear InvitationToApply vinculada al mensaje
    let inv = await InvitationToApply.findOne({
      where: { messageId: dm.id, offerId: offer.id },
    });
    if (!inv) {
      const statuses = ['PENDING', 'ACCEPTED', 'DECLINED'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await InvitationToApply.create({
        messageId: dm.id,
        offerId: offer.id,
        studentId: student.id,
        recruiterMessage: msg,
        responseStatus: status,
        respondedAt: status !== 'PENDING' ? faker.date.recent({ days: 5 }) : null,
      });
      log(`  📨 Invitación a ${student.firstName} para "${offer.title}" (${status})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR SIMULATIONS EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraSimulations(extraStudents) {
  log('\n7️⃣  Creando simulaciones de entrevista extras...\n');

  const roles = [
    'Ingeniero Civil Junior', 'Arquitecto Junior', 'Asesor Legal Junior',
    'Nutricionista Clínico', 'Enfermero de Emergencias', 'Docente de Primaria',
    'Analista Financiero', 'Analista de RRHH', 'Ingeniero Ambiental',
    'Ingeniero Químico Junior', 'Coordinador Turístico', 'Comunicador Corporativo',
  ];

  for (let i = 0; i < extraStudents.length; i++) {
    const student = extraStudents[i].student;
    const existing = await Simulation.findOne({ where: { studentId: student.id } });
    if (!existing) {
      const completed = Math.random() > 0.3;
      await Simulation.create({
        studentId: student.id,
        simulatedRole: roles[i % roles.length],
        career: student.career,
        sector: 'Diverso',
        overallScore: completed ? Math.floor(Math.random() * 40) + 55 : null,
        aiFeedbackSummary: completed
          ? 'Buen desempeño general. Mejorar respuestas técnicas y estructura STAR en ejemplos.'
          : null,
        status: completed ? 'completed' : 'in_progress',
        chatHistory: [
          { role: 'ai', content: 'Hola, cuéntame sobre tu experiencia y por qué te interesa esta posición.' },
          { role: 'user', content: 'Tengo experiencia en proyectos universitarios y prácticas pre-profesionales relacionadas al área.' },
          { role: 'ai', content: '¿Puedes darme un ejemplo de un desafío que enfrentaste y cómo lo resolviste?' },
          { role: 'user', content: 'En un proyecto, tuvimos un problema con los plazos. Coordiné con el equipo y reorganizamos las tareas.' },
        ],
      });
      log(`  🤖 Simulación para ${student.firstName} (${completed ? 'completada' : 'en progreso'})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR CV ANALYSIS (análisis de CV con IA)
// ═══════════════════════════════════════════════════════════════════════
async function createExtraCVAnalyses(extraStudents, extraOffers) {
  log('\n8️⃣  Creando análisis de CV (CVAnalysis)...\n');

  for (let i = 0; i < extraStudents.length; i++) {
    const { student, resume } = extraStudents[i];
    const offer = extraOffers[i % extraOffers.length];

    const existing = await CVAnalysis.findOne({
      where: { studentId: student.id, offerId: offer.id },
    });
    if (!existing) {
      const score = Math.floor(Math.random() * 40) + 50; // 50-90
      await CVAnalysis.create({
        studentId: student.id,
        resumeId: resume.id,
        offerId: offer.id,
        overallScore: score,
        sectionScores: {
          profile: Math.floor(Math.random() * 30) + 60,
          skills: Math.floor(Math.random() * 30) + 55,
          experience: Math.floor(Math.random() * 30) + 50,
          education: Math.floor(Math.random() * 20) + 70,
          languages: Math.floor(Math.random() * 25) + 60,
        },
        observations: [
          'El perfil profesional está bien estructurado pero podría ser más específico.',
          'Las habilidades técnicas coinciden parcialmente con los requisitos de la oferta.',
          'La experiencia es relevante pero limitada en el sector específico.',
        ],
        recommendations: [
          'Añadir palabras clave específicas de la oferta en el perfil profesional.',
          'Cuantificar logros en la sección de experiencia (números, porcentajes).',
          'Incluir proyectos más relacionados con el área de la oferta.',
        ],
        keywordsAnalysis: {
          matched: ['Python', 'Excel', 'análisis'],
          missing: ['AWS', 'Docker', 'Power BI'],
          coverage: '65%',
        },
        improvedCv: null, // No generamos CV mejorado en seed
      });
      log(`  📊 Análisis CV de ${student.firstName} para "${offer.title}" — Score: ${score}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR NOTIFICATIONS EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraNotifications(extraStudents, extraOffers) {
  log('\n9️⃣  Creando notificaciones extras...\n');

  const notifTypes = [
    { type: 'status_change', title: 'Estado de postulación actualizado', msg: 'Tu postulación ha pasado a revisión' },
    { type: 'application_received', title: 'Nueva postulación recibida', msg: 'Un estudiante se ha postulado a tu oferta' },
    { type: 'cv_viewed', title: 'Tu CV fue visto', msg: 'Una empresa revisó tu CV' },
    { type: 'offer_approved', title: 'Oferta aprobada', msg: 'Tu oferta ha sido aprobada y publicada' },
    { type: 'message_received', title: 'Nuevo mensaje', msg: 'Has recibido un mensaje de una empresa' },
    { type: 'offer_match', title: 'Nueva oferta compatible', msg: 'Encontramos una oferta que coincide con tu perfil' },
  ];

  for (let i = 0; i < extraStudents.length; i++) {
    const user = extraStudents[i].user;
    // 2 notificaciones por estudiante
    for (let j = 0; j < 2; j++) {
      const n = notifTypes[(i * 2 + j) % notifTypes.length];
      await Notification.create({
        userId: user.id,
        type: n.type,
        title: n.title,
        message: n.msg,
        isRead: Math.random() > 0.4,
        relatedId: extraOffers[(i + j) % extraOffers.length]?.id || null,
      });
    }
    log(`  🔔 2 notificaciones para ${extraStudents[i].student.firstName}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CREAR ALERT HISTORY EXTRAS
// ═══════════════════════════════════════════════════════════════════════
async function createExtraAlertHistory(extraStudents, extraOffers) {
  log('\n🔟  Creando entradas de AlertHistory extras...\n');

  for (let i = 0; i < extraStudents.length; i++) {
    const student = extraStudents[i].student;
    const offer = extraOffers[i % extraOffers.length];

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

    log('═══════════════════════════════════════');
    log('  SEED EXTRA — PracHub (data adicional)');
    log('═══════════════════════════════════════');

    // Buscar admin existente (creado por seedMassive)
    const admin = await User.findOne({ where: { email: 'admin@prachub.test' } });
    if (!admin) {
      log('❌ No se encontró el admin. Ejecuta seedMassive.js primero.');
      process.exit(1);
    }

    // Buscar data base existente (para relaciones cruzadas)
    const baseStudents = [];
    for (let i = 0; i < STUDENT_OFFSET; i++) {
      const email = `student${i + 1}@${DOMAIN}`;
      const user = await User.findOne({ where: { email } });
      if (user) {
        const student = await Student.findOne({ where: { userId: user.id } });
        const resume = await Resume.findOne({ where: { studentId: student.id } });
        if (student) baseStudents.push({ user, student, resume });
      }
    }

    const baseCompanies = [];
    for (let i = 0; i < COMPANY_OFFSET; i++) {
      const email = `company${i + 1}@${DOMAIN}`;
      const user = await User.findOne({ where: { email } });
      if (user) {
        const company = await Company.findOne({ where: { userId: user.id } });
        if (company) baseCompanies.push({ user, company });
      }
    }

    const baseOffers = await Offer.findAll({ order: [['id', 'ASC']] });

    // 1. Estudiantes extras
    const extraStudents = await createExtraStudents(hash);

    // 2. Empresas extras
    const extraCompanies = await createExtraCompanies(hash);

    // 3. Ofertas extras (crear + aprobar → dispara alertas)
    const extraOffers = await createAndApproveExtraOffers(extraCompanies, admin);

    // 4. Saved companies
    await createExtraSavedCompanies(extraStudents, extraCompanies, baseStudents, baseCompanies);

    // 5. Applications
    await createExtraApplications(extraStudents, extraOffers, baseOffers);

    // 6. Messages + Invitations to Apply
    await createExtraMessagesAndInvitations(extraStudents, extraCompanies, extraOffers);

    // 7. Simulations
    await createExtraSimulations(extraStudents);

    // 8. CVAnalysis
    await createExtraCVAnalyses(extraStudents, extraOffers);

    // 9. Notifications
    await createExtraNotifications(extraStudents, extraOffers);

    // 10. AlertHistory
    await createExtraAlertHistory(extraStudents, extraOffers);

    log('\n═══════════════════════════════════════');
    log('  ✅ SEED EXTRA COMPLETADO');
    log('═══════════════════════════════════════');
    log(`\n  👨‍🎓 Estudiantes extras (${extraStudents.length}):`);
    extraStudents.forEach((s, i) => {
      log(`     student${STUDENT_OFFSET + i + 1}@${DOMAIN} / ${PASSWORD} — ${s.student.career}`);
    });
    log(`\n  🏢 Empresas extras (${extraCompanies.length}):`);
    extraCompanies.forEach((c, i) => {
      log(`     company${COMPANY_OFFSET + i + 1}@${DOMAIN} / ${PASSWORD} — ${c.company.tradeName}`);
    });
    log(`\n  📋 ${extraOffers.length} ofertas extras aprobadas`);
    log(`\n  📊 CVAnalysis, InvitationToApply, ResumeVersion incluidos`);
    log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

run();
