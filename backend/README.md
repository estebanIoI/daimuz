# Restaurant System Backend

Sistema de gestión para el restaurante Sirius desarrollado con Node.js y Express.

## 🚀 Deployment con Docker

### Desde Docker Hub

Puedes ejecutar la aplicación directamente desde Docker Hub:

```bash
# Ejecutar la aplicación
docker run -d \
  --name restaurant-system \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  1006946898/restaurant-system:latest
```

### Con Docker Compose

```yaml
version: '3.8'

services:
  app:
    image: 1006946898/restaurant-system:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/sirius_db
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sirius_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 🐳 Docker Tags Disponibles

- `1006946898/restaurant-system:latest` - Última versión
- `1006946898/restaurant-system:v1.0.0` - Versión específica

## 🔄 Actualizar Versión en Docker Hub

### Proceso paso a paso:

```bash
# 1. Construir nueva imagen con versión específica
docker build -t 1006946898/restaurant-system:v1.1.0 .
docker build -t 1006946898/restaurant-system:latest .

# 2. Subir a Docker Hub
docker push 1006946898/restaurant-system:v1.1.0
docker push 1006946898/restaurant-system:latest
```

### Comando único (recomendado):
```bash
# Construir y subir en una sola línea
docker build -t 1006946898/restaurant-system:v1.1.0 -t 1006946898/restaurant-system:latest . && \
docker push 1006946898/restaurant-system:v1.1.0 && \
docker push 1006946898/restaurant-system:latest
```

### Buenas prácticas para versionado:
- **Patch**: `v1.0.1` (correcciones de bugs)
- **Minor**: `v1.1.0` (nuevas características)
- **Major**: `v2.0.0` (cambios que rompen compatibilidad)

### Verificar imagen subida:
```bash
# Ver las imágenes locales
docker images | grep restaurant-system

# Verificar en Docker Hub
# Ir a: https://hub.docker.com/r/1006946898/restaurant-system/tags
```

## 📋 Variables de Entorno Requeridas

```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_jwt_secret
PORT=3001
```

## 🔧 Desarrollo Local

### Requisitos
- Node.js 18+
- pnpm
- PostgreSQL

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd backend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
pnpm dev
```

## 🚦 Scripts Disponibles

- `pnpm start` - Ejecutar en producción
- `pnpm dev` - Ejecutar en desarrollo con nodemon
- `pnpm test` - Ejecutar tests
- `pnpm migrate` - Ejecutar migraciones de base de datos

## 📁 Estructura del Proyecto

```
src/
├── controllers/     # Controladores de rutas
├── middleware/      # Middleware personalizado
├── models/         # Modelos de datos
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── sockets/        # WebSocket handlers
└── utils/          # Utilidades
```

## 🌐 API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Autenticación
- `GET /api/orders` - Gestión de órdenes
- `GET /api/menu` - Gestión de menú
- `GET /api/tables` - Gestión de mesas

## 📊 Monitoreo

La aplicación incluye:
- Logging con Winston
- Health checks
- Rate limiting
- Error handling centralizado

## 🔒 Seguridad

- Autenticación JWT
- Validación de datos con Zod
- Helmet para headers de seguridad
- CORS configurado
- Rate limiting

## 📝 Licencia

Este proyecto es privado y pertenece al Restaurante Sirius.
