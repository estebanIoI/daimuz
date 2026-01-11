export interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  category: string
  category_id: number
  category_name: string
  image_url?: string
  available: boolean
  preparation_time?: number
}

export interface OrderItem {
  id: number
  menuItem: MenuItem
  quantity: number
  status?: 'pendiente' | 'preparacion' | 'listo' | 'entregado'
  notes?: string
}

export interface Table {
  id: number
  number: number
  status: "libre" | "ocupada"
  orders: OrderItem[]
  total: number
  waiter?: string
  orderId?: number // ID de la orden activa en el backend
  tableNotes?: string // Notas generales de la mesa
}

export interface User {
  id: number
  name: string
  email: string
  role: "administrador" | "mesero" | "cajero" | "cocinero"
  active: boolean
  lastLogin?: string
}

export interface SalesData {
  date: string
  total: number
  orders: number
  table: number
}

export interface Category {
  id: number
  name: string
  description?: string
}

export interface ProductForm {
  name: string
  price: string
  category: string
  description: string
  available: boolean
  image_url: string
  preparation_time: string
}

export interface UserForm {
  name: string
  email: string
  role: User["role"]
  active: boolean
}

export interface KitchenOrder {
  id: number
  tableNumber: number
  items: KitchenOrderItem[]
  status: "pendiente" | "preparacion" | "listo"
  waiter: string
  time: string
  priority: "normal" | "alta"
}

export interface KitchenOrderItem {
  id?: number
  name: string
  quantity: number
  prevQuantity?: number // Cantidad anterior para detectar aumentos
  notes?: string
  image_url?: string // URL de la imagen del producto
  status?: "pendiente" | "en preparación" | "servido"
  isNew?: boolean // Indica si es un producto recién agregado
  wasServed?: boolean // Indica si alguna vez fue servido
  addedAt?: string // Timestamp de cuando se agregó
}

export interface ActiveOrder {
  id: number
  tableNumber: number
  total: number
  status: "pendiente" | "listo"
  items: string[]
  waiter: string
  time: string
}

export interface Payment {
  id: number
  tableNumber: number
  total: number
  method: "efectivo" | "tarjeta" | "nequi"
  time: string
  waiter: string
  cashier?: string
  transaction_id?: string
}

export interface ProductSales {
  id: number
  name: string
  category: string
  unitsSold: number
  revenue: number
}

export interface TablePerformance {
  id: number
  tableNumber: number
  ordersServed: number
  totalRevenue: number
  avgOrderValue: number
}

export interface PaymentMethodSummary {
  method: string
  totalRevenue: number
  transactions: number
}
