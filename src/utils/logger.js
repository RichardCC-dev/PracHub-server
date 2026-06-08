const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../logs');

const { combine, timestamp, printf, colorize, errors } = format;

// Formato legible para la consola en desarrollo
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack ? `[${timestamp}] ${level}: ${message}\n${stack}` : `[${timestamp}] ${level}: ${message}`
  )
);

// Formato JSON estructurado para archivos
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Consola (sólo en desarrollo)
    ...(process.env.NODE_ENV !== 'production'
      ? [new transports.Console({ format: devFormat })]
      : []),

    // Archivo rotatorio: todos los niveles info+
    new transports.DailyRotateFile({
      filename: path.join(LOGS_DIR, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),

    // Archivo rotatorio: sólo errores
    new transports.DailyRotateFile({
      filename: path.join(LOGS_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});

module.exports = logger;
