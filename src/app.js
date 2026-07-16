
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const offerRoutes = require('./routes/offerRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cvAnalysisRoutes = require('./routes/cvAnalysisRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const alertRoutes = require('./routes/alertRoutes');
const savedCompanyRoutes = require('./routes/savedCompanyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const companyMetricsRoutes = require('./routes/companyMetrics');
const invitationRoutes = require('./routes/invitationRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { globalApiLimiter } = require('./middlewares/rateLimit');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');

const app = express();

const isProd = process.env.NODE_ENV === 'production';

// ── Seguridad: Helmet con CSP y HSTS ─────────────────────────────────────────
app.use(helmet({
  // Permitir acceso cross-origin a archivos estáticos (logos)
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // HSTS: forzar HTTPS durante 1 año en producción (incluye subdominios)
  hsts: isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // CSP: política permisiva para Swagger UI; ajustar según necesidad
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",  // necesario para Swagger UI
        'cdn.jsdelivr.net',
        'unpkg.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",  // necesario para Swagger UI
        'cdn.jsdelivr.net',
        'fonts.googleapis.com',
      ],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'fonts.gstatic.com', 'cdn.jsdelivr.net'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },

  // Referrer Policy: no filtrar información de origen en peticiones cross-origin
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // X-Frame-Options: prevenir clickjacking
  frameguard: { action: 'deny' },

  // X-Content-Type-Options: prevenir MIME sniffing
  noSniff: true,

  // X-Download-Options (IE): prevenir ejecución de descargas en IE
  ieNoOpen: true,
}));

// Orígenes permitidos para CORS.
// CLIENT_URL puede ser una URL única o una lista separada por comas, ej:
//   CLIENT_URL=http://localhost:5173,https://prachub-client.vercel.app
// Si no se define, se permiten los orígenes de desarrollo habituales.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Limiter global: 100 req / 15 min por IP
app.use('/api', globalApiLimiter);

// Servir archivos estáticos (logos subidos) con CORS headers explícitos
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'prachub-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cv-analysis', cvAnalysisRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/saved-companies', savedCompanyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/company-metrics', companyMetricsRoutes);
app.use('/api/invitations', invitationRoutes);

// Configuración de Swagger
if (!isProd || process.env.ENABLE_SWAGGER === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));
}

app.use(errorHandler);

module.exports = app;
