"use client"

import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/useApi"
import { useCurrentTime } from "@/hooks/useCurrentTime"
import { useLastUpdate } from "@/hooks/useLastUpdate"
import { CreditCard, DollarSign, TrendingUp, Receipt, AlertCircle, Smartphone, Banknote, RefreshCw, Eye, FileText, Settings, Save, X, Users, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/common/Header"
import { StatsCard } from "@/components/common/StatsCard"
import { PaymentModal } from "@/components/cajero/PaymentModal"
import { TableGuestsModal } from "@/components/cajero/TableGuestsModal"
import { InvoiceCard } from "@/components/dashboard/InvoiceCard"
import { InvoiceDetailsModal } from "@/components/dashboard/InvoiceDetailsModal"
import ClientOnly from "@/components/ClientOnly"
import type { ActiveOrder, Payment } from "@/types"

// Extender la interfaz ActiveOrder para incluir nuevos campos
interface ExtendedActiveOrder extends ActiveOrder {
  tableId?: number;
  itemCount?: number;
  totalQuantity?: number;
  guestCount?: number;
}

// Definir interfaz para factura
interface InvoiceItem {
  order_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  menu_item_id: number;
  menu_item_name: string;
  description?: string;
  category_name: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  table_number: number;
  waiter_name: string;
  cashier_name: string;
  subtotal: number;
  total: number;
  payment_method: 'efectivo' | 'tarjeta' | 'nequi' | 'transferencia';
  transaction_id?: string;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
}

// Función helper para formatear precios en formato colombiano
const formatCOP = (amount: number) => {
  return Math.round(amount).toLocaleString('es-CO')
}

export default function CajeroPanel() {
  const [activeOrders, setActiveOrders] = useState<ExtendedActiveOrder[]>([])
  const [userName, setUserName] = useState<string>("Usuario")
  const [payments, setPayments] = useState<Payment[]>([])
  
  // Estado para modal de clientes de mesa
  const [isTableGuestsModalOpen, setIsTableGuestsModalOpen] = useState(false)
  const [selectedTableForGuests, setSelectedTableForGuests] = useState<{
    tableId: number;
    tableNumber: number;
    orderId: number;
  } | null>(null)
  
  const [dailyStats, setDailyStats] = useState({
    daily_sales: 0,
    total_orders: 0,
    cash_sales: 0,
    card_sales: 0,
    nequi_sales: 0,
    pending_orders: 0,
    pending_amount: 0
  })
  const { lastUpdate, updateTimestamp } = useLastUpdate()
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(false)
  const { apiCall } = useApi()

  const fetchOrders = useCallback(async () => {
    try {
      // Verificar token antes de hacer las llamadas
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado, redirigiendo al login")
        window.location.href = "/login"
        return
      }

      console.log("🔄 Obteniendo órdenes activas del cajero...")
      const orders = await apiCall("cashier.getActiveOrders")
      const formatted = orders.map((o: any) => ({
        id: o.order_id,
        tableNumber: o.table_number,
        tableId: o.table_id,
        waiter: o.waiter_name,
        total: Math.round(parseFloat(o.total) || 0), // Redondear y convertir a entero para formato COP
        status: "listo", // Puedes ajustar si tienes un estado real
        items: [], // Si necesitas mostrar productos, debes expandir el query
        itemCount: o.item_count || 0,
        totalQuantity: o.total_quantity || 0,
        guestCount: o.guest_count || 0,
      }))
      setActiveOrders(formatted)
      setIsRateLimited(false) // Reset rate limit flag on success
      console.log("✅ Órdenes activas actualizadas:", formatted.length)
    } catch (error: any) {
      console.error("❌ Error cargando órdenes activas:", error)
      
      // Manejar errores de autenticación
      if (error.message && error.message.includes("Token")) {
        console.warn("❌ Error de autenticación, redirigiendo al login")
        localStorage.removeItem("token")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        window.location.href = "/login"
        return
      }
      
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        setIsRateLimited(true)
        console.warn("⚠️ Rate limiting activo para fetchOrders")
        return // No propagar el error
      }
      
      // Solo mostrar error si no es rate limiting
      if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
        console.error("Error cargando pedidos activos:", error)
      }
    }
  }, [apiCall])

  const fetchPayments = useCallback(async () => {
    try {
      const data = await apiCall("cashier.getPaymentHistory")
      const formatted = data.map((p: any) => ({
        id: p.id,
        tableNumber: p.table_number || 0,
        method: p.method || "efectivo",
        total: Math.round(parseFloat(p.amount) || 0), // Redondear y convertir a entero para formato COP
        time: new Date(p.created_at).toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        waiter: p.waiter_name || "Sin asignar",
        cashier: p.cashier_name || "Sin asignar",
        transaction_id: p.transaction_id || "N/A"
      }))
      setPayments(formatted)
      setIsRateLimited(false) // Reset rate limit flag on success
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        setIsRateLimited(true)
        console.warn("⚠️ Rate limiting activo para fetchPayments")
        return // No propagar el error
      }
      
      // Solo mostrar error si no es rate limiting
      if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
        console.error("Error cargando historial de pagos:", error)
      }
      // Si es error de autenticación, propagar el error
      if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
        throw error
      }
    }
  }, [apiCall])

  const fetchDailyStats = useCallback(async () => {
    try {
      const stats = await apiCall("cashier.getDailyStats")
      // Redondear todos los valores monetarios para formato COP
      setDailyStats({
        daily_sales: Math.round(parseFloat(stats.daily_sales) || 0),
        total_orders: stats.total_orders || 0,
        cash_sales: Math.round(parseFloat(stats.cash_sales) || 0),
        card_sales: Math.round(parseFloat(stats.card_sales) || 0),
        nequi_sales: Math.round(parseFloat(stats.nequi_sales) || 0),
        pending_orders: stats.pending_orders || 0,
        pending_amount: Math.round(parseFloat(stats.pending_amount) || 0)
      })
      setIsRateLimited(false) // Reset rate limit flag on success
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        setIsRateLimited(true)
        console.warn("⚠️ Rate limiting activo para fetchDailyStats")
        return // No propagar el error
      }
      
      // Solo mostrar error si no es rate limiting
      if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
        console.error("Error cargando estadísticas diarias:", error)
      }
      // Si es error de autenticación, propagar el error
      if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
        throw error
      }
    }
  }, [apiCall])

  // Función para validar autenticación
  const isAuthenticated = useCallback(() => {
    const userRole = localStorage.getItem("userRole")
    const token = localStorage.getItem("token")
    
    console.log("🔍 [CAJERO] Verificando autenticación:", {
      userRole,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      resultado: userRole === "cajero" && !!token
    })
    
    return userRole === "cajero" && !!token
  }, [])

  // Función para actualizar todos los datos de forma escalonada
  const refreshData = useCallback(async () => {
    // Solo actualizar si el usuario está autenticado
    if (!isAuthenticated()) {
      return
    }

    // Si estamos en rate limiting, esperar más tiempo
    if (isRateLimited) {
      console.log("⏳ Pausando actualizaciones debido a rate limiting")
      return
    }

    try {
      setIsRefreshing(true)
      console.log("🔄 Actualizando datos del cajero...")
      updateTimestamp()
      
      // Funciones internas para evitar problemas de dependencias
      const fetchOrdersInternal = async () => {
        try {
          const orders = await apiCall("cashier.getActiveOrders")
          const formatted = orders.map((o: any) => ({
            id: o.order_id,
            tableNumber: o.table_number,
            tableId: o.table_id,
            waiter: o.waiter_name,
            total: Math.round(parseFloat(o.total) || 0),
            status: "listo",
            items: [],
            itemCount: o.item_count || 0,
            totalQuantity: o.total_quantity || 0,
            guestCount: o.guest_count || 0,
          }))
          setActiveOrders(formatted)
          setIsRateLimited(false)
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
            setIsRateLimited(true)
            console.warn("⚠️ Rate limiting activo para fetchOrders")
            return
          }
          if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
            console.error("Error cargando pedidos activos:", error)
          }
          if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
            throw error
          }
        }
      }

      const fetchDailyStatsInternal = async () => {
        try {
          const stats = await apiCall("cashier.getDailyStats")
          setDailyStats({
            daily_sales: Math.round(parseFloat(stats.daily_sales) || 0),
            total_orders: stats.total_orders || 0,
            cash_sales: Math.round(parseFloat(stats.cash_sales) || 0),
            card_sales: Math.round(parseFloat(stats.card_sales) || 0),
            nequi_sales: Math.round(parseFloat(stats.nequi_sales) || 0),
            pending_orders: stats.pending_orders || 0,
            pending_amount: Math.round(parseFloat(stats.pending_amount) || 0)
          })
          setIsRateLimited(false)
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
            setIsRateLimited(true)
            console.warn("⚠️ Rate limiting activo para fetchDailyStats")
            return
          }
          if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
            console.error("Error cargando estadísticas diarias:", error)
          }
          if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
            throw error
          }
        }
      }

      const fetchPaymentsInternal = async () => {
        try {
          const data = await apiCall("cashier.getPaymentHistory")
          const formatted = data.map((p: any) => ({
            id: p.id,
            tableNumber: p.table_number || 0,
            method: p.method || "efectivo",
            total: Math.round(parseFloat(p.amount) || 0),
            time: new Date(p.created_at).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            waiter: p.waiter_name || "Sin asignar",
            cashier: p.cashier_name || "Sin asignar",
            transaction_id: p.transaction_id || "N/A"
          }))
          setPayments(formatted)
          setIsRateLimited(false)
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
            setIsRateLimited(true)
            console.warn("⚠️ Rate limiting activo para fetchPayments")
            return
          }
          if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
            console.error("Error cargando historial de pagos:", error)
          }
          if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
            throw error
          }
        }
      }
      
      // Actualizar de forma escalonada para evitar rate limiting
      // Primero las órdenes activas (más importante)
      await fetchOrdersInternal()
      
      // Esperar 2 segundos antes de la siguiente llamada
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Luego las estadísticas
      await fetchDailyStatsInternal()
      
      // Esperar otros 2 segundos antes de la última llamada
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Finalmente el historial de pagos
      await fetchPaymentsInternal()
      
      console.log("✅ Datos actualizados correctamente")
    } catch (error) {
      console.error("Error en refreshData:", error)
      
      // Si hay error de autenticación, redirigir al login
      if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [apiCall, isAuthenticated, isRateLimited]) // Dependencias mínimas necesarias

  // Función para actualizar solo datos críticos (más frecuente)
  const refreshCriticalData = useCallback(async () => {
    if (!isAuthenticated() || isRateLimited) {
      return
    }

    try {
      // Función interna para órdenes activas
      const fetchOrdersInternal = async () => {
        try {
          const orders = await apiCall("cashier.getActiveOrders")
          const formatted = orders.map((o: any) => ({
            id: o.order_id,
            tableNumber: o.table_number,
            tableId: o.table_id,
            waiter: o.waiter_name,
            total: Math.round(parseFloat(o.total) || 0),
            status: "listo",
            items: [],
            itemCount: o.item_count || 0,
            totalQuantity: o.total_quantity || 0,
            guestCount: o.guest_count || 0,
          }))
          setActiveOrders(formatted)
          setIsRateLimited(false)
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
            setIsRateLimited(true)
            console.warn("⚠️ Rate limiting activo para fetchOrders")
            return
          }
          if (!(error instanceof Error && error.message.includes("Too Many Requests"))) {
            console.error("Error cargando pedidos activos:", error)
          }
          if (error instanceof Error && error.message.includes("Token de acceso requerido")) {
            throw error
          }
        }
      }

      // Solo actualizar órdenes activas y estadísticas básicas
      await fetchOrdersInternal()
      updateTimestamp()
    } catch (error) {
      console.error("Error en refreshCriticalData:", error)
    }
  }, [apiCall, isAuthenticated, isRateLimited]) // Dependencias mínimas necesarias

  // Función principal para obtener datos del cajero
  const fetchCajeroData = useCallback(async () => {
    console.log("🔍 [CAJERO] fetchCajeroData llamado, verificando autenticación...")
    
    if (!isAuthenticated()) {
      console.log("❌ [CAJERO] No está autenticado, saltando fetchCajeroData")
      
      // Debug adicional: Verificar valores específicos
      const userRole = localStorage.getItem("userRole")
      const token = localStorage.getItem("token")
      const userEmail = localStorage.getItem("userEmail")
      
      console.log("🔍 [CAJERO] Valores de localStorage:", {
        userRole,
        userEmail,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      })
      
      return
    }
    
    try {
      setLoading(true)
      console.log("🔄 [CAJERO] Iniciando fetchCajeroData...")
      
      // Verificar token antes de hacer las llamadas
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado, redirigiendo al login")
        window.location.href = "/login"
        return
      }

      console.log("🔄 [CAJERO] Obteniendo datos del cajero... timestamp:", new Date().toISOString())

      // Hacer las llamadas en paralelo para ser más rápido
      const [ordersResult, statsResult, paymentsResult, invoicesResult] = await Promise.allSettled([
        apiCall("cashier.getActiveOrders"),
        apiCall("cashier.getDailyStats"),
        apiCall("cashier.getPaymentHistory"),
        apiCall("invoice.getAll", { limit: 50, date_from: new Date().toISOString().split('T')[0], date_to: new Date().toISOString().split('T')[0] })
      ])

      console.log("📊 [CAJERO] Resultados de Promise.allSettled:", {
        orders: ordersResult.status,
        stats: statsResult.status,
        payments: paymentsResult.status,
        invoices: invoicesResult.status
      })

      // Procesar órdenes
      if (ordersResult.status === 'fulfilled') {
        const formatted = ordersResult.value.map((o: any) => ({
          id: o.order_id,
          tableNumber: o.table_number,
          tableId: o.table_id,
          waiter: o.waiter_name,
          total: Math.round(parseFloat(o.total) || 0),
          status: "listo",
          items: [],
          itemCount: o.item_count || 0,
          totalQuantity: o.total_quantity || 0,
          guestCount: o.guest_count || 0,
        }))
        setActiveOrders(formatted)
        console.log("✅ [CAJERO] Órdenes activas actualizadas:", formatted.length, "- timestamp:", new Date().toISOString())
      } else {
        console.error("❌ [CAJERO] Error al obtener órdenes:", ordersResult.reason)
      }

      // Procesar estadísticas
      if (statsResult.status === 'fulfilled') {
        setDailyStats({
          daily_sales: Math.round(parseFloat(statsResult.value.daily_sales) || 0),
          total_orders: statsResult.value.total_orders || 0,
          cash_sales: Math.round(parseFloat(statsResult.value.cash_sales) || 0),
          card_sales: Math.round(parseFloat(statsResult.value.card_sales) || 0),
          nequi_sales: Math.round(parseFloat(statsResult.value.nequi_sales) || 0),
          pending_orders: statsResult.value.pending_orders || 0,
          pending_amount: Math.round(parseFloat(statsResult.value.pending_amount) || 0)
        })
        console.log("✅ [CAJERO] Estadísticas actualizadas - timestamp:", new Date().toISOString())
      } else {
        console.error("❌ [CAJERO] Error al obtener estadísticas:", statsResult.reason)
      }

      // Procesar historial de pagos
      if (paymentsResult.status === 'fulfilled') {
        const formatted = paymentsResult.value.map((p: any) => ({
          id: p.id,
          tableNumber: p.table_number || 0,
          method: p.method || "efectivo",
          total: Math.round(parseFloat(p.amount) || 0),
          time: new Date(p.created_at).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          waiter: p.waiter_name || "Sin asignar",
          cashier: p.cashier_name || "Sin asignar",
          transaction_id: p.transaction_id || "N/A"
        }))
        setPayments(formatted)
        console.log("✅ [CAJERO] Historial de pagos actualizado")
      } else {
        console.error("❌ [CAJERO] Error al obtener pagos:", paymentsResult.reason)
      }

      // Procesar facturas del día
      if (invoicesResult.status === 'fulfilled') {
        const invoices = invoicesResult.value?.invoices || []
        setDailyInvoices(invoices)
        console.log("✅ [CAJERO] Facturas del día actualizadas:", invoices.length)
      } else {
        console.error("❌ [CAJERO] Error al obtener facturas:", invoicesResult.reason)
      }
      
      // SIEMPRE actualizar el timestamp, independientemente de si hay errores
      updateTimestamp()
      console.log(`✅ [CAJERO] Timestamp actualizado FORZADAMENTE`)
      
      setIsRateLimited(false)
      console.log("✅ [CAJERO] fetchCajeroData completado exitosamente")

    } catch (error: any) {
      console.error("❌ [CAJERO] Error cargando datos del cajero:", error)
      
      // SIEMPRE actualizar el timestamp, incluso si hay errores
      updateTimestamp()
      console.log(`⚠️ [CAJERO] Timestamp actualizado después de error`)
      
      // Manejar errores de autenticación
      if (error.message && error.message.includes("Token")) {
        console.warn("❌ Error de autenticación, redirigiendo al login")
        localStorage.removeItem("token")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        window.location.href = "/login"
        return
      }

      if (error.message === "RATE_LIMIT_EXCEEDED") {
        setIsRateLimited(true)
        console.warn("⚠️ [CAJERO] Rate limiting activo, pero timestamp actualizado")
      }
    } finally {
      setLoading(false)
      console.log("🔄 [CAJERO] fetchCajeroData finalizado (finally)")
    }
  }, [isAuthenticated, apiCall])

  // Función para manejar clic manual del botón actualizar
  const handleManualRefresh = useCallback(() => {
    console.log("🖱️ Botón actualizar clickeado manualmente")
    console.log("Estado actual - isRateLimited:", isRateLimited, "loading:", loading)
    fetchCajeroData()
  }, [fetchCajeroData, isRateLimited, loading])

  // Escuchar eventos de actualización global de otras vistas
  useEffect(() => {
    console.log("🔧 Configurando listeners de notificación global en cajero...")
    
    const handleGlobalRefresh = (event: Event) => {
      const customEvent = event as CustomEvent
      const { source, timestamp, action, details } = customEvent.detail
      
      console.log(`📡 [CAJERO] Recibió evento globalRefresh:`, { source, action, timestamp, details, edad: Date.now() - timestamp })
      
      // Solo actualizar si el evento viene de otra vista y es reciente (menos de 5 segundos)
      if (source !== 'cajero' && Date.now() - timestamp < 5000) {
        console.log(`✅ [CAJERO] Procesando notificación: ${action} desde ${source}`, details)
        console.log(`🔄 [CAJERO] LLAMANDO fetchCajeroData() por notificación globalRefresh...`)
        fetchCajeroData().then(() => {
          console.log(`✅ [CAJERO] fetchCajeroData() completado por notificación globalRefresh`)
        }).catch(error => {
          console.error(`❌ [CAJERO] Error en fetchCajeroData() por notificación globalRefresh:`, error)
        })
      } else {
        console.log(`❌ [CAJERO] Ignoró notificación: source=${source}, edad=${Date.now() - timestamp}ms`)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      console.log(`📡 [CAJERO] Evento de localStorage detectado:`, { key: event.key, newValue: event.newValue })
      
      if (event.key === 'globalRefreshTrigger' && event.newValue) {
        console.log(`📡 [CAJERO] Es un evento globalRefreshTrigger:`, event.newValue)
        try {
          const refreshEvent = JSON.parse(event.newValue)
          console.log(`📡 [CAJERO] Evento parseado:`, refreshEvent)
          
          const edad = Date.now() - refreshEvent.timestamp
          console.log(`📡 [CAJERO] Verificando evento - source: ${refreshEvent.source}, edad: ${edad}ms`)
          
          if (refreshEvent.source !== 'cajero' && edad < 5000) {
            console.log(`✅ [CAJERO] Procesando notificación de storage: ${refreshEvent.action} desde ${refreshEvent.source}`, refreshEvent.details)
            console.log(`🔄 [CAJERO] LLAMANDO fetchCajeroData() por notificación storage...`)
            fetchCajeroData().then(() => {
              console.log(`✅ [CAJERO] fetchCajeroData() completado por notificación storage`)
            }).catch(error => {
              console.error(`❌ [CAJERO] Error en fetchCajeroData() por notificación storage:`, error)
            })
          } else {
            console.log(`❌ [CAJERO] Ignoró notificación de storage: source=${refreshEvent.source}, edad=${edad}ms`)
          }
        } catch (error) {
          console.error('[CAJERO] Error procesando evento de storage:', error)
        }
      }
    }

    // Registrar listeners
    window.addEventListener('globalRefresh', handleGlobalRefresh)
    window.addEventListener('storage', handleStorageChange)
    
    console.log("✅ [CAJERO] Listeners registrados correctamente")

    return () => {
      console.log("🔧 [CAJERO] Removiendo listeners de notificación global...")
      window.removeEventListener('globalRefresh', handleGlobalRefresh)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchCajeroData])

  // Efecto inicial para cargar datos
  useEffect(() => {
    fetchCajeroData()
  }, [fetchCajeroData])

  // Auto-refresh cada 6 segundos para mayor responsividad
  useEffect(() => {
    if (!autoRefresh) {
      console.log("🔄 Auto-refresh desactivado")
      return
    }

    console.log("🔄 Configurando auto-refresh cada 6 segundos (mejorado)")
    
    const refreshTimer = setInterval(async () => {
      // Verificar token antes de hacer auto-refresh
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado durante auto-refresh")
        setAutoRefresh(false)
        return
      }
      
      // Debug: Mostrar timestamp antes del refresh
      const timestamp = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
      console.log(`🔄 [${timestamp}] Ejecutando auto-refresh cajero...`)
      
      try {
        await fetchCajeroData()
        console.log(`✅ [${timestamp}] Auto-refresh completado exitosamente`)
      } catch (error) {
        console.error(`❌ [${timestamp}] Error durante auto-refresh:`, error)
        
        // Si hay error de autenticación, desactivar auto-refresh
        if (error instanceof Error && error.message.includes("Token")) {
          console.warn(`❌ [${timestamp}] Desactivando auto-refresh por error de token`)
          setAutoRefresh(false)
        }
        
        // Si hay rate limiting, pausar temporalmente
        if (error instanceof Error && error.message.includes("RATE_LIMIT")) {
          console.warn(`⏳ [${timestamp}] Rate limit detectado, continuando auto-refresh`)
        }
      }
    }, 6000) // Reducido de 10 a 6 segundos

    return () => {
      console.log("🔄 Limpiando auto-refresh timer")
      clearInterval(refreshTimer)
    }
  }, [autoRefresh, fetchCajeroData])

  const [selectedOrder, setSelectedOrder] = useState<ActiveOrder | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "nequi">("efectivo")
  
  // Estados para manejar la factura
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [lastProcessedOrder, setLastProcessedOrder] = useState<ActiveOrder | null>(null)
  
  // Estados para facturas del día
  const [dailyInvoices, setDailyInvoices] = useState<Invoice[]>([])
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null)
  const [isInvoiceDetailsModalOpen, setIsInvoiceDetailsModalOpen] = useState(false)
  
  // Estados para configuración del nombre del restaurante
  const [restaurantName, setRestaurantName] = useState<string>("RESTAURANTE SIRIUS")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [tempRestaurantName, setTempRestaurantName] = useState<string>("")
  
  // Cargar nombre del restaurante desde localStorage al iniciar
  useEffect(() => {
    const savedName = localStorage.getItem("restaurantName")
    if (savedName) {
      setRestaurantName(savedName)
    }
  }, [])
  
  // Función para abrir modal de configuración
  const openConfigModal = () => {
    setTempRestaurantName(restaurantName)
    setIsConfigModalOpen(true)
  }
  
  // Función para guardar el nombre del restaurante
  const saveRestaurantName = () => {
    if (tempRestaurantName.trim()) {
      setRestaurantName(tempRestaurantName.trim())
      localStorage.setItem("restaurantName", tempRestaurantName.trim())
      setIsConfigModalOpen(false)
      console.log("✅ Nombre del restaurante guardado:", tempRestaurantName.trim())
    }
  }
  
  const currentTime = useCurrentTime(60000) // Actualizar cada minuto

  // Check authentication on component mount
  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const storedUserName = localStorage.getItem("userName")
    const storedUserEmail = localStorage.getItem("userEmail")
    
    if (!userRole || userRole !== "cajero") {
      window.location.href = "/login"
      return
    }
    
    // Set the user name from localStorage (fallback to email if name not available)
    if (storedUserName) {
      setUserName(storedUserName)
    } else if (storedUserEmail) {
      // Usar la parte antes del @ del email como fallback
      setUserName(storedUserEmail.split('@')[0])
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const openPaymentModal = (order: ExtendedActiveOrder) => {
    setSelectedOrder(order)
    setPaymentMethod("efectivo") // Default to cash for calculator
    setIsPaymentModalOpen(true)
  }

  // Función para abrir modal de clientes de mesa
  const openTableGuestsModal = (order: ExtendedActiveOrder) => {
    if (order.tableId) {
      setSelectedTableForGuests({
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        orderId: order.id
      })
      setIsTableGuestsModalOpen(true)
    }
  }

  // Callback cuando se completa un pago individual
  const handleGuestPaymentComplete = async (guestPaymentData: {
    orderId: number;
    guestId?: number;
    amount: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'nequi' | 'transferencia';
    items: InvoiceItem[];
  }) => {
    try {
      const currentDateTime = new Date().toISOString();
      // Enviar pago individual al backend (debe generar factura individual)
      const payload = {
        order_id: guestPaymentData.orderId,
        guest_id: guestPaymentData.guestId,
        payment_method: guestPaymentData.paymentMethod,
        amount_received: guestPaymentData.amount,
        closed_at: currentDateTime,
        items: guestPaymentData.items,
      };
      const paymentResponse = await apiCall("cashier.registerGuestPayment", payload);
      // Si el backend retorna la factura generada
      if (paymentResponse && paymentResponse.invoice) {
        setGeneratedInvoice(paymentResponse.invoice);
        setShowInvoice(true);
        setDailyInvoices(prev => [paymentResponse.invoice, ...prev]);
      }
      // Actualizar datos generales
      fetchCajeroData();
    } catch (error) {
      console.error("❌ Error procesando pago individual:", error);
      const errMsg = (error as any)?.message || "No se pudo registrar el pago individual.";
      alert(errMsg);
    }
  }

  const processPayment = useCallback(async () => {
    if (!selectedOrder) return

    try {
      const currentDateTime = new Date().toISOString()
      const payload = {
        order_id: selectedOrder.id,
        payment_method: paymentMethod,
        amount_received: selectedOrder.total,
        closed_at: currentDateTime, // Agregar fecha y hora de cierre
      }

      // Debug: Verificar que se está enviando el closed_at
      console.log("📅 Enviando payload con closed_at:", JSON.stringify(payload, null, 2))

      // Enviar pago al backend (que automáticamente crea la factura)
      const paymentResponse = await apiCall("cashier.registerPayment", payload)

      // Verificar si se retornó información de factura
      if (paymentResponse && paymentResponse.invoice) {
        setGeneratedInvoice(paymentResponse.invoice)
        setLastProcessedOrder(selectedOrder)
        setShowInvoice(true)
        console.log("✅ Factura obtenida desde registerPayment:", paymentResponse.invoice.invoice_number)
      } else {
        console.warn("⚠️ No se obtuvo factura desde registerPayment")
        
        // Fallback: intentar obtener la factura por order_id
        try {
          const invoicesResponse = await apiCall("invoice.getAll")
          // El API retorna { invoices: [...] }, no un array directamente
          const invoicesList = invoicesResponse?.invoices || invoicesResponse || []
          const invoicesArray = Array.isArray(invoicesList) ? invoicesList : []
          const orderInvoice = invoicesArray.find((inv: any) => inv.order_id === selectedOrder.id)
          if (orderInvoice) {
            setGeneratedInvoice(orderInvoice)
            setLastProcessedOrder(selectedOrder)
            setShowInvoice(true)
            console.log("✅ Factura encontrada como fallback:", orderInvoice.invoice_number)
          } else {
            console.warn("⚠️ No se pudo encontrar factura para la orden")
            alert("Pago procesado exitosamente. No se pudo obtener la factura automáticamente.")
          }
        } catch (fallbackError) {
          console.error("❌ Error en fallback de factura:", fallbackError)
          alert("Pago procesado exitosamente. No se pudo obtener la factura automáticamente.")
        }
      }

      // Actualizar UI: remover orden y cerrar modal
      setActiveOrders(prev => prev.filter((order) => order.id !== selectedOrder.id))
      setIsPaymentModalOpen(false)
      setSelectedOrder(null)

      // Actualizar datos después del pago
      setTimeout(() => {
        fetchCajeroData()
      }, 500) // Pequeño delay para asegurar que el backend procese el pago

      console.log(
        `✅ Pago registrado: Mesa ${selectedOrder.tableNumber} - $${formatCOP(selectedOrder.total)} (${paymentMethod}) - Cerrado: ${currentDateTime}`
      )
    } catch (error) {
      console.error("❌ Error procesando el pago:", error)
      const errMsg = (error as any)?.message || "No se pudo registrar el pago."
      alert(errMsg)
    }
  }, [selectedOrder, paymentMethod, apiCall, fetchCajeroData])

  // Función para manejar la impresión de factura
  const handlePrintInvoice = (invoice: Invoice) => {
    console.log("🖨️ Preparando impresión de factura:", invoice.invoice_number)
    
    // Crear contenido de impresión
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>${restaurantName}</h2>
          <h3>FACTURA: ${invoice.invoice_number}</h3>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p><strong>Mesa:</strong> ${invoice.table_number}</p>
          <p><strong>Mesero:</strong> ${invoice.waiter_name}</p>
          <p><strong>Cajero:</strong> ${invoice.cashier_name}</p>
          <p><strong>Fecha:</strong> ${new Date(invoice.created_at).toLocaleString('es-CO')}</p>
          <p><strong>Método de pago:</strong> ${invoice.payment_method.toUpperCase()}</p>
        </div>
        
        <div style="border-top: 1px solid #ccc; padding-top: 15px;">
          <h4>PRODUCTOS</h4>
          ${invoice.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${item.quantity}x ${item.menu_item_name}</span>
              <span>$${item.subtotal.toLocaleString('es-CO')}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span>TOTAL:</span>
            <span>$${invoice.total.toLocaleString('es-CO')}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px;">
          <p>¡Gracias por su visita!</p>
        </div>
      </div>
    `;
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }

  // Función para cerrar la vista de factura
  const handleCloseInvoice = () => {
    setShowInvoice(false)
    setGeneratedInvoice(null)
  }

  // Función para ver detalles de una factura del día
  const handleViewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoiceForDetails(invoice)
    setIsInvoiceDetailsModalOpen(true)
  }

  // Función para cerrar modal de detalles de factura
  const handleCloseInvoiceDetails = () => {
    setIsInvoiceDetailsModalOpen(false)
    setSelectedInvoiceForDetails(null)
  }

  // Usar datos del backend en lugar de calcularlos en el frontend
  const totalSales = dailyStats.daily_sales
  const totalPending = dailyStats.pending_amount

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <Header
          title=""
          subtitle={`💳 Panel Cajero ${isRateLimited ? "⚠️" : ""}`}
          userName={userName}
          userRole={isRateLimited ? "Cajero (Conexión limitada)" : "Cajero"}
          currentTime={currentTime}
          onLogout={handleLogout}
        />

        {/* Auto-refresh controls */}
        <div className="p-3 sm:p-4 lg:p-6 pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs ${autoRefresh ? "border-blue-500 text-blue-600" : "border-gray-300"}`}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Auto-actualizar</span>
                <span className="sm:hidden">Auto</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCajeroData}
                disabled={loading}
                className="border-green-500 text-green-600 text-xs"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Actualizar</span>
                <span className="sm:hidden">Sync</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openConfigModal}
                className="border-purple-500 text-purple-600 text-xs"
                title="Configurar nombre del restaurante"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Factura</span>
                <span className="sm:hidden">⚙️</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <p className="text-xs text-gray-500 text-left sm:text-right">
                Última actualización: {lastUpdate ? lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </p>
              {autoRefresh && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Auto-actualizando cada 6s</span>
                  <span className="sm:hidden">Auto 6s</span>
                </div>
              )}
            </div>
          </div>
        </div>

      <div className="p-3 sm:p-4 lg:p-6 pt-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <StatsCard
            title="Ventas del Día"
            value={`$${formatCOP(totalSales)}`}
            icon={DollarSign}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
          />
          <StatsCard
            title="Cuentas Cerradas"
            value={dailyStats.total_orders}
            icon={Receipt}
            iconColor="text-cyan-600"
            bgColor="bg-cyan-50"
            borderColor="border-cyan-200"
          />
          <StatsCard
            title="Pendientes"
            value={dailyStats.pending_orders}
            icon={AlertCircle}
            iconColor="text-teal-600"
            bgColor="bg-teal-50"
            borderColor="border-teal-200"
          />
          <StatsCard
            title="Por Cobrar"
            value={`$${formatCOP(totalPending)}`}
            icon={TrendingUp}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
          />
        </div>

        {/* Last Invoice Button */}
        {generatedInvoice && lastProcessedOrder && (
          <div className="mb-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Última factura: {generatedInvoice.invoice_number}
                      </p>
                      <p className="text-xs text-green-600">
                        Mesa {lastProcessedOrder.tableNumber} - ${formatCOP(generatedInvoice.total)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowInvoice(true)}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Ver Factura
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rate Limiting Warning */}
        {isRateLimited && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-yellow-800">
                  <strong>Conexión limitada:</strong> Las actualizaciones están temporalmente pausadas para evitar sobrecarga del servidor.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Última actualización: {lastUpdate ? lastUpdate.toLocaleTimeString("es-CO") : "--:--"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="active" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="active" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">🧾 Cuentas Activas</span>
                <span className="sm:hidden">🧾 Activas</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">📄 Facturas del Día</span>
                <span className="sm:hidden">📄 Facturas</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">📊 Historial de Pagos</span>
                <span className="sm:hidden">📊 Historial</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRateLimited || loading}
                className="text-xs flex items-center gap-1 w-full sm:w-auto"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <span className="text-xs text-gray-500 w-full sm:w-auto text-left sm:text-right">
                Última: {lastUpdate ? lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </span>
            </div>
          </div>

          <TabsContent value="active" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg lg:text-xl">Pedidos Listos para Cobrar</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {/* Mobile View */}
                <div className="block lg:hidden">
                  <div className="space-y-3 p-3 sm:p-4">
                    {activeOrders.map((order) => (
                      <Card key={order.id} className="border border-gray-200">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium text-sm sm:text-base">Mesa {order.tableNumber}</h3>
                              <p className="text-xs sm:text-sm text-gray-600">{order.waiter}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={order.status === "listo" ? "default" : "secondary"}
                                className={`text-xs ${order.status === "listo" ? "bg-green-500" : "bg-yellow-500"}`}
                              >
                                {order.status === "listo" ? "Listo" : "Pendiente"}
                              </Badge>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {order.totalQuantity || 0} items
                                </span>
                                {(order.guestCount || 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {order.guestCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-base sm:text-lg font-bold text-blue-600">${formatCOP(order.total)}</span>
                            </div>
                            <div className="flex gap-2">
                              {(order.guestCount || 0) > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTableGuestsModal(order)}
                                  className="flex-1 text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                                >
                                  <Users className="w-3 h-3 mr-1" />
                                  Ver Clientes
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => openPaymentModal(order)}
                                disabled={order.status === "pendiente"}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-xs"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Cobrar Todo
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Clientes</TableHead>
                        <TableHead>Mesero</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">Mesa {order.tableNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{order.totalQuantity || 0}</span>
                              <span className="text-xs text-gray-500">items</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(order.guestCount || 0) > 0 ? (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                <span className="font-medium text-purple-600">{order.guestCount}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Sin QR</span>
                            )}
                          </TableCell>
                          <TableCell>{order.waiter}</TableCell>
                          <TableCell>
                            <Badge
                              variant={order.status === "listo" ? "default" : "secondary"}
                              className={order.status === "listo" ? "bg-green-500" : "bg-yellow-500"}
                            >
                              {order.status === "listo" ? "Listo" : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">${formatCOP(order.total)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {(order.guestCount || 0) > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTableGuestsModal(order)}
                                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                >
                                  <Users className="w-4 h-4 mr-1" />
                                  Clientes
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => openPaymentModal(order)}
                                disabled={order.status === "pendiente"}
                                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Cobrar Todo
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4 sm:space-y-6">
            {/* Resumen de facturas del día */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Total Facturas</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">{dailyInvoices.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Total Facturado</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                        ${formatCOP(dailyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Promedio</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                        ${formatCOP(dailyInvoices.length > 0 ? dailyInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / dailyInvoices.length : 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-cyan-200 bg-cyan-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Items Vendidos</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        {dailyInvoices.reduce((sum, inv) => sum + (inv.items?.length || 0), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Facturas Generadas Hoy
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                {dailyInvoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {dailyInvoices.map((invoice) => (
                      <InvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onViewDetails={handleViewInvoiceDetails}
                        onPrint={handlePrintInvoice}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay facturas hoy
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Las facturas se generan automáticamente cuando se cobra un pedido.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Efectivo</p>
                      <p className="text-sm sm:text-base lg:text-xl font-bold text-gray-800 truncate">
                        ${formatCOP(dailyStats.cash_sales)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Tarjeta</p>
                      <p className="text-sm sm:text-base lg:text-xl font-bold text-gray-800 truncate">
                        ${formatCOP(dailyStats.card_sales)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Nequi</p>
                      <p className="text-sm sm:text-base lg:text-xl font-bold text-gray-800 truncate">
                        ${formatCOP(dailyStats.nequi_sales)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg lg:text-xl">Historial de Pagos del Día</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {/* Mobile View */}
                <div className="block lg:hidden">
                  <div className="space-y-3 p-3 sm:p-4">
                    {payments.map((payment) => (
                      <Card key={payment.id} className="border border-gray-200">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">Mesa {payment.tableNumber}</p>
                              <p className="text-xs text-gray-600">{payment.time}</p>
                            </div>
                            <p className="text-sm font-bold">${formatCOP(payment.total || 0)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-600">{payment.waiter}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                payment.method === "efectivo"
                                  ? "border-green-500 text-green-700"
                                  : payment.method === "tarjeta"
                                    ? "border-blue-500 text-blue-700"
                                    : "border-purple-500 text-purple-700"
                              }`}
                            >
                              {payment.method === "efectivo" && "💵"}
                              {payment.method === "tarjeta" && "💳"}
                              {payment.method === "nequi" && "📱"}
                              <span className="ml-1 hidden sm:inline">
                                {payment.method === "efectivo" && "Efectivo"}
                                {payment.method === "tarjeta" && "Tarjeta"}
                                {payment.method === "nequi" && "Nequi"}
                              </span>
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Mesero</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.time}</TableCell>
                          <TableCell className="font-medium">Mesa {payment.tableNumber}</TableCell>
                          <TableCell>{payment.waiter}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                payment.method === "efectivo"
                                  ? "border-green-500 text-green-700"
                                  : payment.method === "tarjeta"
                                    ? "border-blue-500 text-blue-700"
                                    : "border-purple-500 text-purple-700"
                              }
                            >
                              {payment.method === "efectivo" && "💵 Efectivo"}
                              {payment.method === "tarjeta" && "💳 Tarjeta"}
                              {payment.method === "nequi" && "📱 Nequi"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">${formatCOP(payment.total || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedOrder={selectedOrder}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onProcessPayment={processPayment}
      />

      {/* Invoice Display */}
      {showInvoice && generatedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-green-600" />
                Factura Generada
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCloseInvoice}
              >
                Cerrar
              </Button>
            </div>
            <div className="p-4">
              <InvoiceCard
                invoice={generatedInvoice}
                onPrint={handlePrintInvoice}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de factura del día */}
      <InvoiceDetailsModal
        invoice={selectedInvoiceForDetails}
        isOpen={isInvoiceDetailsModalOpen}
        onClose={handleCloseInvoiceDetails}
        onPrint={handlePrintInvoice}
      />

      {/* Modal de configuración del nombre del restaurante */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Configuración de Factura
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nombre del Restaurante
              </label>
              <Input
                value={tempRestaurantName}
                onChange={(e) => setTempRestaurantName(e.target.value)}
                placeholder="Ingrese el nombre del restaurante"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Este nombre aparecerá en el encabezado de las facturas impresas.
              </p>
            </div>
            
            {/* Vista previa */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
              <div className="text-center border-2 border-dashed border-gray-300 rounded p-3 bg-white">
                <h3 className="font-bold text-lg">{tempRestaurantName || "NOMBRE DEL RESTAURANTE"}</h3>
                <p className="text-sm text-gray-600">FACTURA: FAC-2024-001</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfigModalOpen(false)}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={saveRestaurantName}
              disabled={!tempRestaurantName.trim()}
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Clientes de Mesa */}
      {selectedTableForGuests && (
        <TableGuestsModal
          isOpen={isTableGuestsModalOpen}
          onClose={() => {
            setIsTableGuestsModalOpen(false)
            setSelectedTableForGuests(null)
          }}
          tableId={selectedTableForGuests.tableId}
          tableNumber={selectedTableForGuests.tableNumber}
          orderId={selectedTableForGuests.orderId}
          onPaymentComplete={handleGuestPaymentComplete}
        />
      )}
    </div>
    </ClientOnly>
  )
}
