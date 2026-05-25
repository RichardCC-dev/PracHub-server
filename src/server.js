require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });

    app.listen(PORT, () => {
      console.log(`PracHub API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start PracHub API:', error.message);
    process.exit(1);
  }
};

startServer();
