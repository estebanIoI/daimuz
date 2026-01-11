-- ========================================
-- BASE DE DATOS MYSQL - SISTEMA SIRIUS
-- Sistema de Gestión de Restaurante
-- ========================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sirius_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sirius_db;

-- ========================================
-- TABLA: users (Usuarios del sistema)
-- ========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('administrador', 'mesero', 'cajero', 'cocinero') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (active)
);

-- ========================================
-- TABLA: categories (Categorías del menú)
-- ========================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_categories_active (active)
);

-- ========================================
-- TABLA: menu_items (Productos del menú)
-- ========================================
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INT,
    image_url VARCHAR(255),
    available BOOLEAN DEFAULT TRUE,
    preparation_time INT DEFAULT 15 COMMENT 'Tiempo en minutos',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_menu_items_category (category_id),
    INDEX idx_menu_items_available (available),
    INDEX idx_menu_items_price (price)
);

-- ========================================
-- TABLA: tables (Mesas del restaurante)
-- ========================================
CREATE TABLE tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    capacity INT DEFAULT 4,
    status ENUM('libre', 'ocupada', 'reservada', 'mantenimiento') DEFAULT 'libre',
    current_waiter_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (current_waiter_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tables_status (status),
    INDEX idx_tables_waiter (current_waiter_id),
    INDEX idx_tables_number (number)
);

-- ========================================
-- TABLA: orders (Pedidos principales)
-- ========================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT,
    waiter_id INT,
    status ENUM('activo', 'cerrado', 'cancelado') DEFAULT 'activo',
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_table_id (table_id),
    INDEX idx_orders_waiter_id (waiter_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created_at (created_at)
);

-- ========================================
-- TABLA: order_items (Items de cada pedido)
-- ========================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    status ENUM('pendiente', 'preparacion', 'listo', 'entregado') DEFAULT 'pendiente',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL,
    INDEX idx_order_items_order_id (order_id),
    INDEX idx_order_items_status (status),
    INDEX idx_order_items_menu_item (menu_item_id)
);

-- ========================================
-- TABLA: payments (Pagos)
-- ========================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    cashier_id INT,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('efectivo', 'tarjeta', 'nequi', 'transferencia') NOT NULL,
    status ENUM('pendiente', 'completado', 'fallido', 'reembolsado') DEFAULT 'completado',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payments_order_id (order_id),
    INDEX idx_payments_method (method),
    INDEX idx_payments_status (status),
    INDEX idx_payments_created_at (created_at)
);

-- ========================================
-- TABLA: settings (Configuración del sistema)
-- ========================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_settings_key (setting_key)
);

-- ========================================
-- TABLA: audit_logs (Auditoría de acciones)
-- ========================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_table_name (table_name)
);

-- ========================================
-- TABLA: invoices (Facturas)
-- ========================================
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    table_number INT NOT NULL,
    waiter_id INT,
    waiter_name VARCHAR(255),
    cashier_id INT,
    cashier_name VARCHAR(255),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    payment_method ENUM('efectivo', 'tarjeta', 'nequi', 'transferencia') NOT NULL,
    transaction_id VARCHAR(100),
    items JSON NOT NULL, -- Información completa de los productos
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoices_order_id (order_id),
    INDEX idx_invoices_created_at (created_at),
    INDEX idx_invoices_invoice_number (invoice_number),
    INDEX idx_invoices_waiter_id (waiter_id),
    INDEX idx_invoices_cashier_id (cashier_id)
);

-- ========================================
-- DATOS INICIALES
-- ========================================

-- Insertar configuraciones iniciales
INSERT INTO settings (setting_key, setting_value, description) VALUES
('restaurant_name', 'Sirius Cocina Ancestral', 'Nombre del restaurante'),
('tax_rate', '0.19', 'Tasa de impuesto (19%)'),
('currency', 'COP', 'Moneda del restaurante'),
('timezone', 'America/Bogota', 'Zona horaria'),
('max_tables', '20', 'Número máximo de mesas'),
('default_preparation_time', '15', 'Tiempo de preparación por defecto (minutos)'),
('service_charge', '0.10', 'Propina de servicio (10%)'),
('restaurant_phone', '+57 123 456 7890', 'Teléfono del restaurante'),
('restaurant_address', 'Calle Principal #123, Mocoa, Putumayo', 'Dirección del restaurante');

