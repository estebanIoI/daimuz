# 🍽️ Restaurant System - Sirius Cocina Ancestral

**Sistema completo de gestión para restaurantes con arquitectura Frontend-Backend separados**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-blue.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## 🏗️ **Arquitectura General**

Sistema robusto y simple para la gestión integral de restaurantes, desarrollado específicamente para **Sirius Cocina Ancestral**.

### **Stack Tecnológico**
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MySQL/PostgreSQL
- **Autenticación**: JWT
- **Cache**: Sistema de cache personalizado
- **Containerización**: Docker + Docker Compose
- **Tiempo Real**: WebSockets + Auto-refresh

---

## 🎯 **Roles y Funcionalidades**

### **👑 Administrador**
- ✅ Dashboard completo con estadísticas
- ✅ Gestión de usuarios (crear, editar, eliminar)
- ✅ Gestión completa del menú y categorías
- ✅ Gestión de mesas (agregar, eliminar)
- ✅ Reportes y análisis de ventas
- ✅ Configuración del sistema
- ✅ Backup y restauración de BD

### **🍽️ Mesero**
- ✅ Vista de mesas asignadas
- ✅ Crear y gestionar pedidos
- ✅ Agregar/eliminar productos del pedido
- ✅ Notas por mesa y por producto
- ✅ Auto-refresh sincronizado con cocina
- ✅ Notificaciones entre vistas

### **👨‍🍳 Cocinero**
- ✅ Vista de órdenes de cocina en tiempo real
- ✅ Cambio de estado de productos (pendiente → preparación → listo)
- ✅ Filtros por estado de orden
- ✅ Detección automática de productos nuevos
- ✅ Auto-refresh cada 4-7 segundos

### **💰 Cajero**
- ✅ Vista de órdenes listas para pago
- ✅ Procesamiento de pagos (efectivo, tarjeta, Nequi)
- ✅ Estadísticas diarias de ventas
- ✅ Historial de pagos
- ✅ Cierre automático de órdenes

---

## 🚀 **Instalación y Configuración**

### **Desarrollo Local**

```bash
# Clonar el repositorio
git clone https://github.com/estebanIoI/restaurant-system.git
cd restaurant-system

# Frontend
cd frontend
pnpm install
pnpm dev

# Backend (nueva terminal)
cd backend
pnpm install
pnpm dev
```

### **Con Docker (Recomendado para Producción)**

```bash
# Ejecutar stack completo
docker-compose up -d

# Solo frontend
docker run -d -p 3000:3000 1006946898/restaurante-sirius-frontend:latest

# Solo backend
docker run -d -p 3001:3001 1006946898/restaurant-system:latest
```

### **Variables de Entorno**

**Backend (.env)**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_jwt_secret_here
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**Frontend**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME="Sirius Cocina Ancestral"
```

---

## 🗂️ **Estructura del Proyecto**

```
restaurant-system/
├── frontend/                    # Next.js Application
│   ├── app/
│   │   ├── dashboard/          # Panel Administrador
│   │   ├── mesero/             # Panel Mesero
│   │   ├── cocinero/           # Panel Cocinero
│   │   ├── cajero/             # Panel Cajero
│   │   └── login/              # Autenticación
│   ├── components/
│   │   ├── dashboard/          # Componentes admin
│   │   ├── mesero/             # Componentes mesero
│   │   ├── common/             # Componentes compartidos
│   │   └── ui/                 # UI primitivos
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript definitions
│   └── lib/                    # Utilidades
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── services/           # API Gateway
│   │   ├── middleware/         # Middleware custom
│   │   └── config/             # Configuraciones
│   ├── tests/                  # Testing
│   └── docs/                   # Documentación
└── README.md
```

---

## 🔄 **Flujo de Trabajo**

### **Proceso de Pedido Completo**
```
1. Mesero selecciona mesa libre
2. Agrega productos al pedido
3. Cocina recibe la orden automáticamente
4. Cocinero cambia estados: pendiente → preparación → listo
5. Cajero ve la orden lista y procesa el pago
6. Mesa queda libre automáticamente
```

### **Estados de Mesa**
- 🟢 **Libre**: Disponible para nuevos clientes
- 🟡 **Ocupada**: Con pedido activo
- 🔴 **Lista**: Esperando pago

---

## 📊 **Base de Datos - Esquema Principal**

### **Tablas Principales**
```sql
-- Usuarios del sistema
users (id, name, email, password, role, active)

-- Mesas del restaurante
tables (id, number, capacity, status, current_waiter_id)

-- Categorías del menú
categories (id, name, description)

