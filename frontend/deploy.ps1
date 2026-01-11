# Script de despliegue para Restaurante Sirius Frontend
# Uso: .\deploy.ps1 [version]

param(
    [string]$Version = "latest"
)

# Configuración
$DOCKER_USER = "1006946898"
$IMAGE_NAME = "restaurante-sirius-frontend"
$CONTAINER_NAME = "restaurante-sirius-frontend"
$PORT = "3000"
$FULL_IMAGE_NAME = "$DOCKER_USER/$IMAGE_NAME:$Version"

Write-Host "🚀 Desplegando $IMAGE_NAME versión $Version..." -ForegroundColor Green

# Función para verificar si Docker está ejecutándose
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Host "❌ Error: Docker no está ejecutándose" -ForegroundColor Red
        exit 1
    }
}

# Función para parar y eliminar contenedor existente
function Remove-ExistingContainer {
    Write-Host "🧹 Limpiando contenedor existente..." -ForegroundColor Yellow
    
    $existingContainer = docker ps -q -f name=$CONTAINER_NAME
    if ($existingContainer) {
        Write-Host "Parando contenedor existente..." -ForegroundColor Yellow
        docker stop $CONTAINER_NAME
    }
    
    $existingContainer = docker ps -a -q -f name=$CONTAINER_NAME
    if ($existingContainer) {
        Write-Host "Eliminando contenedor existente..." -ForegroundColor Yellow
        docker rm $CONTAINER_NAME
    }
}

# Función para descargar la imagen
function Get-DockerImage {
    Write-Host "📥 Descargando imagen $FULL_IMAGE_NAME..." -ForegroundColor Blue
    docker pull $FULL_IMAGE_NAME
}

# Función para ejecutar el contenedor
function Start-Container {
    Write-Host "🏃 Ejecutando nuevo contenedor..." -ForegroundColor Blue
    docker run -d `
        --name $CONTAINER_NAME `
        -p "${PORT}:3000" `
        -e NODE_ENV=production `
        -e NEXT_TELEMETRY_DISABLED=1 `
        --restart unless-stopped `
        $FULL_IMAGE_NAME
    
    Write-Host "✅ Contenedor $CONTAINER_NAME ejecutándose en puerto $PORT" -ForegroundColor Green
}

# Función para verificar que el contenedor está funcionando
function Test-ContainerHealth {
    Write-Host "🏥 Verificando estado del contenedor..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    $runningContainer = docker ps | Select-String $CONTAINER_NAME
    if ($runningContainer) {
        Write-Host "✅ Contenedor está ejecutándose correctamente" -ForegroundColor Green
        Write-Host "🌐 Aplicación disponible en: http://localhost:$PORT" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error: El contenedor no está ejecutándose" -ForegroundColor Red
        Write-Host "📋 Logs del contenedor:" -ForegroundColor Yellow
        docker logs $CONTAINER_NAME
        exit 1
    }
}

# Función para limpiar imágenes no utilizadas
function Remove-UnusedImages {
    Write-Host "🧹 Limpiando imágenes no utilizadas..." -ForegroundColor Yellow
    docker image prune -f
}

# Función principal
function Main {
    Write-Host "==================================" -ForegroundColor Magenta
    Write-Host "🍴 Restaurante Sirius - Frontend" -ForegroundColor Magenta
    Write-Host "🐳 Script de Despliegue Docker" -ForegroundColor Magenta
    Write-Host "==================================" -ForegroundColor Magenta
    
    Test-Docker
    Remove-ExistingContainer
    Get-DockerImage
    Start-Container
    Test-ContainerHealth
    Remove-UnusedImages
    
    Write-Host ""
    Write-Host "🎉 Despliegue completado exitosamente!" -ForegroundColor Green
    Write-Host "📱 Aplicación: http://localhost:$PORT" -ForegroundColor Cyan
    Write-Host "📋 Logs: docker logs -f $CONTAINER_NAME" -ForegroundColor Yellow
    Write-Host "🛑 Parar: docker stop $CONTAINER_NAME" -ForegroundColor Yellow
}

# Ejecutar función principal
Main
