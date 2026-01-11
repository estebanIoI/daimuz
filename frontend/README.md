# Restaurante Sirius - Frontend

Sistema de gestión para restaurante Sirius Cocina Ancestral construido con Next.js 15 y TypeScript.

## 🚀 Despliegue con Docker

### Opción 1: Usar imagen desde Docker Hub

```bash
# Descargar y ejecutar directamente
docker run -d -p 3000:3000 --name restaurante-sirius-frontend 1006946898/restaurante-sirius-frontend:latest

# O usar docker-compose
docker-compose up -d
```

### Opción 2: Construir localmente

```bash
# Construir la imagen
docker build -t restaurante-sirius-frontend .

# Ejecutar el contenedor
docker run -d -p 3000:3000 --name restaurante-sirius-frontend restaurante-sirius-frontend
```

## 📋 Comandos útiles

### Docker
```bash
# Ver logs del contenedor
docker logs restaurante-sirius-frontend

# Parar el contenedor
docker stop restaurante-sirius-frontend

# Eliminar el contenedor
docker rm restaurante-sirius-frontend

# Actualizar la imagen
docker pull 1006946898/restaurante-sirius-frontend:latest
docker stop restaurante-sirius-frontend
docker rm restaurante-sirius-frontend
docker run -d -p 3000:3000 --name restaurante-sirius-frontend 1006946898/restaurante-sirius-frontend:latest
```

### Docker Compose
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Actualizar y reiniciar
docker-compose pull
docker-compose up -d --force-recreate
```

## 🔧 Desarrollo

### Requisitos
- Node.js 18+
- pnpm
- Docker (opcional)

### Instalación local
```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Construir para producción
pnpm build

# Ejecutar en producción
pnpm start
```

## 🌐 Acceso

Una vez desplegado, la aplicación estará disponible en:
- **Local**: http://localhost:3000
- **Producción**: Configurar según tu dominio

## 📱 Características

- ✅ Sistema de autenticación
- ✅ Gestión de usuarios (Admin, Mesero, Cocinero, Cajero)
- ✅ Gestión de mesas y pedidos
- ✅ Dashboard administrativo
- ✅ Interfaz responsive
- ✅ Gestión de menú y categorías
- ✅ Sistema de reportes
- ✅ Dockerizado y listo para producción

## 🔐 Roles de Usuario

1. **Administrador**: Acceso completo al sistema
2. **Mesero**: Gestión de mesas y pedidos
3. **Cocinero**: Vista de pedidos de cocina
4. **Cajero**: Procesamiento de pagos

## 🏗️ Arquitectura

```
├── app/                # Pages (App Router)
├── components/         # Componentes reutilizables
├── hooks/             # Custom hooks
├── lib/               # Utilidades
├── types/             # Definiciones TypeScript
├── data/              # Datos mock
├── public/            # Archivos estáticos
└── styles/            # Estilos globales
```

## 📦 Docker Hub

La imagen está disponible públicamente en:
**[1006946898/restaurante-sirius-frontend](https://hub.docker.com/r/1006946898/restaurante-sirius-frontend)**

---

© 2024 Sirius Cocina Ancestral - Todos los derechos reservados
