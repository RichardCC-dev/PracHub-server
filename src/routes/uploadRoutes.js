const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { upload, handleUploadError } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// POST /api/upload/logo - Subir logo de empresa
// Solo empresas verificadas pueden subir logos
router.post(
  '/logo',
  authenticate,
  authorize('company'),
  upload.single('logo'),
  handleUploadError,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: 'No se proporcionó ningún archivo.',
      });
    }

    // Construir URL pública del archivo (apuntando al backend, no al frontend)
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const fileUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

    res.status(200).json({
      message: 'Logo subido correctamente.',
      logoUrl: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  }
);

module.exports = router;
