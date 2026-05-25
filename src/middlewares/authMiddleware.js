const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acceso requerido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'replace-this-secret');
    return next();
  } catch (error) {
    req.authError = error.message;
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = authenticate;
