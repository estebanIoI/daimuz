// Middleware para monitorear conexiones activas y rendimiento
let activeConnections = 0;
let requestCount = 0;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONCURRENT_USERS) || 20;

// Resetear contador de requests cada minuto
setInterval(() => {
  console.log(`📊 Requests último minuto: ${requestCount}, Conexiones activas: ${activeConnections}`);
  requestCount = 0;
}, 60000);

const connectionTracker = {
  // Middleware para rastrear conexiones
  trackConnection: (req, res, next) => {
    activeConnections++;
    requestCount++;
    
    // Log de advertencia si hay muchas conexiones
    if (activeConnections > MAX_CONNECTIONS) {
      console.warn(`⚠️ Alto número de conexiones activas: ${activeConnections}/${MAX_CONNECTIONS}`);
    }
    
    // Cleanup al terminar la respuesta
    res.on('finish', () => {
      activeConnections--;
    });
    
    // Cleanup en caso de error
    res.on('close', () => {
      if (activeConnections > 0) {
        activeConnections--;
      }
    });
    
    next();
  },

  // Obtener estadísticas actuales
  getStats: () => ({
    activeConnections,
    requestCount,
    maxConnections: MAX_CONNECTIONS,
    timestamp: new Date().toISOString()
  }),

  // Verificar si el servidor está bajo carga alta
  isHighLoad: () => activeConnections > (MAX_CONNECTIONS * 0.8),

  // Middleware de throttling dinámico bajo alta carga
  dynamicThrottle: (req, res, next) => {
    if (connectionTracker.isHighLoad()) {
      // Bajo alta carga, añadir pequeño delay para requests no críticos
      const criticalRoutes = ['/api/service'];
      const isCritical = criticalRoutes.some(route => req.originalUrl.startsWith(route));
      
      if (!isCritical) {
        setTimeout(next, 100); // 100ms delay para requests no críticos
        return;
      }
    }
    next();
  }
};

module.exports = connectionTracker;
