#!/bin/bash

# Script de despliegue para Restaurante Sirius Frontend
# Uso: ./deploy.sh [version]

set -e

# Configuración
DOCKER_USER="1006946898"
IMAGE_NAME="restaurante-sirius-frontend"
CONTAINER_NAME="restaurante-sirius-frontend"
PORT="3000"

# Obtener versión (por defecto 'latest')
VERSION=${1:-latest}
FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME:$VERSION"

echo "🚀 Desplegando $IMAGE_NAME versión $VERSION..."

# Función para verificar si Docker está ejecutándose
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Error: Docker no está ejecutándose"
        exit 1
    fi
}

# Función para parar y eliminar contenedor existente
cleanup_existing() {
    echo "🧹 Limpiando contenedor existente..."
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        echo "Parando contenedor existente..."
        docker stop $CONTAINER_NAME
    fi
    
    if docker ps -a -q -f name=$CONTAINER_NAME | grep -q .; then
        echo "Eliminando contenedor existente..."
        docker rm $CONTAINER_NAME
    fi
}

# Función para descargar la imagen
pull_image() {
    echo "📥 Descargando imagen $FULL_IMAGE_NAME..."
    docker pull $FULL_IMAGE_NAME
}

# Función para ejecutar el contenedor
run_container() {
    echo "🏃 Ejecutando nuevo contenedor..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        -e NODE_ENV=production \
        -e NEXT_TELEMETRY_DISABLED=1 \
        --restart unless-stopped \
        $FULL_IMAGE_NAME
    
    echo "✅ Contenedor $CONTAINER_NAME ejecutándose en puerto $PORT"
}

# Función para verificar que el contenedor está funcionando
health_check() {
    echo "🏥 Verificando estado del contenedor..."
    sleep 5
    
    if docker ps | grep -q $CONTAINER_NAME; then
        echo "✅ Contenedor está ejecutándose correctamente"
        echo "🌐 Aplicación disponible en: http://localhost:$PORT"
    else
        echo "❌ Error: El contenedor no está ejecutándose"
        echo "📋 Logs del contenedor:"
        docker logs $CONTAINER_NAME
        exit 1
    fi
}

# Función para limpiar imágenes no utilizadas
cleanup_images() {
    echo "🧹 Limpiando imágenes no utilizadas..."
    docker image prune -f
}

# Función principal
main() {
    echo "=================================="
    echo "🍴 Restaurante Sirius - Frontend"
    echo "🐳 Script de Despliegue Docker"
    echo "=================================="
    
    check_docker
    cleanup_existing
    pull_image
    run_container
    health_check
    cleanup_images
    
    echo ""
    echo "🎉 Despliegue completado exitosamente!"
    echo "📱 Aplicación: http://localhost:$PORT"
    echo "📋 Logs: docker logs -f $CONTAINER_NAME"
    echo "🛑 Parar: docker stop $CONTAINER_NAME"
}

# Ejecutar función principal
main