-- Items del menú
menu_items (id, name, description, price, category_id, available, preparation_time)

-- Órdenes/Pedidos
orders (id, table_id, waiter_id, status, total, notes, created_at, closed_at)

-- Items de las órdenes
order_items (id, order_id, menu_item_id, quantity, status, notes)

-- Pagos
payments (id, order_id, cashier_id, method, amount, transaction_id, status)
```

---

## 🎨 **Interfaces TypeScript**

### **Tipos Principales**
```typescript
// Mesa
interface Table {
  id: number
  number: number
  status: "libre" | "ocupada"
  orders: OrderItem[]
  total: number
  waiter?: string
  orderId?: number
  tableNotes?: string
}

// Item del menú
interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  category: string
  category_id: number
  category_name: string
  available: boolean
  preparation_time?: number
}

// Item del pedido
interface OrderItem {
  id: number
  menuItem: MenuItem
  quantity: number
  status?: 'pendiente' | 'preparacion' | 'listo' | 'entregado'
  notes?: string
}

// Orden de cocina
interface KitchenOrder {
  id: number
  tableNumber: number
  items: KitchenOrderItem[]
  status: "pendiente" | "preparacion" | "listo"
  waiter: string
  time: string
  priority: "normal" | "alta"
}
```

---

## 🔧 **API Endpoints Principales**

### **Autenticación**
```bash
POST /api/service/auth.login          # Iniciar sesión
GET  /api/service/auth.me             # Obtener usuario actual
```

### **Mesas**
```bash
GET    /api/service/table.getAll      # Obtener todas las mesas
POST   /api/service/table.create      # Crear nueva mesa
DELETE /api/service/table.delete      # Eliminar mesa
```

### **Menú**
```bash
GET    /api/service/menu.getAll       # Obtener menú completo
POST   /api/service/menu.create       # Crear item del menú
PUT    /api/service/menu.update       # Actualizar item
DELETE /api/service/menu.delete       # Eliminar item
```

### **Pedidos**
```bash
POST   /api/service/order.create      # Crear nuevo pedido
POST   /api/service/order.addItem     # Agregar item al pedido
POST   /api/service/order.removeItem  # Eliminar item del pedido
PUT    /api/service/order.close       # Cerrar pedido
```

### **Cocina**
```bash
GET    /api/service/kitchen.getAll    # Obtener órdenes de cocina
PUT    /api/service/kitchen.updateStatus  # Actualizar estado
```

### **Cajero**
```bash
GET    /api/service/cashier.getActiveOrders  # Órdenes listas
POST   /api/service/cashier.registerPayment # Registrar pago
GET    /api/service/cashier.getDailyStats   # Estadísticas diarias
```

---

## 📈 **Reportes y Analytics**

### **Métricas Disponibles**
- ✅ Ventas diarias/mensuales
- ✅ Productos más vendidos
- ✅ Rendimiento por mesa
- ✅ Rendimiento por mesero
- ✅ Métodos de pago
- ✅ Exportación a PDF
- ✅ Estadísticas en tiempo real

### **Endpoints de Reportes**
```bash
GET /api/service/report.dailySales       # Ventas diarias
GET /api/service/report.topProducts      # Productos top
GET /api/service/report.tablePerformance # Rendimiento mesas
```

---

## 🔐 **Seguridad**

### **Autenticación y Autorización**
- **JWT Tokens** para sesiones seguras
- **Roles basados** en permisos específicos
- **Middleware de autenticación** en todas las rutas protegidas
- **Rate limiting** para prevenir ataques
- **Validación de datos** con esquemas estrictos

### **Roles del Sistema**
```javascript
const ROLES = {
  ADMIN: 'administrador',
  WAITER: 'mesero',
  KITCHEN: 'cocinero',
  CASHIER: 'cajero'
}
```

---

## 💾 **Sistema de Cache y Optimización**

### **Cache Estratégico**
```javascript
// Cache por módulo con TTL optimizado
const cacheService = {
  kitchen: new NodeCache({ stdTTL: 30 }),    // 30 segundos
  orders: new NodeCache({ stdTTL: 60 }),     // 1 minuto
  tables: new NodeCache({ stdTTL: 45 }),     // 45 segundos
  menu: new NodeCache({ stdTTL: 300 })       // 5 minutos
}
```

### **Optimizaciones Frontend**
- **Memoización** de componentes pesados
- **Auto-refresh inteligente** sin pestañeo
- **Lazy loading** de componentes
- **Gestión eficiente** del estado local

---

## 🔄 **Sincronización en Tiempo Real**

### **Sistema de Notificaciones Globales**
```javascript
// Comunicación entre todas las vistas
const triggerGlobalRefresh = (action, details) => {
  const refreshEvent = {
    type: 'ORDER_UPDATED',
    timestamp: Date.now(),
    source: 'mesero',
    action: action,
    details: details
  }
  localStorage.setItem('globalRefreshTrigger', JSON.stringify(refreshEvent))
  window.dispatchEvent(new CustomEvent('globalRefresh', { detail: refreshEvent }))
}
```

### **Auto-refresh por Rol**
- **Cocina**: 4-7 segundos
- **Mesero**: 10-15 segundos
- **Cajero**: 8-12 segundos
- **Admin**: 30 segundos

---

## 🐳 **Docker y Deployment**

### **Imágenes Docker Disponibles**
```bash
# Frontend
docker pull 1006946898/restaurante-sirius-frontend:latest

