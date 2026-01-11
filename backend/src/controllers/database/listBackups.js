/**
 * Cont  try {
    // Verificar que el usuario tiene permisos de administrador
    // Los roles permitidos son: admin, administrador, manager y otros que necesites
    const allowedRoles = ['admin', 'administrador', 'manager'];
    
    console.log("🔐 Usuario intentando listar respaldos:", req.user.email, "- Rol:", req.user.role);
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error(`Solo usuarios con roles ${allowedRoles.join(', ')} pueden listar respaldos`);
    }para obtener la lista de respaldos disponibles
 * @param {Object} payload - No requiere parámetros
 * @returns {Array} - Lista de archivos de respaldo
 */
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

const backupDir = path.join(__dirname, '../../../backups');

module.exports = async (payload, req) => {
  try {
    // Verificar que el usuario tiene permisos de administrador
    // Los roles permitidos son: admin, administrador, manager y cualquier otro que necesites
    const allowedRoles = ['admin', 'administrador', 'manager'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error(`Solo usuarios con roles ${allowedRoles.join(', ')} pueden ver los respaldos`);
    }

    // Crear el directorio si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return { backups: [] };
    }

    // Obtener la lista de archivos de respaldo
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(fileName => {
        const filePath = path.join(backupDir, fileName);
        const stats = fs.statSync(filePath);
        
        // Convertir el timestamp del nombre del archivo a una fecha
        let date = null;
        try {
          // Extraer la fecha del nombre del archivo: backup-2025-08-09T19-34-53-134Z.sql
          const dateMatch = fileName.match(/backup-(.+)\.sql/);
          if (dateMatch && dateMatch[1]) {
            const rawDate = dateMatch[1];
            
            // Crear manualmente una fecha a partir de las partes
            // Formato esperado: 2025-08-09T19-34-53-134Z
            const regex = /(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/;
            const match = rawDate.match(regex);
            
            if (match) {
              // Extraer todas las partes de la fecha
              const [_, year, month, day, hour, minute, second, ms] = match;
              // Construir una fecha válida
              date = new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1, // Los meses en JavaScript son 0-indexed
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second),
                parseInt(ms)
              )).toISOString();
            } else {
              // Si no coincide con el formato esperado, intentamos usar la fecha de creación del archivo
              date = stats.birthtime.toISOString();
            }
          }
        } catch (e) {
          logger.error(`Error parsing date from filename ${fileName}: ${e.message}`);
          // En caso de error, usar la fecha de creación del archivo
          date = stats.birthtime.toISOString();
        }

        return {
          fileName,
          createdAt: date || stats.birthtime.toISOString(),
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size)
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Ordenar por fecha, más reciente primero

    // Obtener información del último respaldo
    const lastBackup = backupFiles.length > 0 ? backupFiles[0] : null;
    
    return {
      backups: backupFiles,
      lastBackup
    };
  } catch (error) {
    logger.error(`Error al listar respaldos: ${error.message}`);
    throw new Error(`Error al listar respaldos: ${error.message}`);
  }
};

// Función auxiliar para formatear el tamaño del archivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
