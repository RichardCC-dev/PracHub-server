const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Token de acceso requerido.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de administrador.' });
  }
  return next();
};

module.exports = requireAdmin;
