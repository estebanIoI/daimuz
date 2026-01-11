import type { MenuItem, User, SalesData, ProductSales, TablePerformance, PaymentMethodSummary } from "@/types"

export const initialMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Arepa de Chócolo",
    price: 8500,
    category: "Ancestrales",
    category_id: 1,
    category_name: "Ancestrales",
    description: "Arepa tradicional de maíz tierno con queso campesino",
    available: true,
  },
  {
    id: 2,
    name: "Sancocho de Gallina",
    price: 18000,
    category: "Ancestrales",
    category_id: 1,
    category_name: "Ancestrales",
    description: "Sancocho tradicional con gallina criolla y verduras frescas",
    available: true,
  },
  {
    id: 3,
    name: "Mute Santandereano",
    price: 16000,
    category: "Ancestrales",
    category_id: 1,
    category_name: "Ancestrales",
    description: "Sopa tradicional con maíz, frijoles y carne de cerdo",
    available: true,
  },
  {
    id: 4,
    name: "Chicha de Maíz",
    price: 4500,
    category: "Bebidas",
    category_id: 2,
    category_name: "Bebidas",
    description: "Bebida ancestral fermentada de maíz",
    available: true,
  },
  {
    id: 5,
    name: "Agua de Panela",
    price: 3500,
    category: "Bebidas",
    category_id: 2,
    category_name: "Bebidas",
    description: "Bebida caliente tradicional con panela y limón",
    available: false,
  },
  {
    id: 6,
    name: "Postre de Natas",
    price: 6500,
    category: "Postres",
    category_id: 3,
    category_name: "Postres",
    description: "Postre tradicional con natas y dulce de leche",
    available: true,
  },
  {
    id: 7,
    name: "Tamal Tolimense",
    price: 12000,
    category: "Ancestrales",
    category_id: 1,
    category_name: "Ancestrales",
    description: "Tamal tradicional envuelto en hoja de plátano",
    available: true,
  },
  {
    id: 8,
    name: "Mazamorra Chiquita",
    price: 5500,
    category: "Postres",
    category_id: 3,
    category_name: "Postres",
    description: "Postre de maíz con leche y canela",
    available: true,
  },
]

export const initialUsers: User[] = [
  {
    id: 1,
    name: "Juan Pérez",
    email: "admin@sirius.com",
    role: "administrador",
    active: true,
    lastLogin: "2024-01-15 10:30",
  },
  {
    id: 2,
    name: "María García",
    email: "mesero@sirius.com",
    role: "mesero",
    active: true,
    lastLogin: "2024-01-15 09:15",
  },
  {
    id: 3,
    name: "Carlos López",
    email: "cajero@sirius.com",
    role: "cajero",
    active: true,
    lastLogin: "2024-01-14 18:45",
  },
  {
    id: 4,
    name: "Ana Rodríguez",
    email: "cocinero@sirius.com",
    role: "cocinero",
    active: true,
    lastLogin: "2024-01-10 14:20",
  },
]

export const salesData: SalesData[] = [
  { date: "2024-01-15", total: 450500, orders: 25, table: 1 },
  { date: "2024-01-14", total: 380250, orders: 20, table: 2 },
  { date: "2024-01-13", total: 520750, orders: 30, table: 3 },
  { date: "2024-01-12", total: 290000, orders: 15, table: 4 },
  { date: "2024-01-11", total: 610250, orders: 35, table: 5 },
]

export const productSalesData: ProductSales[] = [
  { id: 1, name: "Arepa de Chócolo", category: "Ancestrales", unitsSold: 150, revenue: 1275000 },
  { id: 2, name: "Sancocho de Gallina", category: "Ancestrales", unitsSold: 90, revenue: 1620000 },
  { id: 3, name: "Chicha de Maíz", category: "Bebidas", unitsSold: 200, revenue: 900000 },
  { id: 4, name: "Tamal Tolimense", category: "Ancestrales", unitsSold: 70, revenue: 840000 },
  { id: 5, name: "Postre de Natas", category: "Postres", unitsSold: 110, revenue: 715000 },
  { id: 6, name: "Mute Santandereano", category: "Ancestrales", unitsSold: 60, revenue: 960000 },
  { id: 7, name: "Agua de Panela", category: "Bebidas", unitsSold: 80, revenue: 280000 },
  { id: 8, name: "Mazamorra Chiquita", category: "Postres", unitsSold: 50, revenue: 275000 },
]

export const tablePerformanceData: TablePerformance[] = [
  { id: 1, tableNumber: 1, ordersServed: 30, totalRevenue: 750000, avgOrderValue: 25000 },
  { id: 2, tableNumber: 2, ordersServed: 45, totalRevenue: 1100000, avgOrderValue: 24444 },
  { id: 3, tableNumber: 3, ordersServed: 20, totalRevenue: 500000, avgOrderValue: 25000 },
  { id: 4, tableNumber: 4, ordersServed: 38, totalRevenue: 920000, avgOrderValue: 24210 },
  { id: 5, tableNumber: 5, ordersServed: 25, totalRevenue: 600000, avgOrderValue: 24000 },
  { id: 6, tableNumber: 6, ordersServed: 15, totalRevenue: 350000, avgOrderValue: 23333 },
  { id: 7, tableNumber: 7, ordersServed: 50, totalRevenue: 1300000, avgOrderValue: 26000 },
  { id: 8, tableNumber: 8, ordersServed: 22, totalRevenue: 530000, avgOrderValue: 24090 },
]

export const paymentMethodSummary: PaymentMethodSummary[] = [
  { method: "Efectivo", totalRevenue: 5200000, transactions: 120 },
  { method: "Tarjeta", totalRevenue: 7800000, transactions: 150 },
  { method: "Nequi", totalRevenue: 3500000, transactions: 80 },
]
