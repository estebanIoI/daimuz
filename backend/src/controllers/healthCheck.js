const db = require('../config/database');
const connectionTracker = require('../middleware/connectionTracker');
const { getStats } = require('../services/cacheService');

module.exports = async function healthCheck(_, req) {
  try {
    // Verificar conexión a la base de datos
    const [result] = await db.query('SELECT 1 as test');
    
    // Obtener estadísticas del sistema
    const connectionStats = connectionTracker.getStats();
    const cacheStats = getStats();
    
    // Calcular tasa de aciertos de cache
    let totalHits = 0;
    let totalMisses = 0;
    Object.values(cacheStats).forEach(stat => {
      totalHits += stat.hits || 0;
      totalMisses += stat.misses || 0;
    });
    const total = totalHits + totalMisses;
    const cacheHitRate = total > 0 ? Math.round((totalHits / total) * 100) : 0;
    
    return {
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      test_query: result[0],
      performance: {
        connections: connectionStats,
        cache: {
          hitRate: cacheHitRate,
          stats: cacheStats
        },
        memory: process.memoryUsage(),
        uptime: Math.round(process.uptime())
      }
    };
  } catch (error) {
    console.error('Error en health check:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};
