/**
 * Controller para crear un respaldo de la base de datos
 * @param {Object} payload - No requiere parámetros
 * @returns {Object} - Información sobre el respaldo creado
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('../../utils/logger');
const { buildMySQLCommand } = require('../../utils/mysqlPaths');
require('dotenv').config();

// Aseguramos que exista el directorio de respaldos
const backupDir = path.join(__dirname, '../../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

module.exports = async (payload, req) => {
  try {
    // Verificar que el usuario tiene permisos de administrador
    // Los roles permitidos son: admin, administrador, manager y otros que necesites
    const allowedRoles = ['admin', 'administrador', 'manager'];
    
    console.log("🔐 Usuario intentando crear respaldo:", req.user.email, "- Rol:", req.user.role);
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error(`Solo usuarios con roles ${allowedRoles.join(', ')} pueden crear respaldos`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Construir el comando mysqldump con la utilidad centralizada
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
    
    // Usar la utilidad para construir el comando con la ruta correcta para el sistema operativo
    const command = buildMySQLCommand('mysqldump', dbConfig, backupFilePath, true);
    
    logger.info(`Iniciando respaldo de base de datos: ${backupFileName}`);
    await execPromise(command);
    
    // Verificar que el archivo de respaldo se creó correctamente
    const fileStats = fs.statSync(backupFilePath);
    
    if (fileStats.size === 0) {
      fs.unlinkSync(backupFilePath);
      throw new Error('Error al crear respaldo: archivo vacío');
    }

    // Registrar el historial de respaldos (podrías guardar esto en la base de datos)
    const backupList = path.join(backupDir, 'backup-history.json');
    let backupHistory = [];
    
    if (fs.existsSync(backupList)) {
      backupHistory = JSON.parse(fs.readFileSync(backupList, 'utf8'));
    }
    
    backupHistory.push({
      fileName: backupFileName,
      createdAt: new Date().toISOString(),
      size: fileStats.size,
      createdBy: req.user.id
    });
    
    fs.writeFileSync(backupList, JSON.stringify(backupHistory, null, 2));
    
    logger.info(`Respaldo de base de datos creado exitosamente: ${backupFileName}`);
    
    return {
      fileName: backupFileName,
      createdAt: new Date().toISOString(),
      size: fileStats.size,
      message: 'Respaldo creado exitosamente'
    };
  } catch (error) {
    logger.error(`Error al crear respaldo: ${error.message}`);
    throw new Error(`Error al crear respaldo: ${error.message}`);
  }
};
