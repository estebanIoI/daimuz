-- ========================================
-- MIGRACIÓN: Corregir triggers de totales
-- ========================================
-- Problema: Los triggers aplicaban 19% de IVA adicional, pero el precio
-- de los productos YA incluye el IVA. Esto causaba cálculos incorrectos
-- cuando se hacían pagos individuales por cliente.
--
-- Solución: El total debe ser igual al subtotal (sin multiplicar por 1.19)
-- y el tax_amount debe ser 0 (ya que el IVA está incluido en el precio).
-- ========================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS update_order_totals_after_insert;
DROP TRIGGER IF EXISTS update_order_totals_after_update;
DROP TRIGGER IF EXISTS update_order_totals_after_delete;

DELIMITER //

-- Trigger para INSERT: El precio ya incluye IVA, no aplicar impuesto adicional
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

-- Trigger para UPDATE: El precio ya incluye IVA, no aplicar impuesto adicional
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

-- Trigger para DELETE: El precio ya incluye IVA, no aplicar impuesto adicional
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
-- Recalcular totales de órdenes activas existentes
-- ========================================
UPDATE orders o
SET 
    subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = o.id),
    tax_amount = 0,
    total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = o.id)
WHERE status = 'activo';

SELECT 'Triggers actualizados y órdenes activas recalculadas correctamente' AS resultado;
