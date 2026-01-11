# Script para aplicar la migración de facturas en Windows
Write-Host "🚀 Aplicando migración de tabla de facturas..." -ForegroundColor Green

# Verificar si existe mysql command
try {
    mysql --version | Out-Null
    Write-Host "✅ MySQL encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ MySQL no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Leer el contenido de la migración
try {
    $migrationContent = Get-Content -Path "migrations\create_invoices_table.sql" -Raw
    Write-Host "📄 Archivo de migración leído correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ No se pudo leer el archivo de migración" -ForegroundColor Red
    exit 1
}

# Solicitar credenciales de base de datos
$username = Read-Host "Ingresa el usuario de MySQL (por defecto: root)"
if ([string]::IsNullOrEmpty($username)) {
    $username = "root"
}

$database = Read-Host "Ingresa el nombre de la base de datos (por defecto: restaurante_sirius)"
if ([string]::IsNullOrEmpty($database)) {
    $database = "restaurante_sirius"
}

Write-Host "Conectando a la base de datos..."
Write-Host "Se solicitará la contraseña de MySQL..."

# Ejecutar la migración
try {
    # Crear archivo temporal con el comando SQL
    $tempFile = [System.IO.Path]::GetTempFileName()
    "USE $database; $migrationContent" | Set-Content -Path $tempFile
    
    # Ejecutar la migración
    mysql -u $username -p < $tempFile
    
    # Limpiar archivo temporal
    Remove-Item $tempFile
    
    Write-Host "✅ Migración aplicada exitosamente" -ForegroundColor Green
    Write-Host "📄 Tabla 'invoices' creada correctamente" -ForegroundColor Green
    Write-Host "🎉 Sistema de facturas listo para usar" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error al aplicar la migración: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}