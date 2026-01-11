const jwt = require('jsonwebtoken');
const db = require('../config/database');


const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log("🔐 TOKEN RECIBIDO:", token);

  if (!token) {
    console.warn("⛔ No se envió ningún token.");
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ TOKEN VÁLIDO:", decoded);

    const [results] = await db.query('SELECT id, email, role, active FROM users WHERE id = ?', [decoded.userId]);
    const user = results[0];


    console.log("🔎 USUARIO ENCONTRADO:", user);

    if (!user || !user.active) {
      console.warn("❌ Usuario no autorizado. Detalles:", user);
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario no autorizado' 
      });
    }

    console.log("✅ USUARIO AUTENTICADO:", user.email, "-", user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Error al verificar token:", error.message);
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.warn("⛔ Rol no autorizado:", req.user.role);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción'
      });
    }
    next();
  };
};

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.warn("⛔ Acceso denegado por rol:", req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, requireRole };