-- Insertar usuarios iniciales
INSERT INTO users (name, email, password_hash, role) VALUES
('Administrador Sistema', 'admin@sirius.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador'),
('María García', 'maria@sirius.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mesero'),
('Carlos Rodríguez', 'carlos@sirius.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cajero'),
('Ana Martínez', 'ana@sirius.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cocinero'),
('Luis Pérez', 'luis@sirius.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mesero');

-- Insertar categorías del menú
INSERT INTO categories (name, description) VALUES
('Entradas', 'Aperitivos y entradas tradicionales'),
('Platos Principales', 'Platos fuertes de la casa'),
('Postres', 'Dulces y postres artesanales'),
('Bebidas', 'Bebidas frías y calientes'),
('Sopas', 'Sopas y caldos tradicionales'),
('Acompañamientos', 'Guarniciones y acompañamientos'),
('Especiales', 'Platos especiales de temporada'),
('Infantil', 'Platos para niños');

-- Insertar productos del menú
INSERT INTO menu_items (name, description, price, category_id, preparation_time, available) VALUES
-- Entradas
('Arepa de Chócolo', 'Arepa dulce de maíz tierno con queso campesino', 8500, 1, 10, TRUE),
('Patacones', 'Plátano verde frito con hogao y queso', 12000, 1, 8, TRUE),
('Empanadas de Pollo', 'Empanadas criollas rellenas de pollo desmechado', 3500, 1, 12, TRUE),
('Chicharrón', 'Chicharrón de cerdo crocante con arepa', 15000, 1, 15, TRUE),

-- Platos Principales
('Mamona a la Llanera', 'Carne de res asada al carbón con yuca y plátano', 35000, 2, 45, TRUE),
('Pescado a la Plancha', 'Pescado de río con arroz de coco y patacones', 28000, 2, 25, TRUE),
('Pollo Campesino', 'Pollo guisado con papa criolla y yuca', 22000, 2, 30, TRUE),
('Tamal Tolimense', 'Tamal tradicional con pollo, cerdo y huevo', 18000, 2, 20, TRUE),
('Bandeja Paisa', 'Plato típico con frijoles, arroz, carne, chorizo', 32000, 2, 35, TRUE),

-- Sopas
('Sancocho de Gallina', 'Sancocho tradicional con gallina criolla', 25000, 5, 40, TRUE),
('Sopa de Tortilla', 'Sopa caliente con tortilla de maíz', 15000, 5, 20, TRUE),
('Changua', 'Sopa de leche con huevo y cilantro', 12000, 5, 15, TRUE),

-- Bebidas
('Jugo de Lulo', 'Jugo natural de lulo amazónico', 8000, 4, 5, TRUE),
('Chicha de Maíz', 'Bebida tradicional fermentada', 6000, 4, 3, TRUE),
('Café de Olla', 'Café tradicional con panela', 4000, 4, 8, TRUE),
('Agua de Panela', 'Bebida caliente con limón', 3000, 4, 5, TRUE),

-- Postres
('Bocadillo con Queso', 'Dulce de guayaba con queso campesino', 8000, 3, 5, TRUE),
('Tres Leches', 'Torta tres leches casera', 12000, 3, 10, TRUE),
('Cocadas', 'Dulce de coco con panela', 5000, 3, 8, TRUE),

-- Acompañamientos
('Arroz Blanco', 'Arroz blanco tradicional', 4000, 6, 15, TRUE),
('Frijoles Rojos', 'Frijoles rojos guisados', 6000, 6, 25, TRUE),
('Yuca Cocida', 'Yuca cocida con sal', 5000, 6, 20, TRUE),
('Plátano Maduro', 'Plátano maduro frito', 4500, 6, 10, TRUE);

