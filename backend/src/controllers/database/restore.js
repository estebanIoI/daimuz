/**
 * Controller para restaurar la base de datos desde un respaldo
 * @param {Object} payload - Información del respaldo a restaurar
 * @param {string} payload.fileName - Nombre del archivo de respaldo (opcional, si no se proporciona, usa el más reciente)
 * @returns {Object} - Información sobre la restauración
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../../utils/logger');
const { buildMySQLCommand } = require('../../utils/mysqlPaths');
require('dotenv').config();

const backupDir = path.join(__dirname, '../../../backups');

module.exports = async (payload, req) => {
  try {
    // Verificar que el usuario tiene permisos de administrador
    // Los roles permitidos son: admin, administrador, manager y otros que necesites
    const allowedRoles = ['admin', 'administrador', 'manager'];
    
    console.log("🔐 Usuario intentando restaurar respaldo:", req.user.email, "- Rol:", req.user.role);
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error(`Solo usuarios con roles ${allowedRoles.join(', ')} pueden restaurar respaldos`);
    }

    // Determinar qué archivo de respaldo usar
    let backupFileName = payload.fileName;
    
    // Si no se especifica un archivo, usar el más reciente
    if (!backupFileName) {
      if (!fs.existsSync(backupDir)) {
        throw new Error('No existe ningún respaldo disponible');
      }
      
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort();
      
      if (backupFiles.length === 0) {
        throw new Error('No se encontraron archivos de respaldo');
      }
      
      backupFileName = backupFiles[backupFiles.length - 1];
    }
    
    // Verificar que el archivo existe
    const backupFilePath = path.join(backupDir, backupFileName);
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`El archivo de respaldo ${backupFileName} no existe`);
    }
    
    // Construir el comando para restaurar la base de datos usando la utilidad centralizada
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
    
    // Usar la utilidad para construir el comando con la ruta correcta para el sistema operativo
    const command = buildMySQLCommand('mysql', dbConfig, backupFilePath, false);
    
    logger.info(`Iniciando restauración de base de datos desde: ${backupFileName}`);
    await execPromise(command);
    
    logger.info(`Base de datos restaurada exitosamente desde: ${backupFileName}`);
    
    // Registrar la restauración en el historial
    const restoreLog = path.join(backupDir, 'restore-history.json');
    let restoreHistory = [];
    
    if (fs.existsSync(restoreLog)) {
      restoreHistory = JSON.parse(fs.readFileSync(restoreLog, 'utf8'));
    }
    
    restoreHistory.push({
      fileName: backupFileName,
      restoredAt: new Date().toISOString(),
      restoredBy: req.user.id
    });
    
    fs.writeFileSync(restoreLog, JSON.stringify(restoreHistory, null, 2));
    
    return {
      fileName: backupFileName,
      restoredAt: new Date().toISOString(),
      message: 'Base de datos restaurada exitosamente'
    };
  } catch (error) {
    logger.error(`Error al restaurar la base de datos: ${error.message}`);
    throw new Error(`Error al restaurar la base de datos: ${error.message}`);
  }
};
