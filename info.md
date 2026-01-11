# 📋 SUSTENTACIÓN DEL PROYECTO ADMIN-MANAGER
## Sistema de Gestión"

---

## 📌 1. INFORMACIÓN GENERAL DEL PROYECTO

| Campo | Descripción |
|-------|-------------|
| **Nombre del Proyecto** | Admin-Manager (zetban x) |
| **Tipo de Aplicación** | Sistema de Gestión para Restaurante |
| **Arquitectura** | Cliente-Servidor (Full-Stack) |
| **Repositorio** | github.com/estebanIoI/admin-manager |
| **Rama Principal** | main |

---

## 📌 2. DESCRIPCIÓN DEL SISTEMA

**Admin-Manager** es un sistema integral de gestión para restaurantes que permite administrar de forma eficiente las operaciones diarias del negocio. El sistema está diseñado para "Sirius Cocina Ancestral", un restaurante ubicado en Mocoa, Putumayo, Colombia, que ofrece gastronomía tradicional colombiana.

### Objetivos del Sistema:
- ✅ Gestión completa de mesas y pedidos en tiempo real
- ✅ Control de inventario y menú
- ✅ Procesamiento de pagos con múltiples métodos
- ✅ Comunicación en tiempo real entre cocina, meseros y cajeros
- ✅ Generación de reportes y estadísticas de ventas
- ✅ Administración de usuarios con roles diferenciados
- ✅ Sistema de facturación electrónica
- ✅ Respaldo y restauración de base de datos

---

## 📌 3. STACK TECNOLÓGICO

### 🔹 BACKEND

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | v18+ | Runtime de JavaScript |
| **Express.js** | ^4.18.2 | Framework web |
| **MySQL2** | ^3.14.1 | Driver de base de datos |
| **Socket.io** | ^4.7.4 | Comunicación en tiempo real |
| **JWT** | ^9.0.2 | Autenticación basada en tokens |
| **Bcrypt.js** | ^2.4.3 | Encriptación de contraseñas |
| **Helmet** | ^7.1.0 | Seguridad HTTP |
| **Winston** | ^3.11.0 | Sistema de logs |
| **Zod** | ^3.22.4 | Validación de datos |
| **Nodemailer** | ^7.0.5 | Envío de correos |
| **Node-cron** | ^3.0.3 | Tareas programadas |
| **Sharp** | ^0.33.1 | Procesamiento de imágenes |

### 🔹 FRONTEND

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.2.4 | Framework React para producción |
| **React** | ^19 | Biblioteca de UI |
| **TypeScript** | ^5 | Tipado estático |
| **Tailwind CSS** | ^3.4.17 | Framework CSS utilitario |
| **Radix UI** | Varios | Componentes accesibles |
| **Recharts** | 2.15.0 | Gráficas y visualizaciones |
| **React Hook Form** | ^7.54.1 | Manejo de formularios |
| **Zod** | ^3.24.1 | Validación de esquemas |
| **Lucide React** | ^0.454.0 | Iconos |
| **jsPDF** | ^3.0.1 | Generación de PDF |
| **Sonner** | ^1.7.1 | Sistema de notificaciones |

### 🔹 BASE DE DATOS

| Tecnología | Propósito |
|------------|-----------|
| **MySQL** | Base de datos relacional principal |
| **Charset** | utf8mb4 (soporte Unicode completo) |
| **Collation** | utf8mb4_unicode_ci |

### 🔹 INFRAESTRUCTURA

| Tecnología | Propósito |
|------------|-----------|
| **Docker** | Contenedorización |
| **Docker Compose** | Orquestación de servicios |
| **pnpm** | Gestor de paquetes |

---

## 📌 4. ARQUITECTURA DEL SISTEMA

