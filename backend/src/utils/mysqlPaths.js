/**
 * Utility para manejar las rutas de los comandos MySQL en diferentes sistemas operativos
 */
const path = require('path');
const fs = require('fs');

// Rutas comunes de MySQL en diferentes sistemas operativos
const mysqlBinPaths = {
  win32: [
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin',
    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin',
    'C:\\xampp\\mysql\\bin',
    'C:\\wamp64\\bin\\mysql\\mysql8.0.21\\bin',
    'C:\\wamp\\bin\\mysql\\mysql8.0.21\\bin',
    'C:\\wamp64\\bin\\mysql\\mysql5.7.31\\bin',
    'C:\\wamp\\bin\\mysql\\mysql5.7.31\\bin',
    'C:\\laragon\\bin\\mysql\\bin'
  ],
  linux: [
    '/usr/bin',
    '/usr/local/bin',
    '/usr/local/mysql/bin',
    '/opt/mysql/bin'
  ],
  darwin: [  // macOS
    '/usr/bin',
    '/usr/local/bin',
    '/usr/local/mysql/bin',
    '/opt/homebrew/bin'
  ]
};

/**
 * Detecta la ruta del comando MySQL en el sistema
 * @param {string} command - El comando a buscar ('mysql' o 'mysqldump')
 * @returns {string} - La ruta completa al comando o solo el nombre del comando si no se encuentra
 */
function getMySQLCommandPath(command) {
  // Si se ha definido una variable de entorno específica para el comando, usarla
  const envPath = command === 'mysql' ? process.env.MYSQL_PATH : process.env.MYSQL_DUMP_PATH;
  if (envPath) {
    return envPath;
  }
  
  // Obtener las rutas potenciales según el sistema operativo
  const platform = process.platform;
  const possiblePaths = mysqlBinPaths[platform] || [];
  const commandExt = platform === 'win32' ? '.exe' : '';
  
  // Verificar si el comando existe en alguna de las rutas
  for (const basePath of possiblePaths) {
    const fullPath = path.join(basePath, `${command}${commandExt}`);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // Si no se encontró, devolver solo el nombre del comando
  return command;
}

/**
 * Construye el comando SQL completo con la ruta adecuada según el sistema operativo
 * @param {string} commandType - Tipo de comando ('mysql' o 'mysqldump')
 * @param {Object} dbConfig - Configuración de la base de datos
 * @param {string} filePath - Ruta al archivo a usar
 * @param {boolean} isBackup - True si es un comando de backup, false si es restore
 * @returns {string} - El comando completo listo para ejecutar
 */
function buildMySQLCommand(commandType, dbConfig, filePath, isBackup = true) {
  const commandPath = getMySQLCommandPath(commandType);
  
  // Construir los parámetros básicos
  const baseParams = `--host=${dbConfig.host} --port=${dbConfig.port || 3306} --user=${dbConfig.user} --password=${dbConfig.password} ${dbConfig.database}`;
  
  // Construir el comando completo según sea backup o restore
  if (isBackup) {
    return `"${commandPath}" ${baseParams} > "${filePath}"`;
  } else {
    return `"${commandPath}" ${baseParams} < "${filePath}"`;
  }
}

module.exports = {
  getMySQLCommandPath,
  buildMySQLCommand
};
