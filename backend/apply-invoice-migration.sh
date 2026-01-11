#!/bin/bash

# Script para aplicar la migración de facturas
echo "🚀 Aplicando migración de tabla de facturas..."

# Verificar si existe mysql command
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL no está instalado o no está en el PATH"
    exit 1
fi

# Ejecutar la migración
mysql -u root -p -e "USE restaurante_sirius; $(cat migrations/create_invoices_table.sql)"

if [ $? -eq 0 ]; then
    echo "✅ Migración aplicada exitosamente"
    echo "📄 Tabla 'invoices' creada correctamente"
else
    echo "❌ Error al aplicar la migración"
    exit 1
fi

echo "🎉 Sistema de facturas listo para usar"