### 4.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              FRONTEND (Next.js 15)                  │    │
│  │  • Pages: login, dashboard, mesero, cajero, cocinero│    │
│  │  • Components: UI, Dashboard, Common                │    │
│  │  • Hooks: useApi, useAuth, useNotifications         │    │
│  │  • TypeScript + Tailwind CSS + Radix UI             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EXPRESS.JS + Socket.io                  │    │
│  │  • API Gateway Pattern (/api/service)               │    │
│  │  • JWT Authentication                               │    │
│  │  • Rate Limiting + Helmet Security                  │    │
│  │  • Middleware: auth, validation, errorHandler       │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SERVICE LAYER                          │    │
│  │  • Auth Services (login, me, forgotPassword)        │    │
│  │  • User Services (CRUD, toggleStatus)               │    │
│  │  • Order Services (create, addItem, close)          │    │
│  │  • Kitchen Services (getAll, updateStatus)          │    │
│  │  • Cashier Services (payments, stats)               │    │
│  │  • Report Services (sales, products, performance)   │    │
│  │  • Database Services (backup, restore)              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ MySQL Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (MySQL)                         │
│  • users, tables, orders, order_items                       │
│  • menu_items, categories, payments                          │
│  • invoices, settings, audit_logs                           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Patrón API Gateway

El backend implementa un **patrón API Gateway** donde todas las peticiones pasan por un único endpoint `/api/service` y se enrutan internamente según el campo `service`:

```javascript
// Ejemplo de petición
POST /api/service
{
  "service": "order.create",
  "payload": { "table_id": 1, "waiter_id": 2 }
}
```

### 4.3 Servicios Disponibles (46 servicios)

| Módulo | Servicios |
|--------|-----------|
| **Health** | health.check |
| **Auth** | auth.login, auth.me, auth.forgotPassword, auth.resetPassword |
| **Users** | user.getAll, user.create, user.update, user.resetPassword, user.toggleUserStatus |
| **Tables** | table.getAll, table.create, table.getNextNumber, table.delete |
| **Categories** | category.getAll, category.create, category.delete |
| **Menu** | menu.getAll, menu.create, menu.update, menu.delete |
| **Orders** | order.create, order.addItem, order.decreaseItem, order.removeItem, order.close, order.getActiveWithItems, order.updateTableNotes, order.updateItemNotes |
| **Kitchen** | kitchen.getAll, kitchen.updateStatus |
| **Cashier** | cashier.getActiveOrders, cashier.registerPayment, cashier.getPaymentHistory, cashier.getDailyStats |
| **Reports** | report.dailySales, report.topProducts, report.tablePerformance, report.paymentSummary |
| **Invoices** | invoice.create, invoice.getAll, invoice.getById |
| **Settings** | settings.getAll, settings.update |
| **Database** | database.backup, database.restore, database.listBackups |

---

## 📌 5. MODELO DE BASE DE DATOS

### 5.1 Diagrama Entidad-Relación

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   tables     │       │  categories  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ name         │◄──────│ current_     │       │ name         │
│ email (UQ)   │       │ waiter_id    │       │ description  │
│ password_hash│       │ number (UQ)  │       │ active       │
│ role (ENUM)  │       │ capacity     │       └──────┬───────┘
│ active       │       │ status       │              │
│ last_login   │       └──────┬───────┘              │
└──────┬───────┘              │                      │
       │                      │                      │
       │         ┌────────────┴────────────┐        │
       │         │                         │        │
       ▼         ▼                         │        ▼
