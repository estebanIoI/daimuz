// src/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Configurar almacenamiento de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar colisiones
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// Filtrar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP).'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Máximo 5MB
  }
});

// Middleware de autenticación para uploads
const authenticateUpload = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
      }

      try {
        const [results] = await db.query('SELECT id, name, email, role, active FROM users WHERE id = ?', [decoded.userId]);
        const user = results[0];

        if (!user || !user.active) {
          return res.status(401).json({ success: false, error: 'Usuario no autorizado' });
        }

        req.user = user;
        next();
      } catch (dbError) {
        console.error('Error en base de datos:', dbError);
        return res.status(500).json({ success: false, error: 'Error interno del servidor' });
      }
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({ success: false, error: 'Error de autenticación' });
  }
};

// Ruta para subir imagen de producto
router.post('/product-image', authenticateUpload, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen' });
    }

    const originalPath = req.file.path;
    const filename = req.file.filename;
    const optimizedFilename = `optimized-${filename.replace(path.extname(filename), '.webp')}`;
    const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);

    // Optimizar imagen con sharp (redimensionar y convertir a webp)
    await sharp(originalPath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(optimizedPath);

    // Eliminar archivo original después de optimizar
    fs.unlinkSync(originalPath);

    // Construir URL de la imagen
    const imageUrl = `/uploads/products/${optimizedFilename}`;

    console.log('✅ Imagen subida y optimizada:', imageUrl);

    res.json({
      success: true,
      data: {
        filename: optimizedFilename,
        url: imageUrl,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    
    // Limpiar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, error: 'Error al procesar la imagen' });
  }
});

// Ruta para eliminar imagen de producto
router.delete('/product-image/:filename', authenticateUpload, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/products', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Imagen eliminada:', filename);
      res.json({ success: true, message: 'Imagen eliminada correctamente' });
    } else {
      res.status(404).json({ success: false, error: 'Imagen no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error al eliminar imagen:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la imagen' });
  }
});

module.exports = router;
