const bcrypt = require('bcryptjs');
const { User } = require('../src/models');

const createAdmin = async () => {
  const email = process.argv[2] || process.env.ADMIN_SEED_EMAIL || 'admin@prachub.com';
  const password = process.argv[3] || process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    console.error('❌ Debes proporcionar una contraseña. Usos:');
    console.error('   node src/scripts/createAdmin.js <email> <password>');
    console.error('   o define ADMIN_SEED_PASSWORD en .env');
    process.exit(1);
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log('⚠️  Admin ya existe:', email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    email,
    passwordHash,
    role: 'admin',
    authProvider: 'local',
    isEmailVerified: true,
  });

  console.log('✅ Admin creado:', email);
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
