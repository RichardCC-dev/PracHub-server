const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/logos'));
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp_random.ext
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB máximo
  },
});

// Middleware de manejo de errores de multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'El archivo es demasiado grande. Máximo 2MB.',
      });
    }
    return res.status(400).json({
      message: `Error al subir archivo: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError,
};
