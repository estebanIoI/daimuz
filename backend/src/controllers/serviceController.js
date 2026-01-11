const services = require("../services");
const { authenticateToken } = require("../middleware/auth");

// Servicios que requieren autenticación
const SERVICES_REQUIRING_AUTH = [
  'auth.me',
  'user.getAll',
  'user.create',
  'user.update',
  'user.resetPassword',
  'user.toggleUserStatus',
  'table.getAll',
  'table.create',
  'table.getNextNumber',
  'table.delete',
  'category.getAll',
  'category.create',
  'category.delete',
  'menu.getAll',
  'menu.create',
  'menu.update',
  'menu.delete',
  'order.create',
  'order.addItem',
  'order.decreaseItem',
  'order.removeItem',
  'order.close',
  'order.getActiveWithItems',
  'order.updateTableNotes',
  'order.updateItemNotes',
  'kitchen.getAll',
  'kitchen.updateStatus',
  'cashier.getActiveOrders',
  'cashier.registerPayment',
  'cashier.getPaymentHistory',
  'cashier.getDailyStats',
  'cashier.getTableGuests',
  'cashier.getGuestItems',
  'cashier.registerGuestPayment',
  'report.dailySales',
  'report.topProducts',
  'report.tablePerformance',
  'report.paymentSummary',
  'invoice.create',
  'invoice.getAll',
  'invoice.getById',
  'settings.getAll',
  'settings.update',
  'database.backup',
  'database.restore',
  'database.listBackups',
  // QR Services (requieren autenticación)
  'qr.generate',
  'qr.getActiveByTable',
  'qr.deactivate',
  // Guest Services (algunos públicos, algunos privados)
  'guest.getByTable',
  'guest.registerManual',
  // Song Services (admin/staff)
  'song.getQueue',
  'song.getActiveQueue',
  'song.updateStatus',
  'song.getDailyStats'
];

// Servicios públicos (NO requieren autenticación)
// qr.validate, guest.register, guest.getSessionInfo, guest.updateActivity,
// song.request, song.getByTable, song.canRequest, menu.getAll (para clientes), category.getAll (para clientes)

// Función auxiliar para ejecutar middleware de autenticación
const authenticateService = (req, res) => {
  return new Promise((resolve, reject) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log("🔐 TOKEN RECIBIDO:", token);

    if (!token) {
      console.warn("⛔ No se envió ningún token.");
      return reject(new Error('Token de acceso requerido'));
    }

    const jwt = require('jsonwebtoken');
    const db = require('../config/database');

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error("❌ Error al verificar token:", err.message);
        return reject(new Error('Token inválido'));
      }

      try {
        const [results] = await db.query('SELECT id, name, email, role, active FROM users WHERE id = ?', [decoded.userId]);
        const user = results[0];

        console.log("🔎 USUARIO ENCONTRADO:", user);

        if (!user || !user.active) {
          console.warn("❌ Usuario no autorizado. Detalles:", user);
          return reject(new Error('Usuario no autorizado'));
        }

        console.log("✅ USUARIO AUTENTICADO:", user.email, "-", user.role);
        req.user = user;
        resolve();
      } catch (dbError) {
        console.error("❌ Error en base de datos:", dbError);
        reject(new Error('Error interno del servidor'));
      }
    });
  });
};

exports.handleRequest = async (req, res) => {
  console.log("📦 Controlador ServiceController activo");
  const { service, payload = {} } = req.body;

  if (!service || typeof service !== "string") {
    console.warn("⚠️ Servicio inválido:", service);
    return res.status(400).json({ error: 'El campo "service" es obligatorio y debe ser una cadena.' });
  }

  const handler = services[service];
  if (!handler) {
    console.warn("❌ Servicio no encontrado:", service);
    return res.status(404).json({ error: `Servicio "${service}" no encontrado.` });
  }

  // Aplicar autenticación si el servicio la requiere
  if (SERVICES_REQUIRING_AUTH.includes(service)) {
    console.log("🔐 Aplicando autenticación para servicio:", service);
    
    try {
      await authenticateService(req, res);
    } catch (error) {
      console.error("❌ Error de autenticación:", error.message);
      return res.status(401).json({ success: false, error: error.message });
    }
  }

  try {
    console.log("✅ Ejecutando servicio:", service);
    const result = await handler(payload, req);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`🔥 Error en servicio ${service}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
