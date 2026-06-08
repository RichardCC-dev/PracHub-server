require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

// Captura errores síncronos no controlados antes de que maten el proceso
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException – cerrando proceso', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Captura promesas rechazadas sin .catch()
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection – cerrando proceso', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    // Solo crear tablas nuevas que no existan (force:false, alter:false)
    const { Notification } = require('./models');
    await Notification.sync({ force: false });
    await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      logger.info(`PracHub API listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start PracHub API', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