# Backend
docker pull 1006946898/restaurant-system:latest
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  frontend:
    image: 1006946898/restaurante-sirius-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api
  
  backend:
    image: 1006946898/restaurant-system:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/sirius_db
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sirius_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🧪 **Testing**

### **Ejecutar Tests**
```bash
# Backend
cd backend
pnpm test              # Unit tests
pnpm test:integration  # Integration tests
pnpm test:e2e         # End-to-end tests

# Frontend
cd frontend
pnpm test             # Component tests
pnpm test:e2e         # E2E with Playwright
```

### **Cobertura de Tests**
- **Unit Tests**: Lógica de negocio
- **Integration Tests**: APIs y database
- **E2E Tests**: Flujos completos de usuario

---

## 📱 **Características Destacadas**

### **🔄 Sistema de Notificaciones Globales**
- Comunicación entre todas las vistas
- Updates automáticos sin refresh manual
- Sincronización entre pestañas/ventanas

### **⚡ Auto-refresh Inteligente**
- Intervalos optimizados por rol
- Pausado durante acciones del usuario
- Sin interferencia con la experiencia

### **🎯 Gestión de Estado Avanzada**
- Updates inmediatos en UI
- Sincronización con backend
- Manejo de errores robusto

### **📱 Responsive Design**
- Adaptado para tablets y móviles
- UI optimizada por rol
- Navegación intuitiva

---

## 📊 **Métricas del Proyecto**

### **Líneas de Código**
- **Frontend**: ~15,000 líneas TypeScript/TSX
- **Backend**: ~8,000 líneas JavaScript
- **Total**: ~23,000 líneas de código

### **Componentes y Archivos**
- **40+ componentes React**
- **50+ controladores backend**
- **15+ hooks personalizados**
- **25+ tipos TypeScript**

---

## 🛠️ **Comandos Útiles**

### **Desarrollo**
```bash
# Instalar dependencias
pnpm install

# Desarrollo con hot reload
pnpm dev

# Build para producción
pnpm build

# Linting y formato
pnpm lint
pnpm format
```

### **Docker**
```bash
# Build local
docker-compose build

# Ejecutar en desarrollo
docker-compose up

# Ejecutar en producción
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f
```

### **Base de Datos**
```bash
# Backup
pnpm backup

# Restore
pnpm restore

# Migrations
pnpm migrate

# Seeds
pnpm seed
```

---

## 🚀 **Estado del Proyecto**

### **✅ Implementado y Funcional**
- ✅ Sistema completo de autenticación
- ✅ Gestión integral de pedidos
- ✅ Sincronización multi-vista
- ✅ Reportes y analytics
- ✅ Sistema de cache
- ✅ Deployment con Docker
- ✅ Auto-refresh inteligente
- ✅ Notificaciones globales

### **🔄 En Desarrollo Continuo**
- 🔄 Optimizaciones de performance
- 🔄 Nuevas métricas de reportes
- 🔄 Mejoras en la UI/UX
- 🔄 Testing automatizado
- 🔄 Integración con sistemas de pago

---

## 📞 **Soporte y Contacto**

### **Desarrollador**
- **GitHub**: [@estebanIoI](https://github.com/estebanIoI)
- **Proyecto**: Sirius Cocina Ancestral

### **Documentación Adicional**
- [API Documentation](./backend/docs/api-spec.yaml)
- [Database Schema](./backend/docs/mysql-config.md)
- [Deployment Guide](./docs/deployment.md)

---

## 📄 **Licencia**

Este proyecto está desarrollado específicamente para **Sirius Cocina Ancestral**.

---

**🍽️ Sistema robusto y simple para la gestión completa de restaurantes**

*Desarrollado con ❤️ para Sirius Cocina Ancestral*