┌──────────────────────┐            ┌──────────────────────┐
│       orders         │            │     menu_items       │
├──────────────────────┤            ├──────────────────────┤
│ id (PK)              │            │ id (PK)              │
│ table_id (FK)        │            │ name                 │
│ waiter_id (FK)       │            │ description          │
│ status (ENUM)        │            │ price                │
│ subtotal             │            │ category_id (FK)     │
│ tax_amount           │            │ image_url            │
│ total                │            │ available            │
│ notes                │            │ preparation_time     │
└──────────┬───────────┘            └──────────┬───────────┘
           │                                   │
           │         ┌─────────────────────────┘
           │         │
           ▼         ▼
   ┌──────────────────────┐
   │     order_items      │
   ├──────────────────────┤
   │ id (PK)              │
   │ order_id (FK)        │
   │ menu_item_id (FK)    │
   │ quantity             │
   │ unit_price           │
   │ subtotal             │
   │ status (ENUM)        │
   │ notes                │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │      payments        │        │      invoices        │
   ├──────────────────────┤        ├──────────────────────┤
   │ id (PK)              │        │ id (PK)              │
   │ order_id (FK)        │        │ order_id (FK)        │
   │ cashier_id (FK)      │        │ invoice_number (UQ)  │
   │ amount               │        │ table_number         │
   │ method (ENUM)        │        │ waiter_id/name       │
   │ status               │        │ cashier_id/name      │
   │ transaction_id       │        │ subtotal/total       │
   └──────────────────────┘        │ payment_method       │
                                   │ items (JSON)         │
   ┌──────────────────────┐        └──────────────────────┘
   │     audit_logs       │
   ├──────────────────────┤        ┌──────────────────────┐
   │ id (PK)              │        │      settings        │
   │ user_id (FK)         │        ├──────────────────────┤
   │ action               │        │ id (PK)              │
   │ table_name           │        │ setting_key (UQ)     │
   │ old_values (JSON)    │        │ setting_value        │
   │ new_values (JSON)    │        │ description          │
   │ ip_address           │        └──────────────────────┘
   └──────────────────────┘
