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