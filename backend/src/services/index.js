// src/services/index.js
// Registro central de servicios para API Gateway en Sirius

module.exports = {
  // --- Health Check ---
  "health.check": require("../controllers/healthCheck"),

  // --- Autenticación y Sesión ---
  "auth.login": require("../controllers/auth/login"),
  "auth.me": require("../controllers/auth/me"),
  "auth.forgotPassword": require("../controllers/auth/forgotPassword"),
  "auth.resetPassword": require("../controllers/auth/resetPassword"),

  // --- QR Codes (Sistema Bar) ---
  "qr.generate": require("../controllers/qr/generate"),
  "qr.validate": require("../controllers/qr/validate"),
  "qr.getActiveByTable": require("../controllers/qr/getActiveByTable"),
  "qr.deactivate": require("../controllers/qr/deactivate"),

  // --- Invitados/Clientes (Sistema Bar) ---
  "guest.register": require("../controllers/guest/register"),
  "guest.registerManual": require("../controllers/guest/registerManual"),
  "guest.getSessionInfo": require("../controllers/guest/getSessionInfo"),
  "guest.getByTable": require("../controllers/guest/getByTable"),
  "guest.getMyItems": require("../controllers/guest/getMyItems"),
  "guest.updateActivity": require("../controllers/guest/updateActivity"),

  // --- Canciones (Sistema Bar) ---
  "song.request": require("../controllers/song/request"),
  "song.getQueue": require("../controllers/song/getQueue"),
  "song.getActiveQueue": require("../controllers/song/getActiveQueue"),
  "song.getByTable": require("../controllers/song/getByTable"),
  "song.updateStatus": require("../controllers/song/updateStatus"),
  "song.canRequest": require("../controllers/song/canRequest"),
  "song.getDailyStats": require("../controllers/song/getDailyStats"),

  // --- Usuarios ---
  "user.getAll": require("../controllers/users/getAll"),
  "user.create": require("../controllers/users/create"),
  "user.update": require("../controllers/users/update"),
  "user.resetPassword": require("../controllers/users/resetPassword"),
  "user.toggleUserStatus": require("../controllers/users/toggleUserStatus"),

  // --- Mesas ---
  "table.getAll": require("../controllers/tables/getAll"),
  "table.create": require("../controllers/tables/create"),
  "table.getNextNumber": require("../controllers/tables/getNextNumber"),
  "table.delete": require("../controllers/tables/delete"),

  // --- Categorías ---
  "category.getAll": require("../controllers/categories/getAll"),
  "category.getPublic": require("../controllers/categories/getPublic"),
  "category.create": require("../controllers/categories/create"),
  "category.delete": require("../controllers/categories/delete"),

  // --- Menú / Productos ---
  "menu.getAll": require("../controllers/menu/getAll"),
  "menu.getPublic": require("../controllers/menu/getPublic"),
  "menu.create": require("../controllers/menu/create"),
  "menu.update": require("../controllers/menu/update"),
  "menu.delete": require("../controllers/menu/delete"),

  // --- Pedidos ---
  "order.create": require("../controllers/orders/create"),
  "order.createGuest": require("../controllers/orders/createGuest"),
  "order.addItem": require("../controllers/orders/addItem"),
  "order.addItemGuest": require("../controllers/orders/addItemGuest"),
  "order.decreaseItem": require("../controllers/orders/decreaseItem"),
  "order.removeItem": require("../controllers/orders/removeItem"),
  "order.close": require("../controllers/orders/close"),
  "order.getActiveWithItems": require("../controllers/orders/getActiveWithItems"),
  "order.updateTableNotes": require("../controllers/orders/updateTableNotes"),
  "order.updateItemNotes": require("../controllers/orders/updateItemNotes"),
  "order.getTableTotal": require("../controllers/orders/getTableTotal"),

  // --- Cocina ---
  "kitchen.getAll": require("../controllers/kitchen/getAll"),
  "kitchen.updateStatus": require("../controllers/kitchen/updateStatus"),

  // --- Cajero ---
  "cashier.getActiveOrders": require("../controllers/cashier/getActiveOrders"),
  "cashier.registerPayment": require("../controllers/cashier/registerPayment"),
  "cashier.getPaymentHistory": require("../controllers/cashier/getPaymentHistory"),
  "cashier.getDailyStats": require("../controllers/cashier/getDailyStats"),
  "cashier.getTableGuests": require("../controllers/cashier/getTableGuests"),
  "cashier.getGuestItems": require("../controllers/cashier/getGuestItems"),
  "cashier.registerGuestPayment": require("../controllers/cashier/registerGuestPayment"),

  // --- Reportes ---
  "report.dailySales": require("../controllers/reports/dailySales"),
  "report.topProducts": require("../controllers/reports/topProducts"),
  "report.tablePerformance": require("../controllers/reports/tablePerformance"),
  "report.paymentSummary": require("../controllers/reports/paymentSummary"),
  "report.waiterPerformance": require("../controllers/reports/waiterPerformance"),

  // --- Facturas ---
  "invoice.create": require("../controllers/invoices/create"),
  "invoice.getAll": require("../controllers/invoices/getAll"),
  "invoice.getById": require("../controllers/invoices/getById"),

  // --- Configuración ---
  "settings.getAll": require("../controllers/settings/getAll"),
  "settings.update": require("../controllers/settings/update"),

  // --- Base de datos ---
  "database.backup": require("../controllers/database/backup"),
  "database.restore": require("../controllers/database/restore"),
  "database.listBackups": require("../controllers/database/listBackups")
};