```

### 5.2 Tablas del Sistema

| Tabla | Registros Iniciales | Descripción |
|-------|---------------------|-------------|
| **users** | 5 usuarios | Usuarios del sistema con 4 roles |
| **tables** | 15 mesas | Mesas del restaurante |
| **categories** | 8 categorías | Categorías del menú |
| **menu_items** | 24 productos | Productos del menú |
| **orders** | - | Pedidos activos/históricos |
| **order_items** | - | Detalles de cada pedido |
| **payments** | - | Registro de pagos |
| **invoices** | - | Facturas generadas |
| **settings** | 9 configuraciones | Configuración del sistema |
| **audit_logs** | - | Auditoría de acciones |

### 5.3 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **administrador** | Acceso completo: usuarios, reportes, configuración, backups |
| **mesero** | Gestión de mesas, pedidos, visualización de menú |
| **cajero** | Procesamiento de pagos, historial, estadísticas diarias |
| **cocinero** | Visualización de pedidos, actualización de estados |

---

## 📌 6. MÓDULOS DEL SISTEMA

### 6.1 Módulo de Autenticación

**Características:**
- Login con email/contraseña
- Tokens JWT con expiración de 8 horas
- Recuperación de contraseña por email
- Sesiones persistentes con "Recordarme"
- Redirección automática según rol

**Flujo de Autenticación:**
```
1. Usuario ingresa credenciales
2. Backend valida en MySQL
3. Si válido: genera JWT con userId, email, role
4. Frontend almacena token en localStorage
5. Peticiones incluyen header: Authorization: Bearer <token>
6. Backend verifica token en cada petición protegida
```

### 6.2 Módulo de Mesas

**Funcionalidades:**
- Visualización de estado de mesas (libre, ocupada, reservada, mantenimiento)
- Creación y eliminación de mesas
- Asignación automática de mesero
- Notas por mesa

### 6.3 Módulo de Pedidos

**Funcionalidades:**
- Creación de pedidos por mesa
- Agregar/quitar productos con cantidades
- Notas especiales por producto
- Cálculo automático de subtotales e impuestos
- Estados: activo, cerrado, cancelado

**Estados de Items:**
```
pendiente → preparacion → listo → entregado
```

### 6.4 Módulo de Cocina

**Funcionalidades:**
- Vista de pedidos pendientes en tiempo real
- Actualización de estados de preparación
- Filtrado por estado (pendiente, en preparación, listo)
- Priorización de pedidos
- Notificaciones a meseros cuando está listo

### 6.5 Módulo de Caja

**Funcionalidades:**
- Vista de pedidos listos para cobrar
- Procesamiento de pagos múltiples métodos:
  - Efectivo
  - Tarjeta
  - Nequi
  - Transferencia
- Generación automática de facturas
- Historial de pagos del día
- Estadísticas en tiempo real

### 6.6 Módulo de Reportes

**Reportes Disponibles:**
- **Ventas Diarias**: Resumen de ventas últimos 7 días
- **Productos Top**: Productos más vendidos
- **Rendimiento de Mesas**: Estadísticas por mesa
- **Resumen de Pagos**: Desglose por método de pago

### 6.7 Módulo de Administración

**Gestión de Usuarios:**
- CRUD completo de usuarios
- Activar/desactivar cuentas
- Restablecer contraseñas

**Gestión de Menú:**
- CRUD de categorías
- CRUD de productos
- Disponibilidad de productos
- Tiempo de preparación

**Configuración del Sistema:**
- Nombre del restaurante
- Tasa de impuestos (19%)
- Moneda (COP)
- Propina de servicio (10%)
- Datos de contacto

**Base de Datos:**
- Crear respaldos manuales
- Restaurar desde respaldo
- Historial de respaldos

---

## 📌 7. SEGURIDAD IMPLEMENTADA

### 7.1 Autenticación y Autorización

| Medida | Implementación |
|--------|----------------|
| **Encriptación de contraseñas** | bcrypt con salt de 10 rondas |
| **Tokens JWT** | Firmados con JWT_SECRET, expiran en 8h |
| **Verificación de roles** | Middleware de autorización por servicio |
| **Protección de rutas** | Lista de servicios que requieren autenticación |

### 7.2 Seguridad HTTP

| Medida | Implementación |
|--------|----------------|
| **Helmet** | Headers de seguridad HTTP |
| **CORS** | Configurado para dominios específicos |
| **Rate Limiting** | 3000 requests/15min con skip para servicios críticos |
| **Validación de datos** | Zod schemas en frontend y backend |

### 7.3 Rate Limiter Inteligente

```javascript
// Servicios excluidos del rate limiting para tiempo real:
- health.check
- kitchen.getAll
- order.getActiveWithItems
- table.getAll
- cashier.getActiveOrders
```

---

## 📌 8. COMUNICACIÓN EN TIEMPO REAL

### 8.1 Socket.io Events

**Eventos del Sistema:**
| Evento | Emisor | Receptor | Propósito |
|--------|--------|----------|-----------|
| `join-role` | Cliente | Servidor | Unirse a sala por rol |
| `new-order` | Mesero | Cocina, Cajero | Nuevo pedido creado |
| `order-status-update` | Cocina | Mesero, Cajero | Estado actualizado |
| `payment-processed` | Cajero | Todos | Pago completado |
| `connection-stats` | Servidor | Admin | Estadísticas de conexiones |

### 8.2 Salas (Rooms)

```
• mesero - Todos los meseros conectados
• cocinero - Personal de cocina
• cajero - Cajeros activos
• admin - Administradores
• {role}-{userId} - Sala específica por usuario
```

---

## 📌 9. INTERFACES DE USUARIO

### 9.1 Página de Login (`/login`)
- Formulario de autenticación
- Opción "Recordarme"
- Recuperación de contraseña
- Diseño responsive con imagen de fondo

### 9.2 Dashboard Administrador (`/dashboard`)
- **Inicio**: Estadísticas generales, gráficas de ventas
- **Menú**: Gestión de categorías y productos
- **Reportes**: Ventas, productos top, rendimiento
- **Usuarios**: CRUD de usuarios del sistema
- **Configuración**: Ajustes del restaurante y backups

### 9.3 Panel Mesero (`/mesero`)
- Vista de todas las mesas con estados
- Modal de pedidos para agregar productos
- Filtrado por categorías
- Notas por mesa y por producto
- Auto-refresco cada 10 segundos

### 9.4 Panel Cajero (`/cajero`)
- Lista de pedidos listos para cobrar
- Modal de pago con métodos disponibles
- Historial de pagos del día
- Estadísticas en tiempo real
- Generación de facturas PDF

### 9.5 Panel Cocinero (`/cocinero`)
- Tarjetas de pedidos por mesa
- Estados visuales (pendiente, preparación, listo)
- Botones de acción por producto
- Filtrado por estado
- Indicadores de prioridad

---

## 📌 10. COMPONENTES REUTILIZABLES

### 10.1 Componentes UI (shadcn/ui)

El proyecto utiliza **50+ componentes** de shadcn/ui basados en Radix UI:

| Categoría | Componentes |
|-----------|-------------|
| **Layout** | Card, Separator, Tabs, Accordion, Collapsible |
| **Forms** | Input, Button, Checkbox, Select, Switch, Textarea |
| **Feedback** | Alert, Toast, Progress, Skeleton |
| **Overlay** | Dialog, Sheet, Popover, Dropdown, Tooltip |
| **Data Display** | Table, Badge, Avatar, Calendar |
| **Navigation** | Breadcrumb, Menubar, Navigation Menu |

### 10.2 Componentes Personalizados

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `Header` | /common | Barra superior con usuario y logout |
| `StatsCard` | /common | Tarjeta de estadísticas |
| `Sidebar` | /dashboard | Navegación lateral del admin |
| `TableCard` | /mesero | Tarjeta de mesa con estado |
| `OrderModal` | /mesero | Modal para gestionar pedidos |
| `OrderCard` | /cocinero | Tarjeta de pedido en cocina |
| `PaymentModal` | /cajero | Modal de procesamiento de pago |
| `InvoiceCard` | /dashboard | Tarjeta de factura |

### 10.3 Hooks Personalizados

| Hook | Propósito |
|------|-----------|
| `useApi` | Comunicación con backend, manejo de errores y retry |
| `useAuth` | Estado de autenticación y logout |
| `useCurrentTime` | Reloj actualizado |
| `useLastUpdate` | Timestamp de última actualización |
| `useNetworkStatus` | Estado de conexión a internet |
| `useNotifications` | Sistema de notificaciones |
| `useTables` | Gestión de estado de mesas |

---

## 📌 11. DEPLOYMENT Y PRODUCCIÓN

### 11.1 Docker Compose Production

```yaml
services:
  backend:
    container_name: sirius-backend
    ports: "3001:3001"
    depends_on: mysql-db
    
  frontend:
    container_name: sirius-frontend
    ports: "3000:3000"
    depends_on: backend
    
  mysql-db:
    container_name: sirius-mysql
    ports: "3306:3306"
