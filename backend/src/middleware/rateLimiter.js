const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX) || 3000, // Aumentado a 3000 para múltiples usuarios con autorefresco
  message: 'Too many requests, please try again later.', // Mensaje simple que el frontend pueda manejar
  standardHeaders: true, // Enviar info de rate limit en headers
  legacyHeaders: false,
  // Configuración más detallada para mejor debugging
  handler: (req, res) => {
    console.warn(`🚫 Rate limit excedido para IP: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(429).send('Too many requests, please try again later.');
  },
  // Skip para rutas críticas de autorefresco y salud
  skip: (req) => {
    // No limitar opciones preflight
    if (req.method === 'OPTIONS') return true;
    
    // Skip para rutas de datos en tiempo real frecuentes
    const skipRoutes = ['/api/service'];
    const isServiceRoute = skipRoutes.some(route => req.originalUrl.startsWith(route));
    
    if (isServiceRoute && req.body?.service) {
      const frequentServices = [
        'health.check', 
        'kitchen.getAll', 
        'order.getActiveWithItems',
        'table.getAll',
        'cashier.getActiveOrders'
      ];
      return frequentServices.includes(req.body.service);
    }
    
    return false;
  }
});

module.exports = limiter;
