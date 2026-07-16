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
    await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      logger.info(`PracHub API listening on port ${PORT}`);
    });
  } catch (error) {
    // Sequelize envuelve el error real de MySQL en error.original / error.parent.
    // Sin estos campos, el mensaje visible suele ser genérico ("Error") y no
    // permite diagnosticar caídas en producción. El logger de consola sólo
    // imprime `message` + `stack`, por eso incrustamos el detalle de MySQL
    // directamente en el mensaje para que sea visible en los logs de Railway.
    const mysqlMsg = (error.original && error.original.message)
      || (error.parent && error.parent.message)
      || '';
    const detail = mysqlMsg ? `${error.message} — ${mysqlMsg}` : error.message;
    logger.error(`Unable to start PracHub API: ${detail}`, {
      name: error.name,
      sql: error.sql,
      original: error.original ? error.original.message : undefined,
      parent: error.parent ? error.parent.message : undefined,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
