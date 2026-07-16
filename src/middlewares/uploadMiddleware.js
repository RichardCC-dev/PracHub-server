const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

const isCloudinaryUpload = process.env.UPLOAD_PROVIDER === 'cloudinary';
const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

// El almacenamiento local también es válido en producción (p. ej. despliegues
// sin almacenamiento en la nube). En contenedores efímeros como Railway los
// archivos subidos NO persisten entre redeployes: usar solo para demos o hasta
// integrar un proveedor persistente (Cloudinary, S3, volumen, etc.).
if (process.env.NODE_ENV === 'production' && !isCloudinaryUpload) {
  console.warn('[uploads] UPLOAD_PROVIDER=local en producción: el filesystem del contenedor no es persistente entre redeployes.');
}

if (isCloudinaryUpload && !hasCloudinaryCredentials) {
  throw new Error('Faltan credenciales de Cloudinary para subir logos.');
}

if (isCloudinaryUpload) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configuración de almacenamiento
const uploadDirectory = path.join(__dirname, '../../public/uploads/logos');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = isCloudinaryUpload
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirectory);
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

const uploadToCloudinary = (req, res, next) => {
  if (!isCloudinaryUpload || !req.file) return next();

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'prachub/logos', resource_type: 'image' },
    (error, result) => {
      if (error) return next(error);
      req.file.location = result.secure_url;
      req.file.filename = result.public_id;
      return next();
    }
  );

  stream.end(req.file.buffer);
};

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
  uploadToCloudinary,
  handleUploadError,
};