```

### 11.2 Variables de Entorno

**Backend (.env):**
```env
NODE_ENV=production
PORT=3001
DB_HOST=mysql-db
DB_USER=root
DB_PASSWORD=****
DB_NAME=sirius_restaurant
DB_PORT=3306
JWT_SECRET=****
CORS_ORIGIN=http://62.146.231.110:3000
```

**Frontend (.env):**
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://62.146.231.110:3001/api
```

### 11.3 Docker Hub

```
Imagen: 1006946898/restaurant-system:latest
```

---

## 📌 12. DATOS INICIALES DEL SISTEMA

### 12.1 Usuarios por Defecto

| Usuario | Email | Rol | Contraseña |
|---------|-------|-----|------------|
| Administrador Sistema | admin@sirius.com | administrador | password |
| María García | maria@sirius.com | mesero | password |
| Carlos Rodríguez | carlos@sirius.com | cajero | password |
| Ana Martínez | ana@sirius.com | cocinero | password |
| Luis Pérez | luis@sirius.com | mesero | password |

### 12.2 Categorías del Menú

1. Entradas
2. Platos Principales
3. Postres
4. Bebidas
5. Sopas
6. Acompañamientos
7. Especiales
8. Infantil

### 12.3 Productos Destacados

| Producto | Precio (COP) | Categoría |
|----------|--------------|-----------|
| Mamona a la Llanera | $35,000 | Platos Principales |
| Bandeja Paisa | $32,000 | Platos Principales |
| Sancocho de Gallina | $25,000 | Sopas |
| Pescado a la Plancha | $28,000 | Platos Principales |
| Tamal Tolimense | $18,000 | Platos Principales |

### 12.4 Configuración del Restaurante

