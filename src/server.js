require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    // Solo crear tablas nuevas que no existan (force:false, alter:false)
    const { Notification } = require('./models');
    await Notification.sync({ force: false });
    await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      console.log(`PracHub API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start PracHub API:', error.message);
    process.exit(1);
  }
};

startServer();
