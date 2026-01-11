"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Coffee, Users, ShoppingCart, Utensils, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/common/Header"
import { StatsCard } from "@/components/common/StatsCard"
import { TableCard } from "@/components/mesero/TableCard"
import { OrderModal } from "@/components/mesero/OrderModal"
import { QRModal } from "@/components/mesero/QRModal"
import { AddGuestModal } from "@/components/mesero/AddGuestModal"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentTime } from "@/hooks/useCurrentTime"
import { useLastUpdate } from "@/hooks/useLastUpdate"
import ClientOnly from "@/components/ClientOnly"
import type { MenuItem, OrderItem, Table, Category } from "@/types"

export default function MeseroPanel() {
  const { currentUser, isAuthenticated, handleLogout } = useAuth("mesero")
  const { apiCall } = useApi()
  const [currentUserId, setCurrentUserId] = useState<number>(1)
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false)
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null)
  const [selectedTableForGuest, setSelectedTableForGuest] = useState<Table | null>(null)
  const [newlyAddedGuestName, setNewlyAddedGuestName] = useState<string | null>(null) // Nombre del cliente recién agregado
  const [newlyAddedGuestId, setNewlyAddedGuestId] = useState<number | null>(null) // ID del cliente recién agregado
  const currentTime = useCurrentTime(60000) // Actualizar cada minuto
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { lastUpdate, updateTimestamp } = useLastUpdate()
  const [loading, setLoading] = useState(false)
  const [isPerformingAction, setIsPerformingAction] = useState(false) // Flag para evitar conflictos con auto-refresh

  // Función para obtener datos del mesero - Optimizado sin pestañeo
  const fetchMeseroData = useCallback(async (skipLoading = false) => {
    if (!isAuthenticated) return
    
    try {
      if (!skipLoading) {
        setLoading(true)
      }
      
      // Verificar token antes de hacer las llamadas
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado, redirigiendo al login")
        window.location.href = "/login"
        return
      }

      // Solo log en carga inicial, no en auto-refresh
      if (!skipLoading) {
        console.log("🔄 Obteniendo datos del mesero...")
      }

      // NO limpiar estado local para evitar pestañeo
      // Se actualiza de forma suave sin limpiar

      // Obtener datos del usuario actual
      const userData = await apiCall("auth.me")
      setCurrentUserId(userData.id)

      // Obtener menú solo si está vacío para evitar re-renders innecesarios
      if (menuItems.length === 0) {
        const menuData = await apiCall("menu.getAll")
        setMenuItems(menuData)
      }

      // Obtener categorías solo si están vacías
      if (categories.length === 0) {
        const categoriesData = await apiCall("category.getAll")
        setCategories(categoriesData)
      }

      // Obtener mesas
      const tablesData = await apiCall("table.getAll")
      
      // Obtener órdenes activas
      const activeOrders = await apiCall("order.getActiveWithItems")
      
      // Solo log en carga inicial
      if (!skipLoading) {
        console.log("✅ Datos del mesero actualizados:", {
          mesas: tablesData.length,
          ordenesActivas: activeOrders.length
        })
      }
      
      // Verificar y cerrar órdenes vacías automáticamente (solo si hay órdenes vacías)
      const ordersToClose = activeOrders.filter((order: any) => 
        !order.items || order.items.length === 0
      )
      
      if (ordersToClose.length > 0) {
        console.log(`🔄 Detectadas ${ordersToClose.length} órdenes vacías, cerrando secuencialmente...`)
        
        // Cerrar órdenes vacías secuencialmente para evitar deadlocks
        for (const emptyOrder of ordersToClose) {
          try {
            await apiCall("order.close", { order_id: emptyOrder.order_id })
            console.log(`✅ Orden vacía ${emptyOrder.order_id} cerrada automáticamente`)
            
            // Pequeño delay entre cierres para evitar deadlocks
            await new Promise(resolve => setTimeout(resolve, 50))
          } catch (error) {
            console.error(`❌ Error cerrando orden vacía ${emptyOrder.order_id}:`, error)
          }
        }
        
        // Filtrar las órdenes cerradas de la lista activa
        const filteredActiveOrders = activeOrders.filter((order: any) => 
          order.items && order.items.length > 0
        )
        
        console.log(`✅ Órdenes activas después de limpiar vacías: ${filteredActiveOrders.length}`)
        
        // Usar las órdenes filtradas
        activeOrders.splice(0, activeOrders.length, ...filteredActiveOrders)
      }
      
      // Combinar datos de mesas con órdenes activas
      const tablesWithOrders = tablesData.map((table: Table) => {
        const activeOrder = activeOrders.find((order: any) => order.table_id === table.id)
        
        if (activeOrder && activeOrder.items && activeOrder.items.length > 0) {
          // Función para normalizar estados desde el backend
          const normalizeItemStatus = (status: string): 'pendiente' | 'preparacion' | 'listo' | 'entregado' => {
            // Normalizar estados del backend al formato esperado por la UI
            if (status === "en preparación") return "preparacion"
            if (status === "servido") return "listo"
            if (status === "preparacion") return "preparacion"
            if (status === "listo") return "listo"
            if (status === "entregado") return "entregado"
            return "pendiente"
          }
          
          // Solo si hay items en la orden
          const orders = activeOrder.items.map((item: any) => ({
            id: item.order_item_id,
            quantity: item.quantity,
            status: normalizeItemStatus(item.item_status),  // Normalizar el estado
            notes: item.notes, // Incluir las notas del item
            menuItem: {
              id: item.menu_item_id,
              name: item.menu_item_name,
              description: item.description,
              price: item.price,
              category: item.category_name,
              category_id: item.category_id,
              category_name: item.category_name,
              image_url: item.image_url,
              available: item.available,
              preparation_time: item.preparation_time
            }
          }))
          
          return {
            ...table,
            status: "ocupada" as const,
            orders,
            total: Number(activeOrder.total) || 0,
            orderId: activeOrder.order_id,
            waiter: activeOrder.waiter_name,
            tableNotes: activeOrder.table_notes // Incluir las notas de la mesa
          }
        }
        
        // Si no hay orden activa O la orden está vacía, la mesa debe estar libre
        return {
          ...table,
          status: "libre" as const, // ✅ Establecer estado libre explícitamente
          orders: [],
          total: 0,
          orderId: undefined, // ✅ Limpiar orderId
          waiter: undefined, // ✅ Limpiar waiter
          tableNotes: undefined // ✅ Limpiar notas de la mesa
        }
      })
      
      // Actualizar estado de forma suave - sin limpiar primero
      setTables(tablesWithOrders)
      updateTimestamp()

      // Solo log en carga inicial
      if (!skipLoading) {
        console.log("✅ Estado local actualizado con datos frescos del backend")
      }

    } catch (error: any) {
      console.error("❌ Error cargando datos del mesero:", error)
      
      // Manejar errores de autenticación
      if (error.message && error.message.includes("Token")) {
        console.warn("❌ Error de autenticación, redirigiendo al login")
        localStorage.removeItem("token")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        window.location.href = "/login"
        return
      }
    } finally {
      if (!skipLoading) {
        setLoading(false)
      }
    }
  }, [isAuthenticated, apiCall, menuItems.length, categories.length])

  // Cargar datos iniciales
  useEffect(() => {
    fetchMeseroData()
  }, [fetchMeseroData])

  // Auto-refresh optimizado para sincronización con cocina
  useEffect(() => {
    if (!autoRefresh || isPerformingAction) return

    // Generar un intervalo aleatorio entre 4-7 segundos para sincronización rápida con cocina
    const baseInterval = 4000 // 4 segundos
    const randomDelay = Math.random() * 3000 // 0-3 segundos adicionales
    const interval = baseInterval + randomDelay

    const refreshTimer = setInterval(async () => {
      // Verificar token antes de hacer auto-refresh
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("❌ Token no encontrado durante auto-refresh")
        setAutoRefresh(false)
        return
      }
      
      // No hacer auto-refresh si se está ejecutando una acción
      if (isPerformingAction) return
      
      // No hacer auto-refresh si el modal está abierto para evitar interrupciones
      if (isOrderModalOpen) return
      
      try {
        // Auto-refresh completamente silencioso
        await fetchMeseroData(true)
      } catch (error) {
        console.error("❌ Error durante auto-refresh:", error)
        // Si hay error de autenticación, desactivar auto-refresh
        if (error instanceof Error && error.message.includes("Token")) {
          setAutoRefresh(false)
        }
      }
    }, interval)

    return () => clearInterval(refreshTimer)
  }, [autoRefresh, fetchMeseroData, isPerformingAction, isOrderModalOpen])

  // Función para forzar actualización global (notificar a otras vistas)
  const triggerGlobalRefresh = useCallback((action: string, details?: any) => {
    // Usar localStorage para comunicar entre pestañas/vistas
    const refreshEvent = {
      type: 'ORDER_UPDATED',
      timestamp: Date.now(),
      source: 'mesero',
      action: action,
      details: details
    }
    localStorage.setItem('globalRefreshTrigger', JSON.stringify(refreshEvent))
    
    // Disparar evento personalizado para pestañas de la misma sesión
    window.dispatchEvent(new CustomEvent('globalRefresh', { detail: refreshEvent }))
    
    console.log(`📡 Notificación enviada: ${action} desde mesero`)
  }, [])

  // Escuchar eventos de actualización global de otras vistas
  useEffect(() => {
    console.log("🔧 Configurando listeners de notificación global en mesero...")
    
    const handleGlobalRefresh = (event: Event) => {
      const customEvent = event as CustomEvent
      const { source, timestamp, action, details } = customEvent.detail
      
      console.log(`📡 Mesero recibió evento globalRefresh:`, { source, action, timestamp, details })
      
      // Solo actualizar si el evento viene de otra vista y es reciente (menos de 5 segundos)
      if (source !== 'mesero' && Date.now() - timestamp < 5000) {
        console.log(`✅ Mesero procesando notificación: ${action} desde ${source}`, details)
        fetchMeseroData(true)
      } else {
        console.log(`❌ Mesero ignoró notificación: source=${source}, edad=${Date.now() - timestamp}ms`)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'globalRefreshTrigger' && event.newValue) {
        console.log(`📡 Mesero recibió evento de localStorage:`, event.newValue)
        try {
          const refreshEvent = JSON.parse(event.newValue)
          console.log(`📡 Evento parseado:`, refreshEvent)
          
          if (refreshEvent.source !== 'mesero' && Date.now() - refreshEvent.timestamp < 5000) {
            console.log(`✅ Mesero procesando notificación de storage: ${refreshEvent.action} desde ${refreshEvent.source}`, refreshEvent.details)
            fetchMeseroData(true)
          } else {
            console.log(`❌ Mesero ignoró notificación de storage: source=${refreshEvent.source}, edad=${Date.now() - refreshEvent.timestamp}ms`)
          }
        } catch (error) {
          console.error('Error procesando evento de storage:', error)
        }
      }
    }

    window.addEventListener('globalRefresh', handleGlobalRefresh)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      console.log("🔧 Removiendo listeners de notificación global en mesero...")
      window.removeEventListener('globalRefresh', handleGlobalRefresh)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchMeseroData])

  // Función para agregar producto al pedido - Con notificación global
  const addItemToOrder = async (tableId: number, menuItem: MenuItem, notes?: string, guestId?: number | null) => {
    try {
      setIsPerformingAction(true) // Pausar auto-refresh
      
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      let orderId = table.orderId

      // Si no hay orden activa, crear una nueva
      if (!orderId) {
        const newOrder = await apiCall("order.create", {
          table_id: tableId,
          waiter_id: currentUserId,
          notes: "Pedido creado por mesero"
        })
        orderId = newOrder.order_id
      }

      // Agregar el item a la orden (con guest_id si está disponible)
      const addResult = await apiCall("order.addItem", {
        order_id: orderId,
        menu_item_id: menuItem.id,
        quantity: 1,
        notes: notes || null,
        guest_id: guestId || null
      })

      // Actualizar estado local INMEDIATAMENTE usando la respuesta del backend
      const updatedTables = tables.map((table) => {
        if (table.id === tableId) {
          const existingOrderIndex = table.orders.findIndex(
            (order) => order.menuItem.id === menuItem.id
          )

          let newOrders

          if (existingOrderIndex >= 0) {
            // Si el item ya existe, actualizar cantidad
            newOrders = table.orders.map((order, index) =>
              index === existingOrderIndex
                ? { ...order, quantity: addResult.quantity, id: addResult.order_item_id }
                : order
            )
          } else {
            // Si es un nuevo item, agregarlo
            newOrders = [...table.orders, { 
              id: addResult.order_item_id,
              menuItem, 
              quantity: addResult.quantity,
              status: addResult.status || 'pendiente',
              notes: notes
            }]
          }

          const newTotal = newOrders.reduce(
            (sum, order) => sum + order.menuItem.price * order.quantity,
            0
          )

          return {
            ...table,
            orders: newOrders,
            total: newTotal,
            status: "ocupada" as const,
            orderId: orderId
          }
        }
        return table
      })

      setTables(updatedTables)

      // Actualizar selectedTable inmediatamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable) setSelectedTable(updatedTable)

      // Notificar a otras vistas sobre el cambio
      triggerGlobalRefresh('ITEM_ADDED', {
        tableId: tableId,
        menuItem: menuItem.name,
        quantity: addResult.quantity,
        orderId: orderId
      })

      setIsPerformingAction(false) // Reanudar auto-refresh

    } catch (error: any) {
      console.error("Error al agregar item a la orden:", error)
      setIsPerformingAction(false)
      
      if (error.message && error.message.includes("no existe")) {
        fetchMeseroData(true)
      } else {
        alert("No se pudo agregar el producto al pedido")
      }
    }
  }

  // Función para eliminar producto del pedido - Optimizado como el dashboard
  const removeItemFromOrder = async (tableId: number, orderItemId: number) => {
    try {
      setIsPerformingAction(true) // Pausar auto-refresh
      
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      // Verificar si el item existe
      const order = table.orders.find((o) => o.id === orderItemId)
      if (!order) {
        console.warn("❌ El item no existe localmente")
        setIsPerformingAction(false)
        return
      }

      // Remover item del backend
      await apiCall("order.removeItem", {
        order_id: table.orderId,
        item_id: orderItemId
      })

      // Actualizar estado local INMEDIATAMENTE
      const updatedTables = tables.map((table) => {
        if (table.id === tableId) {
          const newOrders = table.orders.filter((order) => order.id !== orderItemId)
          const newTotal = newOrders.reduce(
            (sum, order) => sum + order.menuItem.price * order.quantity,
            0
          )
          const estado: "ocupada" | "libre" = newOrders.length > 0 ? "ocupada" : "libre"

          return {
            ...table,
            orders: newOrders,
            total: newTotal,
            status: estado,
            orderId: newOrders.length > 0 ? table.orderId : undefined
          }
        }
        return table
      })

      setTables(updatedTables)

      // Actualizar selectedTable inmediatamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable) setSelectedTable(updatedTable)

      // Si no quedan productos, cerrar la orden
      if (updatedTable && updatedTable.orders.length === 0 && table.orderId) {
        try {
          await apiCall("order.close", { order_id: table.orderId })
        } catch (error) {
          console.error("Error al cerrar orden:", error)
        }
      }

      // Notificar a otras vistas sobre el cambio
      triggerGlobalRefresh('ITEM_REMOVED', {
        tableId: tableId,
        menuItem: order.menuItem.name,
        orderId: table.orderId
      })

      setIsPerformingAction(false) // Reanudar auto-refresh

    } catch (error: any) {
      console.error("Error al remover item:", error)
      setIsPerformingAction(false)
      
      if (error.message && error.message.includes("El ítem no existe")) {
        fetchMeseroData(true)
      } else {
        alert("No se pudo eliminar el producto del pedido")
      }
    }
  }

  // Función para reducir cantidad - Optimizado como el dashboard
  const decreaseItemQuantity = async (tableId: number, orderItemId: number) => {
    try {
      setIsPerformingAction(true) // Pausar auto-refresh
      
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      const order = table.orders.find((o) => o.id === orderItemId)
      if (!order) {
        console.warn("❌ El item no existe localmente")
        setIsPerformingAction(false)
        return
      }

      // Decrementar cantidad en el backend
      await apiCall("order.decreaseItem", {
        order_id: table.orderId,
        item_id: orderItemId
      })

      // Actualizar estado local INMEDIATAMENTE
      const updatedTables = tables.map((table) => {
        if (table.id === tableId) {
          const newOrders = table.orders
            .map((order) =>
              order.id === orderItemId ? { ...order, quantity: order.quantity - 1 } : order
            )
            .filter((order) => order.quantity > 0)

          const newTotal = newOrders.reduce(
            (sum, order) => sum + order.menuItem.price * order.quantity,
            0
          )

          const estado: "ocupada" | "libre" = newOrders.length > 0 ? "ocupada" : "libre"

          return {
            ...table,
            orders: newOrders,
            total: newTotal,
            status: estado,
            orderId: newOrders.length > 0 ? table.orderId : undefined
          }
        }
        return table
      })

      setTables(updatedTables)

      // Actualizar selectedTable inmediatamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable) setSelectedTable(updatedTable)

      // Si no quedan productos, cerrar la orden
      if (updatedTable && updatedTable.orders.length === 0 && table.orderId) {
        try {
          await apiCall("order.close", { order_id: table.orderId })
        } catch (error) {
          console.error("Error al cerrar orden:", error)
        }
      }

      // Notificar a otras vistas sobre el cambio
      triggerGlobalRefresh('QUANTITY_DECREASED', {
        tableId: tableId,
        menuItem: order.menuItem.name,
        newQuantity: order.quantity - 1,
        orderId: table.orderId
      })

      setIsPerformingAction(false) // Reanudar auto-refresh

    } catch (error: any) {
      console.error("Error al decrementar cantidad:", error)
      setIsPerformingAction(false)
      
      if (error.message && error.message.includes("El ítem no existe")) {
        fetchMeseroData(true)
      } else {
        alert("No se pudo actualizar la cantidad del producto")
      }
    }
  }

  // Función para actualizar notas de la mesa - Optimizado
  const updateTableNotes = async (tableId: number, notes: string) => {
    try {
      setIsPerformingAction(true) // Pausar auto-refresh
      
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      // Actualizar notas en el backend
      await apiCall("order.updateTableNotes", {
        order_id: table.orderId,
        notes: notes
      })

      // Actualizar estado local INMEDIATAMENTE
      const updatedTables = tables.map((t) => 
        t.id === tableId ? { ...t, tableNotes: notes } : t
      )
      setTables(updatedTables)

      // Actualizar selectedTable inmediatamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable) setSelectedTable(updatedTable)

      // Notificar a otras vistas sobre el cambio
      triggerGlobalRefresh('TABLE_NOTES_UPDATED', {
        tableId: tableId,
        notes: notes,
        orderId: table.orderId
      })

      setIsPerformingAction(false) // Reanudar auto-refresh
      
    } catch (error) {
      console.error("Error al actualizar notas de mesa:", error)
      setIsPerformingAction(false)
      alert("No se pudieron guardar las notas de la mesa")
    }
  }

  // Función para actualizar notas de un item - Optimizado
  const updateItemNotes = async (tableId: number, orderItemId: number, notes: string) => {
    try {
      setIsPerformingAction(true) // Pausar auto-refresh
      
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      // Actualizar notas en el backend
      await apiCall("order.updateItemNotes", {
        order_id: table.orderId,
        item_id: orderItemId,
        notes: notes
      })

      // Actualizar estado local INMEDIATAMENTE
      const updatedTables = tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            orders: t.orders.map((order) =>
              order.id === orderItemId ? { ...order, notes } : order
            )
          }
        }
        return t
      })
      setTables(updatedTables)

      // Actualizar selectedTable inmediatamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable) setSelectedTable(updatedTable)

      // Notificar a otras vistas sobre el cambio (opcional para notas de items)
      triggerGlobalRefresh('ITEM_NOTES_UPDATED', {
        tableId: tableId,
        orderItemId: orderItemId,
        notes: notes,
        orderId: table.orderId
      })

      setIsPerformingAction(false) // Reanudar auto-refresh
      
    } catch (error) {
      console.error("Error al actualizar notas del item:", error)
      setIsPerformingAction(false)
      alert("No se pudieron guardar las notas del producto")
    }
  }

  const openOrderModal = (table: Table) => {
    setSelectedTable(table)
    setIsOrderModalOpen(true)
  }

  const openQRModal = (table: Table) => {
    setSelectedTableForQR(table)
    setIsQRModalOpen(true)
  }

  const openAddGuestModal = (table: Table) => {
    setSelectedTableForGuest(table)
    setIsAddGuestModalOpen(true)
  }

  // Función para agregar cliente/invitado manual a una mesa
  const addManualGuest = async (tableId: number, guestName: string, phone?: string) => {
    try {
      setIsPerformingAction(true) // Pausar auto-refresh
      
      console.log(`👤 Agregando cliente manual "${guestName}" a mesa ${tableId}`)
      
      const result = await apiCall("guest.registerManual", {
        tableId,
        guestName,
        phone: phone || null
      })
      
      console.log("✅ Cliente agregado:", result)
      
      // Notificar a otras vistas sobre el cambio
      triggerGlobalRefresh('GUEST_ADDED', {
        tableId,
        guestName,
        guestId: result.guestId
      })
      
      // Refrescar datos para mostrar el nuevo cliente
      await fetchMeseroData(true)
      
      setIsPerformingAction(false) // Reanudar auto-refresh
      
      // Guardar el nombre y ID del cliente recién agregado para mostrarlo en el modal
      setNewlyAddedGuestName(guestName)
      setNewlyAddedGuestId(result.guestId)
      
      // Después de agregar el cliente, abrir el modal de pedidos para atenderlo
      const tableToOpen = tables.find((t) => t.id === tableId)
      if (tableToOpen) {
        // Pequeño delay para asegurar que el estado se actualizó
        setTimeout(() => {
          setSelectedTable(tableToOpen)
          setIsOrderModalOpen(true)
        }, 100)
      }
      
    } catch (error: any) {
      console.error("Error al agregar cliente manual:", error)
      setIsPerformingAction(false)
      throw error // Re-lanzar para que el modal lo maneje
    }
  }

  // Sincronizar selectedTable con el estado global de tables - Ultra optimizado
  useEffect(() => {
    if (selectedTable && isOrderModalOpen) {
      const updated = tables.find((t) => t.id === selectedTable.id)
      if (updated) {
        // Solo actualizar si hay cambios reales en los datos importantes
        const hasChanges = (
          updated.orders.length !== selectedTable.orders.length ||
          updated.total !== selectedTable.total ||
          updated.status !== selectedTable.status ||
          updated.tableNotes !== selectedTable.tableNotes
        )
        
        if (hasChanges) {
          setSelectedTable(updated)
        }
      }
    }
  }, [tables, selectedTable?.id, isOrderModalOpen]) // Optimizado para solo comparar ID

  // Memoizar datos computados para evitar re-renders innecesarios
  const statsData = useMemo(() => {
    const ocupadas = tables.filter((t) => t.status === "ocupada").length
    const conPedidos = tables.filter((t) => t.orders.length > 0).length
    const totalVentas = tables.reduce((sum, table) => sum + parseFloat(table.total.toString()), 0)
    
    return {
      totalMesas: tables.length,
      ocupadas,
      conPedidos,
      totalVentas: `$${totalVentas.toLocaleString('es-CO')}`
    }
  }, [tables])

  const menuCategories = useMemo(() => 
    categories.map(category => category.name), 
    [categories]
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <Header
          title=""
          subtitle="🌮 Panel de Mesero"
          userName={currentUser || "Mesero"}
          userRole="Mesero"
          currentTime={currentTime}
          onLogout={handleLogout}
        />

        {/* Auto-refresh controls */}
        <div className="px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-0">
          <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs ${autoRefresh ? "border-green-500 text-green-600 bg-green-50" : "border-gray-300"}`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
                <span className="ml-1 hidden xs:inline">Auto</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMeseroData()}
                disabled={loading || isPerformingAction}
                className="h-7 sm:h-8 px-2 sm:px-3 border-blue-500 text-blue-600 text-[10px] sm:text-xs"
              >
                <RefreshCw className={`w-3 h-3 ${loading || isPerformingAction ? "animate-spin" : ""}`} />
                <span className="ml-1 hidden xs:inline">Sync</span>
              </Button>
              {isPerformingAction && (
                <span className="text-[10px] text-orange-600 animate-pulse">...</span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">
              {lastUpdate ? lastUpdate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-2 sm:px-4 lg:px-6 pt-0 pb-2 sm:pb-4">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 lg:gap-4 mb-2 sm:mb-4">
            <StatsCard
              title="Mis Mesas"
              value={statsData.totalMesas}
              icon={Coffee}
              iconColor="text-green-600"
              bgColor="bg-green-50"
              borderColor="border-green-200"
            />
            <StatsCard
              title="Ocupadas"
              value={statsData.ocupadas}
              icon={Users}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              borderColor="border-emerald-200"
            />
            <StatsCard
              title="Pedidos"
              value={statsData.conPedidos}
              icon={ShoppingCart}
              iconColor="text-teal-600"
              bgColor="bg-teal-50"
              borderColor="border-teal-200"
            />
            <StatsCard
              title="Total Ventas"
              value={statsData.totalVentas}
              icon={Utensils}
              iconColor="text-green-600"
              bgColor="bg-green-50"
              borderColor="border-green-200"
            />
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5 sm:gap-3 lg:gap-4">
            {tables.map((table) => (
              <TableCard 
                key={table.id} 
                table={table} 
                onOpenModal={openOrderModal} 
                onOpenQRModal={openQRModal}
                onOpenAddGuestModal={openAddGuestModal}
              />
            ))}
          </div>
        </div>

      {/* Order Management Modal */}
      {isOrderModalOpen && selectedTable && (
        <OrderModal
          key={selectedTable.id}
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false)
            setNewlyAddedGuestName(null) // Limpiar el nombre del cliente al cerrar
            setNewlyAddedGuestId(null) // Limpiar el ID del cliente al cerrar
          }}
          selectedTable={selectedTable}
          menuItems={menuItems}
          menuCategories={menuCategories}
          onAddItem={addItemToOrder}
          onRemoveItem={removeItemFromOrder}
          onDecreaseQuantity={decreaseItemQuantity}
          onUpdateTableNotes={updateTableNotes}
          onUpdateItemNotes={updateItemNotes}
          newGuestName={newlyAddedGuestName}
          newGuestId={newlyAddedGuestId}
          onClearNewGuest={() => {
            setNewlyAddedGuestName(null)
            setNewlyAddedGuestId(null)
          }}
        />
      )}

      {/* QR Code Modal */}
      {isQRModalOpen && selectedTableForQR && (
        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          table={selectedTableForQR}
        />
      )}

      {/* Add Guest Modal */}
      {isAddGuestModalOpen && selectedTableForGuest && (
        <AddGuestModal
          isOpen={isAddGuestModalOpen}
          onClose={() => setIsAddGuestModalOpen(false)}
          table={selectedTableForGuest}
          onAddGuest={addManualGuest}
        />
      )}
    </div>
    </ClientOnly>
  )
}
