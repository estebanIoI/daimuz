"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, CheckCircle, Timer, ChefHat, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/common/Header"
import { StatsCard } from "@/components/common/StatsCard"
import { OrderCard } from "@/components/cocinero/OrderCard"
import { useApi } from "@/hooks/useApi"
import { useCurrentTime } from "@/hooks/useCurrentTime"
import { useLastUpdate } from "@/hooks/useLastUpdate"
import ClientOnly from "@/components/ClientOnly"
import type { KitchenOrder } from "@/types"

export default function CocineroPanel() {
  const { apiCall } = useApi()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const currentTime = useCurrentTime(60000) // Actualizar cada minuto
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { lastUpdate, updateTimestamp } = useLastUpdate()
  const [authError, setAuthError] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false) // Flag para evitar actualizaciones simultáneas

  // Check authentication on component mount
  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const token = localStorage.getItem("token")
    
    console.log("🔍 Verificando autenticación:")
    console.log("- Role:", userRole)
    console.log("- Token presente:", !!token)
    
    if (!userRole || userRole !== "cocinero") {
      console.warn("❌ Role inválido, redirigiendo al login")
      setAuthError(true)
      setTimeout(() => window.location.href = "/login", 1000)
      return
    }
    
    if (!token) {
      console.warn("❌ Token no encontrado, redirigiendo al login")
      setAuthError(true)
      setTimeout(() => window.location.href = "/login", 1000)
      return
    }
    
    console.log("✅ Autenticación válida")
    setAuthError(false)
  }, [])

  // Función para verificar el estado del token
  const checkTokenStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ No hay token, redirigiendo al login")
        window.location.href = "/login"
        return false
      }
      
      // Verificar si el token es válido haciendo una llamada simple
      await apiCall("auth.me")
      return true
    } catch (error: any) {
      console.error("❌ Token inválido:", error)
      if (error.message && error.message.includes("Token")) {
        // Limpia el storage y redirige
        localStorage.removeItem("token")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        window.location.href = "/login"
        return false
      }
      return true // Otros errores no son de autenticación
    }
  }, [apiCall])

  // Function to fetch kitchen orders from API
  const fetchKitchenOrders = useCallback(async (skipLoading = false) => {
    // Evitar múltiples actualizaciones simultáneas
    if (isUpdating) {
      console.log("🔄 Saltando fetch porque ya hay una actualización en progreso")
      return
    }
    
    try {
      setIsUpdating(true)
      
      if (!skipLoading) {
        setLoading(true)
      }
      
      // Verificar token antes de hacer la llamada
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado, redirigiendo al login")
        window.location.href = "/login"
        return
      }
      
      // Solo log en carga inicial, no en auto-refresh
      if (!skipLoading) {
        console.log("🔄 Obteniendo órdenes de cocina...")
      }
      
      const kitchenData = await apiCall("kitchen.getAll")
      
      // Validate API response
      if (!Array.isArray(kitchenData)) {
        console.error("Invalid API response: expected array", kitchenData)
        return
      }
      
      // Solo log en carga inicial
      if (!skipLoading) {
        console.log("📋 Datos recibidos:", kitchenData.length, "items")
      }
      
      // Transform API data to match KitchenOrder interface
      const orderMap = new Map<number, KitchenOrder>()

      kitchenData.forEach((item: any) => {
        // Validate required fields
        if (!item.order_id || !item.table_number || !item.item_name) {
          console.warn("Skipping invalid item:", item)
          return
        }
        
        const orderId = item.order_id
        
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            id: orderId,
            tableNumber: item.table_number,
            items: [],
            status: "pendiente", // Default status
            waiter: item.waiter_name || "Sin asignar",
            time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
            priority: "normal",
          })
        }

        const order = orderMap.get(orderId)!
        
        // Validate and normalize status - usando los mismos tipos que KitchenOrderItem
        const normalizeStatus = (status: string): "pendiente" | "en preparación" | "servido" => {
          if (status === "preparacion") return "en preparación"
          if (status === "listo") return "servido"
          if (status === "entregado") return "servido"
          return "pendiente"
        }
        
        // Para detectar productos nuevos, usamos un enfoque más simple
        // basado en timestamp del backend en lugar de comparar con estado anterior
        const isNewItem = item.created_at ? 
          new Date(item.created_at).getTime() > (Date.now() - 300000) : // 5 minutos
          false
        
        order.items.push({
          id: item.item_id,
          name: item.item_name,
          quantity: item.quantity,
          notes: item.notes,
          image_url: item.item_image_url,
          status: normalizeStatus(item.status),
          isNew: isNewItem,
          addedAt: item.created_at
        })

        // Update order status based on items
        const allItems = order.items
        if (allItems.every(item => item.status === "servido")) {
          order.status = "listo"
        } else if (allItems.some(item => item.status === "en preparación")) {
          order.status = "preparacion"
        } else {
          order.status = "pendiente"
        }
      })

      const finalOrders = Array.from(orderMap.values())
      
      // Log de productos nuevos detectados solo en carga inicial
      if (!skipLoading) {
        const newItemsCount = finalOrders.reduce((count, order) => 
          count + order.items.filter(item => item.isNew).length, 0
        )
        
        if (newItemsCount > 0) {
          console.log(`🆕 Detectados ${newItemsCount} productos nuevos agregados recientemente`)
        }
        
        console.log("✅ Órdenes procesadas:", finalOrders.length)
      }
      
      setOrders(finalOrders)
      updateTimestamp()
    } catch (error: any) {
      console.error("❌ Error fetching kitchen orders:", error)
      
      // Manejar errores de autenticación
      if (error.message && error.message.includes("Token")) {
        console.warn("❌ Error de autenticación, redirigiendo al login")
        localStorage.removeItem("token")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        window.location.href = "/login"
        return
      }
      
      // Keep existing orders in case of error
    } finally {
      setIsUpdating(false)
      if (!skipLoading) {
        setLoading(false)
      }
    }
  }, [apiCall]) // REMOVIDO: isUpdating como dependencia (causa bucles infinitos)

  // Initial data fetch - simplificado para evitar bucles
  useEffect(() => {
    const initializeData = async () => {
      if (authError) return // No inicializar si hay error de autenticación
      
      try {
        console.log("🚀 Inicializando datos del cocinero...")
        const isTokenValid = await checkTokenStatus()
        if (isTokenValid) {
          await fetchKitchenOrders()
        }
      } catch (error) {
        console.error("❌ Error durante inicialización:", error)
        setLoading(false)
      }
    }
    
    // Solo ejecutar una vez cuando el componente se monta
    initializeData()
  }, []) // REMOVIDO: todas las dependencias para evitar re-ejecuciones

  const handleLogout = () => {
    console.log("🚪 Cerrando sesión...")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  // Auto-refresh con intervalo optimizado y jitter aleatorio
  useEffect(() => {
    if (!autoRefresh || isUpdating) return

    // Generar un intervalo aleatorio entre 8-12 segundos para mayor responsividad
    const baseInterval = 8000 // 8 segundos (reducido de 15)
    const randomDelay = Math.random() * 4000 // 0-4 segundos adicionales
    const interval = baseInterval + randomDelay

    const refreshTimer = setInterval(async () => {
      // No hacer auto-refresh si ya hay una actualización en progreso
      if (isUpdating) return
      
      // Verificar token antes de hacer auto-refresh
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado durante auto-refresh")
        setAutoRefresh(false)
        return
      }
      
      try {
        // Auto-refresh silencioso sin loading
        await fetchKitchenOrders(true)
      } catch (error) {
        console.error("❌ Error durante auto-refresh:", error)
        // Si hay error de autenticación, desactivar auto-refresh
        if (error instanceof Error && error.message.includes("Token")) {
          setAutoRefresh(false)
        }
      }
    }, interval)

    return () => clearInterval(refreshTimer)
  }, [autoRefresh, fetchKitchenOrders, isUpdating])

  // Función para notificar a otras vistas sobre cambios
  const triggerGlobalRefresh = useCallback((action: string, details?: any) => {
    // Usar localStorage para comunicar entre pestañas/vistas
    const refreshEvent = {
      type: 'ORDER_UPDATED',
      timestamp: Date.now(),
      source: 'cocinero',
      action: action,
      details: details
    }
    localStorage.setItem('globalRefreshTrigger', JSON.stringify(refreshEvent))
    
    // Disparar evento personalizado para pestañas de la misma sesión
    window.dispatchEvent(new CustomEvent('globalRefresh', { detail: refreshEvent }))
    
    console.log(`📡 Notificación enviada: ${action} desde cocinero`)
  }, [])

  // Escuchar eventos de actualización global de otras vistas (mesero y cajero)
  useEffect(() => {
    const handleGlobalRefresh = (event: Event) => {
      const customEvent = event as CustomEvent
      const { source, timestamp, action, details } = customEvent.detail
      
      // Solo actualizar si el evento viene de otra vista y es reciente (menos de 5 segundos)
      if (source !== 'cocinero' && Date.now() - timestamp < 5000) {
        console.log(`📡 Cocinero recibió notificación: ${action} desde ${source}`, details)
        fetchKitchenOrders(true) // Refresh silencioso
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'globalRefreshTrigger' && event.newValue) {
        try {
          const refreshEvent = JSON.parse(event.newValue)
          if (refreshEvent.source !== 'cocinero' && Date.now() - refreshEvent.timestamp < 5000) {
            console.log(`📡 Cocinero recibió notificación de storage: ${refreshEvent.action} desde ${refreshEvent.source}`, refreshEvent.details)
            fetchKitchenOrders(true) // Refresh silencioso
          }
        } catch (error) {
          console.error('Error procesando evento de storage:', error)
        }
      }
    }

    window.addEventListener('globalRefresh', handleGlobalRefresh)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('globalRefresh', handleGlobalRefresh)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchKitchenOrders])

  const updateOrderStatus = async (orderId: number, newStatus: KitchenOrder["status"]) => {
    // Evitar actualizaciones simultáneas
    if (isUpdating) return
    
    try {
      setIsUpdating(true)
      
      // Verificar token antes de hacer la llamada
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado, redirigiendo al login")
        window.location.href = "/login"
        return
      }
      
      // Find the order and update items accordingly
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        console.error("Order not found:", orderId)
        return
      }

      console.log("🔄 Actualizando estado de orden:", orderId, "->", newStatus)

      // Map status to item status - usando valores del ENUM de la base de datos
      let itemStatus = "pendiente"
      let uiStatus: "pendiente" | "en preparación" | "servido" = "pendiente"
      
      if (newStatus === "preparacion") {
        itemStatus = "preparacion"
        uiStatus = "en preparación"
      } else if (newStatus === "listo") {
        itemStatus = "listo"
        uiStatus = "servido"
      }

      console.log("📝 Estado del item a enviar:", itemStatus)
      console.log("🎨 Estado UI:", uiStatus)

      // Determinar qué items actualizar
      let itemsToUpdate: typeof order.items = []
      
      // Si hay productos nuevos y el estado anterior era "listo", solo actualizar los nuevos
      const hasNewItems = order.items.some(item => item.isNew)
      const wasOrderReady = order.status === "listo"
      
      if (hasNewItems && wasOrderReady && newStatus === "preparacion") {
        // Solo actualizar los productos nuevos
        itemsToUpdate = order.items.filter(item => item.isNew && item.id)
        console.log(`🆕 Actualizando solo productos nuevos: ${itemsToUpdate.length} items`)
      } else {
        // Actualizar todos los productos
        itemsToUpdate = order.items.filter(item => item.id)
        console.log(`📦 Actualizando todos los productos: ${itemsToUpdate.length} items`)
      }
      
      if (itemsToUpdate.length === 0) {
        console.warn("No items to update for order:", orderId)
        return
      }

      console.log(`🔄 Actualizando ${itemsToUpdate.length} items secuencialmente...`)
      
      // Actualizar items de forma secuencial con pequeño delay para evitar deadlocks
      for (let i = 0; i < itemsToUpdate.length; i++) {
        const item = itemsToUpdate[i]
        try {
          await apiCall("kitchen.updateStatus", {
            item_id: item.id,
            status: itemStatus
          })
          
          // Pequeño delay entre actualizaciones para evitar deadlocks
          if (i < itemsToUpdate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error(`❌ Error actualizando item ${item.id}:`, error)
          // Continuar con el siguiente item en caso de error
        }
      }

      console.log("✅ Estado actualizado exitosamente")

      // Update local state
      setOrders(
        orders.map((order) => {
          if (order.id === orderId) {
            const updatedItems = order.items.map(item => {
              // Si solo actualizamos productos nuevos, mantener el estado de los anteriores
              if (hasNewItems && wasOrderReady && newStatus === "preparacion") {
                if (item.isNew) {
                  return { ...item, status: uiStatus, isNew: false } // Remover flag isNew una vez procesado
                }
                return item // Mantener estado anterior
              } else {
                // Actualizar todos los items
                return { ...item, status: uiStatus, isNew: false }
              }
            })
            
            // Determinar el estado final de la orden
            let finalOrderStatus = newStatus
            if (hasNewItems && wasOrderReady && newStatus === "preparacion") {
              // Si hay mezcla de productos listos y en preparación, mantener estado "preparacion"
              finalOrderStatus = "preparacion"
            }
            
            return {
              ...order,
              status: finalOrderStatus,
              items: updatedItems
            }
          }
          return order
        }),
      )

      // Notificar a otras vistas (mesero, cajero) sobre el cambio
      triggerGlobalRefresh('ORDER_STATUS_UPDATED', {
        orderId: orderId,
        newStatus: newStatus,
        itemsUpdated: itemsToUpdate.length,
        hasNewItems: hasNewItems,
        wasOrderReady: wasOrderReady
      })
      console.log("📡 Notificación enviada a otras vistas")
    } catch (error: any) {
      console.error("❌ Error updating order status:", error)
      
      // Manejar errores de autenticación
      if (error.message && error.message.includes("Token")) {
        console.warn("❌ Error de autenticación, redirigiendo al login")
        localStorage.removeItem("token")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        window.location.href = "/login"
        return
      }
      
      // Optionally show user feedback here
    } finally {
      setIsUpdating(false)
    }
  }

  const pendingOrders = orders.filter((order) => order.status === "pendiente")
  const preparingOrders = orders.filter((order) => order.status === "preparacion")
  const readyOrders = orders.filter((order) => order.status === "listo")

  // Mostrar pantalla de carga/error si hay problemas de autenticación
  if (authError) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificando autenticación...</h2>
            <p className="text-gray-600">Redirigiendo al login...</p>
          </div>
        </div>
      </ClientOnly>
    )
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header
          title=""
          subtitle="🍳 Panel de Cocina"
          userName=""
          userRole="Cocinero"
          currentTime={currentTime}
          onLogout={handleLogout}
        />

        <div className="p-3 sm:p-4 lg:p-6">
          {/* Auto-refresh controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs ${autoRefresh ? "border-green-500 text-green-600" : "border-gray-300"}`}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Auto-actualizar</span>
                <span className="sm:hidden">Auto</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const token = localStorage.getItem("token")
                  const userRole = localStorage.getItem("userRole")
                  const userEmail = localStorage.getItem("userEmail")
                  
                  console.log("🔍 Estado actual de autenticación:")
                  console.log("- Token:", token ? `${token.substring(0, 20)}...` : "null")
                  console.log("- Role:", userRole)
                  console.log("- Email:", userEmail)
                  
                  if (token) {
                    try {
                      const userInfo = await apiCall("auth.me")
                      console.log("✅ Usuario autenticado:", userInfo)
                    } catch (error) {
                      console.error("❌ Error verificando usuario:", error)
                    }
                  }
                  
                  await fetchKitchenOrders() // Usar carga completa para refresh manual
                }}
                disabled={loading || isUpdating}
                className="border-blue-500 text-blue-600 text-xs"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${loading || isUpdating ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Actualizar</span>
                <span className="sm:hidden">Sync</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <p className="text-xs text-gray-500 text-left sm:text-right">
                Última actualización: {lastUpdate ? lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </p>
              {isUpdating && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Actualizando...</span>
                  <span className="sm:hidden">...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <StatsCard
              title="Pendientes"
              value={pendingOrders.length}
              icon={AlertCircle}
              iconColor="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
            <StatsCard
              title="En Preparación"
              value={preparingOrders.length}
              icon={Timer}
              iconColor="text-yellow-600"
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
            />
            <StatsCard
              title="Listos"
              value={readyOrders.length}
              icon={CheckCircle}
              iconColor="text-green-600"
              bgColor="bg-green-50"
              borderColor="border-green-200"
            />
            <StatsCard
              title="Total Pedidos"
              value={orders.length}
              icon={ChefHat}
              iconColor="text-orange-600"
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
            />
          </div>

          {/* Orders Tabs */}
          <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">🍽️ Todos</span>
                <span className="sm:hidden">🍽️</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">⏰ Pendientes</span>
                <span className="sm:hidden">⏰</span>
              </TabsTrigger>
              <TabsTrigger value="preparing" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">👨‍🍳 En Preparación</span>
                <span className="sm:hidden">👨‍🍳</span>
              </TabsTrigger>
              <TabsTrigger value="ready" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">✅ Listos</span>
                <span className="sm:hidden">✅</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm sm:text-base">Cargando órdenes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
                  ))}
                  {orders.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
                      No hay órdenes en cocina
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm sm:text-base">Cargando órdenes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
                  ))}
                  {pendingOrders.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
                      No hay órdenes pendientes
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="preparing" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm sm:text-base">Cargando órdenes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {preparingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
                  ))}
                  {preparingOrders.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
                      No hay órdenes en preparación
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ready" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm sm:text-base">Cargando órdenes...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {readyOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
                  ))}
                  {readyOrders.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm sm:text-base">
                      No hay órdenes listas
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
                    </Tabs>
        </div>
      </div>
    </ClientOnly>
  )
}