| Configuración | Valor |
|---------------|-------|
| Nombre | Sirius Cocina Ancestral |
| Tasa de Impuesto | 19% |
| Propina de Servicio | 10% |
| Moneda | COP (Peso Colombiano) |
| Zona Horaria | America/Bogota |
| Máximo de Mesas | 20 |
| Teléfono | +57 123 456 7890 |
| Dirección | Calle Principal #123, Mocoa, Putumayo |

---

## 📌 13. FLUJOS DE TRABAJO PRINCIPALES

### 13.1 Flujo de Pedido Completo

```
1. MESERO: Selecciona mesa libre
   └─> Sistema crea orden (order.create)
   
2. MESERO: Agrega productos al pedido
   └─> Sistema actualiza items (order.addItem)
   └─> WebSocket notifica a cocina (new-order)
   
3. COCINERO: Ve pedido en pantalla
   └─> Marca items en preparación (kitchen.updateStatus)
   └─> WebSocket notifica a mesero (order-status-update)
   
4. COCINERO: Completa preparación
   └─> Marca items como listos
   └─> WebSocket notifica a mesero y cajero
   
5. CAJERO: Procesa el pago
   └─> Registra pago (cashier.registerPayment)
   └─> Genera factura (invoice.create)
   └─> Cierra orden (order.close)
   └─> Libera mesa automáticamente
   └─> WebSocket notifica a todos (payment-processed)
```

### 13.2 Flujo de Respaldo de BD

```
1. ADMIN: Solicita respaldo
2. Sistema verifica rol (solo administrador)
3. Ejecuta mysqldump
4. Guarda archivo .sql con timestamp
5. Registra en backup-history.json
6. Retorna información del respaldo
```

---

## 📌 14. MANEJO DE ERRORES

### 14.1 Backend

- **errorHandler middleware**: Captura y formatea errores
- **Logger Winston**: Registra errores en archivos
- **Respuestas estandarizadas**: `{ success: false, error: "mensaje" }`

### 14.2 Frontend

- **useApi hook**: 
  - Retry automático en rate limiting (backoff exponencial)
  - Retry en deadlocks de BD
  - Redirección a login en errores de token
- **Sonner/Toast**: Notificaciones visuales de errores

---

## 📌 15. TESTING

### 15.1 Tests Disponibles

| Archivo | Propósito |
|---------|-----------|
| `auth.test.js` | Tests de autenticación |
| `kitchen.test.js` | Tests de módulo cocina |
| `notifications.test.js` | Tests de notificaciones |
| `orders.test.js` | Tests de pedidos |

### 15.2 Herramientas

- **Jest**: Framework de testing
- **Supertest**: Testing de endpoints HTTP

---

## 📌 16. CONCLUSIONES

### Fortalezas del Sistema:
✅ Arquitectura moderna y escalable
✅ Comunicación en tiempo real eficiente
✅ Seguridad robusta con JWT y rate limiting
✅ UI/UX intuitiva con componentes accesibles
✅ Código tipado con TypeScript
✅ Dockerizado para fácil deployment
✅ Sistema de backups integrado

### Áreas de Mejora Potencial:
- Implementar PWA para uso offline
- Agregar sistema de reservas
- Integrar con plataformas de delivery
- Implementar analytics avanzados
- Agregar soporte multi-idioma

---

## 📌 17. COMANDOS ÚTILES

### Backend
```bash
cd backend
pnpm install          # Instalar dependencias
pnpm run dev          # Desarrollo con nodemon
pnpm run start        # Producción
pnpm run test         # Ejecutar tests
```

### Frontend
```bash
cd frontend
pnpm install          # Instalar dependencias
pnpm run dev          # Desarrollo
pnpm run build        # Build de producción
pnpm run start        # Iniciar producción
```

### Docker
```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.production.yml up -d

# Ver logs
docker-compose logs -f

# Reconstruir
docker-compose up -d --build
```

---

**Documento generado para sustentación del proyecto Zetban x**
**Sistema de Gestión**
**Fecha: Noviembre 2025**