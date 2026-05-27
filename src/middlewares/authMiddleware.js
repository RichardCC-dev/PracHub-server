const jwt = require('jsonwebtoken');
const { User, Student, Company } = require('../models');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acceso requerido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace-this-secret');

    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Student, as: 'studentProfile' },
        { model: Company, as: 'companyProfile' },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'Token inválido o expirado.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    req.authError = error.message;
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authenticate;