-- Insertar mesas del restaurante
INSERT INTO tables (number, capacity, status) VALUES
(1, 4, 'libre'),
(2, 4, 'libre'),
(3, 2, 'libre'),
(4, 6, 'libre'),
(5, 4, 'libre'),
(6, 4, 'libre'),
(7, 2, 'libre'),
(8, 8, 'libre'),
(9, 4, 'libre'),
(10, 4, 'libre'),
(11, 2, 'libre'),
(12, 6, 'libre'),
(13, 4, 'libre'),
(14, 4, 'libre'),
(15, 2, 'libre');

-- ========================================
-- TRIGGERS Y FUNCIONES
-- ========================================

-- Trigger para actualizar totales en orders cuando se modifican order_items
-- NOTA: Los precios de los productos YA incluyen IVA, no se aplica impuesto adicional
DELIMITER //

CREATE TRIGGER update_order_totals_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = 0,  -- IVA ya incluido en el precio
        total = (
            SELECT COALESCE(SUM(subtotal), 0)  -- Sin multiplicar por 1.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END//

CREATE TRIGGER update_order_totals_after_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = 0,  -- IVA ya incluido en el precio
        total = (
            SELECT COALESCE(SUM(subtotal), 0)  -- Sin multiplicar por 1.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END//

CREATE TRIGGER update_order_totals_after_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        tax_amount = 0,  -- IVA ya incluido en el precio
        total = (
            SELECT COALESCE(SUM(subtotal), 0)  -- Sin multiplicar por 1.19
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.order_id;
END//

DELIMITER ;

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista para pedidos activos con detalles
CREATE VIEW active_orders_view AS
SELECT 
    o.id as order_id,
    o.created_at as order_time,
    t.number as table_number,
    t.capacity as table_capacity,
    u.name as waiter_name,
    o.status as order_status,
    o.subtotal,
    o.tax_amount,
    o.total,
    o.notes as order_notes,
    COUNT(oi.id) as total_items,
    SUM(CASE WHEN oi.status = 'pendiente' THEN oi.quantity ELSE 0 END) as pending_items,
    SUM(CASE WHEN oi.status = 'preparacion' THEN oi.quantity ELSE 0 END) as cooking_items,
    SUM(CASE WHEN oi.status = 'listo' THEN oi.quantity ELSE 0 END) as ready_items
FROM orders o
JOIN tables t ON o.table_id = t.id
LEFT JOIN users u ON o.waiter_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'activo'
GROUP BY o.id, o.created_at, t.number, t.capacity, u.name, o.status, o.subtotal, o.tax_amount, o.total, o.notes;

-- Vista para items de cocina
CREATE VIEW kitchen_items_view AS
SELECT 
    oi.id as item_id,
    oi.order_id,
    o.created_at as order_time,
    t.number as table_number,
    mi.name as item_name,
    mi.description as item_description,
    oi.quantity,
    oi.status as item_status,
    oi.notes as item_notes,
    mi.preparation_time,
    u.name as waiter_name,
    TIMESTAMPDIFF(MINUTE, oi.created_at, NOW()) as minutes_since_ordered
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN users u ON o.waiter_id = u.id
WHERE o.status = 'activo' AND oi.status IN ('pendiente', 'preparacion', 'listo')
ORDER BY oi.created_at ASC;

-- Vista para reporte de ventas diarias
CREATE VIEW daily_sales_view AS
SELECT 
    DATE(p.created_at) as sale_date,
    COUNT(DISTINCT p.order_id) as total_orders,
    SUM(p.amount) as total_sales,
    AVG(p.amount) as average_ticket,
    SUM(CASE WHEN p.method = 'efectivo' THEN p.amount ELSE 0 END) as cash_sales,
    SUM(CASE WHEN p.method = 'tarjeta' THEN p.amount ELSE 0 END) as card_sales,
    SUM(CASE WHEN p.method = 'nequi' THEN p.amount ELSE 0 END) as nequi_sales,
    SUM(CASE WHEN p.method = 'transferencia' THEN p.amount ELSE 0 END) as transfer_sales
FROM payments p
WHERE p.status = 'completado'
GROUP BY DATE(p.created_at)
ORDER BY sale_date DESC;

-- ========================================
-- PROCEDIMIENTOS ALMACENADOS
-- ========================================

DELIMITER //

-- Procedimiento para crear un nuevo pedido
CREATE PROCEDURE CreateNewOrder(
    IN p_table_id INT,
    IN p_waiter_id INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Actualizar estado de la mesa
    UPDATE tables SET status = 'ocupada', current_waiter_id = p_waiter_id WHERE id = p_table_id;
    
    -- Crear el pedido
    INSERT INTO orders (table_id, waiter_id, notes) VALUES (p_table_id, p_waiter_id, p_notes);
    
    COMMIT;
    
    SELECT LAST_INSERT_ID() as order_id;
END//

-- Procedimiento para cerrar un pedido
CREATE PROCEDURE CloseOrder(
    IN p_order_id INT
)
BEGIN
    DECLARE v_table_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener el table_id
    SELECT table_id INTO v_table_id FROM orders WHERE id = p_order_id;
    
    -- Cerrar el pedido
    UPDATE orders SET status = 'cerrado', closed_at = CURRENT_TIMESTAMP WHERE id = p_order_id;
    
    -- Liberar la mesa
    UPDATE tables SET status = 'libre', current_waiter_id = NULL WHERE id = v_table_id;
    
    COMMIT;
    
    SELECT 'Pedido cerrado exitosamente' as message;
END//

DELIMITER ;

-- ========================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ========================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_orders_table_status ON orders(table_id, status);
CREATE INDEX idx_orders_waiter_created ON orders(waiter_id, created_at);
CREATE INDEX idx_payments_created_method ON payments(created_at, method);
CREATE INDEX idx_order_items_order_status ON order_items(order_id, status);

-- Índices para reportes (sin usar funciones DATE)
CREATE INDEX idx_payments_created_status ON payments(created_at, status);
CREATE INDEX idx_orders_created_status ON orders(created_at, status);

-- ========================================
-- CONFIGURACIÓN FINAL
-- ========================================

-- Mostrar información de la base de datos creada
SELECT 
    'Base de datos Sirius creada exitosamente' as message,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'sirius_db';

-- Mostrar resumen de datos insertados

SELECT 
    'Usuarios' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 
    'Categorías' as tabla, COUNT(*) as registros FROM categories
UNION ALL
SELECT 
    'Productos' as tabla, COUNT(*) as registros FROM menu_items
UNION ALL
SELECT 
    'Mesas' as tabla, COUNT(*) as registros FROM tables
UNION ALL
SELECT 
    'Configuraciones' as tabla, COUNT(*) as registros FROM settings;

-- ============================================
-- MIGRACIONES PARA SISTEMA BAR (004_bar_system.sql)
-- ============================================
-- 1. Tabla para códigos QR por mesa
CREATE TABLE IF NOT EXISTS table_qr_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_id INT NOT NULL,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    qr_url TEXT NOT NULL,
    created_by INT NOT NULL COMMENT 'ID del mesero',
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_table_active (table_id, is_active),
    INDEX idx_token (qr_token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla para invitados/clientes
CREATE TABLE IF NOT EXISTS table_guests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_id INT NOT NULL,
    qr_code_id INT NOT NULL,
    guest_name VARCHAR(100) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (qr_code_id) REFERENCES table_qr_codes(id) ON DELETE CASCADE,
    INDEX idx_table (table_id),
    INDEX idx_session (session_token),
    INDEX idx_qr (qr_code_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla para canciones
CREATE TABLE IF NOT EXISTS song_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_id INT NOT NULL,
    guest_id INT NULL,
    song_name VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NULL,
    song_url VARCHAR(500) NULL,
    platform ENUM('youtube', 'spotify', 'other') DEFAULT 'youtube',
    status ENUM('pending', 'playing', 'played', 'skipped', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    played_at TIMESTAMP NULL,
    duration_seconds INT NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES table_guests(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_table (table_id),
    INDEX idx_requested (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Modificar tabla orders para incluir guest_id

-- Agregar columna guest_id a orders (ejecutar solo si no existe)
ALTER TABLE orders ADD COLUMN guest_id INT NULL AFTER waiter_id;
-- Agregar constraint FK a orders (ejecutar solo si no existe)
ALTER TABLE orders ADD CONSTRAINT fk_orders_guest FOREIGN KEY (guest_id) REFERENCES table_guests(id) ON DELETE SET NULL;

-- 5. Modificar tabla order_items para tracking individual

-- Agregar columna guest_id a order_items (ejecutar solo si no existe)
ALTER TABLE order_items ADD COLUMN guest_id INT NULL AFTER order_id;
-- Agregar constraint FK a order_items (ejecutar solo si no existe)
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_guest FOREIGN KEY (guest_id) REFERENCES table_guests(id) ON DELETE SET NULL;

-- 6. Nueva configuración para monto mínimo de canción
INSERT INTO settings (setting_key, setting_value, description) 
VALUES ('song_minimum_amount', '600000', 'Monto mínimo en COP para solicitar canción')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 7. Configuración para URL del frontend (para generar QR)
INSERT INTO settings (setting_key, setting_value, description) 
VALUES ('frontend_url', 'http://localhost:3000', 'URL del frontend para generar códigos QR')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- ========================================
-- MIGRACIÓN: Corregir triggers de totales (005_fix_order_totals_triggers.sql)
-- ========================================
DROP TRIGGER IF EXISTS update_order_totals_after_insert;
DROP TRIGGER IF EXISTS update_order_totals_after_update;
DROP TRIGGER IF EXISTS update_order_totals_after_delete;

DELIMITER //
CREATE TRIGGER update_order_totals_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = 0,  -- IVA ya incluido en el precio
        total = (
            SELECT COALESCE(SUM(subtotal), 0)  -- Sin multiplicar por 1.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END//

CREATE TRIGGER update_order_totals_after_update
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = 0,  -- IVA ya incluido en el precio
        total = (
            SELECT COALESCE(SUM(subtotal), 0)  -- Sin multiplicar por 1.19
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id;
END//

CREATE TRIGGER update_order_totals_after_delete
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0) 
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        tax_amount = 0,  -- IVA ya incluido en el precio
        total = (
            SELECT COALESCE(SUM(subtotal), 0)  -- Sin multiplicar por 1.19
            FROM order_items 
            WHERE order_id = OLD.order_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.order_id;
END//
DELIMITER ;

-- Recalcular totales de órdenes activas existentes
UPDATE orders o
SET 
    subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = o.id),
    tax_amount = 0,
    total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = o.id)
WHERE status = 'activo';

SELECT 'Triggers actualizados y órdenes activas recalculadas correctamente' AS resultado;

-- ========================================
-- TABLA: invoices (Facturas) (create_invoices_table.sql)
-- ========================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    table_number INT NOT NULL,
    waiter_id INT,
    waiter_name VARCHAR(255),
    cashier_id INT,
    cashier_name VARCHAR(255),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    payment_method ENUM('efectivo', 'tarjeta', 'nequi', 'transferencia') NOT NULL,
    transaction_id VARCHAR(100),
    items JSON NOT NULL, -- Información completa de los productos
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoices_order_id (order_id),
    INDEX idx_invoices_created_at (created_at),
    INDEX idx_invoices_invoice_number (invoice_number),
    INDEX idx_invoices_waiter_id (waiter_id),
    INDEX idx_invoices_cashier_id (cashier_id)
);
