require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const rateLimiter = require('./middleware/rateLimiter');
const connectionTracker = require('./middleware/connectionTracker');
const serviceRouter = require('./routes/service');
const uploadRouter = require('./routes/upload');

const app = express();

// CORS configurado para producción
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization']
}));

// Servir imágenes estáticas de productos (antes de otros middlewares)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet configurado para permitir imágenes
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Rate Limiting - solo usar uno
app.use(rateLimiter);

// Monitoreo de conexiones y rendimiento
app.use(connectionTracker.trackConnection);

// Logger para todas las peticiones
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - headers: ${JSON.stringify(req.headers)}`);
  if (req.method === 'OPTIONS') {
    logger.info('Recibida petición OPTIONS (preflight)');
  }
  next();
});

// Rutas principales 
console.log("📦 Registrando ruta /api/service");
app.use('/api/service', serviceRouter);

// Ruta para subida de archivos
console.log("📦 Registrando ruta /api/upload");
app.use('/api/upload', uploadRouter);

// Error handler
app.use(errorHandler);

module.exports = app;
