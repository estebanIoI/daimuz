-- ============================================
-- MIGRACIONES PARA SISTEMA BAR
-- ============================================
USE sirius_db;
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
-- Primero verificamos si la columna existe y la agregamos si no
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'guest_id');

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE orders ADD COLUMN guest_id INT NULL AFTER waiter_id', 
    'SELECT "Column guest_id already exists in orders"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar FK si no existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND CONSTRAINT_NAME = 'fk_orders_guest');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_guest FOREIGN KEY (guest_id) REFERENCES table_guests(id) ON DELETE SET NULL', 
    'SELECT "FK fk_orders_guest already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Modificar tabla order_items para tracking individual
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'guest_id');

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE order_items ADD COLUMN guest_id INT NULL AFTER order_id', 
    'SELECT "Column guest_id already exists in order_items"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar FK si no existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND CONSTRAINT_NAME = 'fk_order_items_guest');

SET @sql = IF(@fk_exists = 0, 
    'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_guest FOREIGN KEY (guest_id) REFERENCES table_guests(id) ON DELETE SET NULL', 
    'SELECT "FK fk_order_items_guest already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Nueva configuración para monto mínimo de canción
INSERT INTO settings (setting_key, setting_value, description) 
VALUES ('song_minimum_amount', '600000', 'Monto mínimo en COP para solicitar canción')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 7. Configuración para URL del frontend (para generar QR)
INSERT INTO settings (setting_key, setting_value, description) 
VALUES ('frontend_url', 'http://localhost:3000', 'URL del frontend para generar códigos QR')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
