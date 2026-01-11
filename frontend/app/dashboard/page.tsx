"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Menu } from "lucide-react"
import ClientOnly from "@/components/ClientOnly"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { AdminHeader } from "@/components/dashboard/AdminHeader"
import { DashboardHome } from "@/components/dashboard/sections/DashboardHome"
import { MenuManagement } from "@/components/dashboard/sections/MenuManagement"
import { ReportsSection } from "@/components/dashboard/sections/ReportsSection"
import { UserManagement } from "@/components/dashboard/sections/UserManagement"
import { ConfigurationSection } from "@/components/dashboard/sections/ConfigurationSection"
import { SongsSection } from "@/components/dashboard/sections/SongsSection"
import { useAuth } from "@/hooks/useAuth"
import { useApi } from "@/hooks/useApi"
import { useTheme } from "@/contexts/ThemeContext"
import type { MenuItem, Table, User, Category } from "@/types"


export default function AdminDashboard() {
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<number>(1)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { currentUser, isAuthenticated, handleLogout } = useAuth("administrador")
  const { apiCall } = useApi()
  const { theme } = useTheme()

  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeSection, setActiveSection] = useState("inicio")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  // Función para cargar datos (reutilizable)
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || isDataLoaded) return
    
    try {
      console.log("🔄 Iniciando carga de datos del dashboard...")
      
      // ✅ Obtener datos del usuario actual
      const userData = await apiCall("auth.me")
      setCurrentUserId(userData.id)

      // ✅ Obtener menú
      const menuData = await apiCall("menu.getAll")
      setMenuItems(menuData)

      // ✅ Obtener todas las categorías directamente del backend
      const categoriesData = await apiCall("category.getAll")
      setCategories(categoriesData)

      // ✅ Obtener usuarios
      const usersData = await apiCall("user.getAll")
      setUsers(usersData)

      // ✅ Obtener mesas
      const tablesData = await apiCall("table.getAll")
      
      // ✅ Obtener órdenes activas
      const activeOrders = await apiCall("order.getActiveWithItems")
      
      // ✅ Combinar datos de mesas con órdenes activas
      const tablesWithOrders = tablesData.map((table: Table) => {
        const activeOrder = activeOrders.find((order: any) => order.table_id === table.id)
        
        if (activeOrder) {
          // Convertir items del backend al formato del frontend
          const orders = activeOrder.items.map((item: any) => ({
            id: item.order_item_id,
            quantity: item.quantity,
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
            total: activeOrder.total,
            orderId: activeOrder.order_id,
            waiter: activeOrder.waiter_name
          }
        }
        
        return {
          ...table,
          orders: [],
          total: 0
        }
      })
      
      setTables(tablesWithOrders)

      // ✅ Obtener productos más vendidos (reportes)
      const top = await apiCall("report.topProducts")
      setTopProducts(top)

      // ✅ Obtener ventas diarias (reportes)
      const sales = await apiCall("report.dailySales")
      setSalesData(sales)

      setIsDataLoaded(true)
      console.log("✅ Datos del dashboard cargados exitosamente")

    } catch (error) {
      console.error("❌ Error cargando datos del dashboard:", error)
    }
  }, [isAuthenticated, apiCall, isDataLoaded])

  // Load initial data - Only once when component mounts
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Función específica para refrescar solo las mesas (más eficiente)
  const refreshTables = useCallback(async () => {
    try {
      console.log("🔄 Refrescando mesas desde el servidor...")
      // ✅ Obtener mesas
      const tablesData = await apiCall("table.getAll")
      
      // ✅ Obtener órdenes activas
      const activeOrders = await apiCall("order.getActiveWithItems")
      
      // ✅ Combinar datos de mesas con órdenes activas
      const tablesWithOrders = tablesData.map((table: Table) => {
        const activeOrder = activeOrders.find((order: any) => order.table_id === table.id)
        
        if (activeOrder) {
          // Convertir items del backend al formato del frontend
          const orders = activeOrder.items.map((item: any) => ({
            id: item.order_item_id,
            quantity: item.quantity,
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
            total: activeOrder.total,
            orderId: activeOrder.order_id,
            waiter: activeOrder.waiter_name
          }
        }
        
        return {
          ...table,
          orders: [],
          total: 0
        }
      })
      
      setTables(tablesWithOrders)
      console.log("✅ Mesas actualizadas desde el servidor:", tablesWithOrders.length)
    } catch (error) {
      console.error("❌ Error actualizando mesas:", error)
    }
  }, [apiCall])

  // Función para refrescar el menú desde el servidor
  const refreshMenu = useCallback(async () => {
    try {
      console.log("🔄 Refrescando menú desde el servidor...")
      const menuData = await apiCall("menu.getAll")
      setMenuItems(menuData)
      console.log("✅ Menú actualizado desde el servidor:", menuData.length)
    } catch (error) {
      console.error("❌ Error actualizando menú:", error)
    }
  }, [apiCall])

  // Función para refrescar las categorías desde el servidor
  const refreshCategories = useCallback(async () => {
    try {
      console.log("🔄 Refrescando categorías desde el servidor...")
      const categoriesData = await apiCall("category.getAll")
      setCategories(categoriesData)
      console.log("✅ Categorías actualizadas desde el servidor:", categoriesData.length)
    } catch (error) {
      console.error("❌ Error actualizando categorías:", error)
    }
  }, [apiCall])

  // Función para refrescar los usuarios desde el servidor
  const refreshUsers = useCallback(async () => {
    try {
      console.log("🔄 Refrescando usuarios desde el servidor...")
      const usersData = await apiCall("user.getAll")
      setUsers(usersData)
      console.log("✅ Usuarios actualizados desde el servidor:", usersData.length)
    } catch (error) {
      console.error("❌ Error actualizando usuarios:", error)
    }
  }, [apiCall])

 const addItemToOrder = async (tableId: number, menuItem: MenuItem) => {
  try {
    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    let orderId = table.orderId

    // Si no hay orden activa, crear una nueva
    if (!orderId) {
      const newOrder = await apiCall("order.create", {
        table_id: tableId,
        waiter_id: currentUserId, // Usar el ID del usuario actual
        notes: "Pedido creado desde panel de administración"
      })
      orderId = newOrder.order_id
    }

    // Agregar el item a la orden
    const addResult = await apiCall("order.addItem", {
      order_id: orderId,
      menu_item_id: menuItem.id,
      quantity: 1
    })

    // Actualizar el estado local
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const existingOrderIndex = table.orders.findIndex(
          (order) => order.menuItem.id === menuItem.id
        )

        let newOrders

        if (existingOrderIndex >= 0) {
          // Si el item ya existe, actualizar cantidad manteniendo el ID del item
          newOrders = table.orders.map((order, index) =>
            index === existingOrderIndex
              ? { ...order, quantity: addResult.quantity }
              : order
          )
        } else {
          // Si es un nuevo item, agregarlo con el ID del backend
          newOrders = [...table.orders, { 
            id: addResult.order_item_id, // Usar el ID del backend
            menuItem, 
            quantity: addResult.quantity 
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
          status: "ocupada" as "ocupada" | "libre",
          orderId: orderId // Guardar el ID de la orden
        }
      }
      return table
    })

    setTables(updatedTables)

    // Refresca el modal (u otra vista) si hay una mesa seleccionada
    const updatedTable = updatedTables.find((t) => t.id === tableId)
    if (updatedTable) setSelectedTable(updatedTable)

    // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
    await refreshTables()

  } catch (error) {
    console.error("Error al agregar item a la orden:", error)
  }
}


  const decreaseItemQuantity = async (tableId: number, orderId: number) => {
    try {
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      const order = table.orders.find((o) => o.id === orderId)
      if (!order) return

      // Decrementar cantidad en el backend usando el order_item_id
      await apiCall("order.decreaseItem", {
        order_id: table.orderId,
        item_id: orderId // El orderId local corresponde al order_item_id del backend
      })

      // Actualizar estado local
      const updatedTables = tables.map((table) => {
        if (table.id === tableId) {
          const newOrders = table.orders
            .map((order) =>
              order.id === orderId ? { ...order, quantity: order.quantity - 1 } : order
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
            orderId: newOrders.length > 0 ? table.orderId : undefined // Limpiar orderId si no hay productos
          }
        }
        return table
      })

      setTables(updatedTables)

      // Si no quedan productos, cerrar la orden automáticamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable && updatedTable.orders.length === 0 && table.orderId) {
        try {
          await apiCall("order.close", {
            order_id: table.orderId
          })
          console.log("✅ Orden cerrada automáticamente al quedar sin productos")
        } catch (error) {
          console.error("Error al cerrar orden automáticamente:", error)
        }
      }

      // Refresca la mesa seleccionada
      if (updatedTable) setSelectedTable(updatedTable)

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      await refreshTables()

    } catch (error) {
      console.error("Error al decrementar cantidad:", error)
    }
  }


  const removeItemFromOrder = async (tableId: number, orderId: number) => {
    try {
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      // Remover item del backend
      await apiCall("order.removeItem", {
        order_id: table.orderId,
        item_id: orderId // El orderId local corresponde al order_item_id del backend
      })

      // Actualizar estado local
      const updatedTables = tables.map((table) => {
        if (table.id === tableId) {
          const newOrders = table.orders.filter((order) => order.id !== orderId)
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
            orderId: newOrders.length > 0 ? table.orderId : undefined // Limpiar orderId si no hay productos
          }
        }
        return table
      })

      setTables(updatedTables)

      // Si no quedan productos, cerrar la orden automáticamente
      const updatedTable = updatedTables.find((t) => t.id === tableId)
      if (updatedTable && updatedTable.orders.length === 0 && table.orderId) {
        try {
          await apiCall("order.close", {
            order_id: table.orderId
          })
          console.log("✅ Orden cerrada automáticamente al quedar sin productos")
        } catch (error) {
          console.error("Error al cerrar orden automáticamente:", error)
        }
      }

      // Refresca la mesa seleccionada
      if (updatedTable) setSelectedTable(updatedTable)

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      await refreshTables()

    } catch (error) {
      console.error("Error al remover item:", error)
    }
  }


  const closeAccount = async (tableId: number) => {
    try {
      const table = tables.find((t) => t.id === tableId)
      if (!table || !table.orderId) return

      // Cerrar la orden en el backend
      await apiCall("order.close", {
        order_id: table.orderId
      })

      // Actualizar estado local
      setTables(
        tables.map((table) =>
          table.id === tableId ? { 
            ...table, 
            status: "libre" as const, 
            orders: [], 
            total: 0, 
            orderId: undefined 
          } : table,
        ),
      )

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      await refreshTables()

    } catch (error) {
      console.error("Error al cerrar cuenta:", error)
    }
  }

  // Función para controlar el cambio de sección y cerrar el menú móvil si está abierto
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Si estamos en móvil, cerrar el menú
    if (window.innerWidth < 1024) {
      setShowMobileMenu(false);
    }
  }

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    // En escritorio, alternamos entre colapsar y expandir
    setIsSidebarCollapsed(!isSidebarCollapsed);
    
    // En móvil, mostramos/ocultamos el menú lateral
    if (window.innerWidth < 1024) {
      setShowMobileMenu(!showMobileMenu);
    }
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "inicio":
        return (
          <DashboardHome
            tables={tables}
            setTables={setTables}
            onRefreshTables={refreshTables}
            menuItems={menuItems}
            categories={categories}
            onAddItemToOrder={addItemToOrder}
            onDecreaseQuantity={decreaseItemQuantity}
            onRemoveItem={removeItemFromOrder}
            onCloseAccount={closeAccount}
            dailySales={salesData}
          />
        )
      case "menu":
        return (
          <MenuManagement
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            categories={categories}
            setCategories={setCategories}
            onRefreshMenu={refreshMenu}
            onRefreshCategories={refreshCategories}
          />
        )
      case "reportes":
        return <ReportsSection tables={tables} menuItems={menuItems} />
      case "usuarios":
        return <UserManagement users={users} setUsers={setUsers} onRefreshUsers={refreshUsers} />
      case "canciones":
        return <SongsSection />
      case "configuracion":
        return <ConfigurationSection />
      default:
        return (
          <DashboardHome
            tables={tables}
            setTables={setTables}
            onRefreshTables={refreshTables}
            menuItems={menuItems}
            categories={categories}
            onAddItemToOrder={addItemToOrder}
            onDecreaseQuantity={decreaseItemQuantity}
            onRemoveItem={removeItemFromOrder}
            onCloseAccount={closeAccount}
            dailySales={salesData}
          />
        )
    }
  }

  return (
    <ClientOnly>
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Cargando...</p>
          </div>
        </div>
      ) : (
        <div 
          className="min-h-screen transition-colors duration-300"
          style={{ backgroundColor: theme.backgroundPreset.value }}
        >
          {/* Sidebar para pantallas grandes */}
          <div className={`lg:block ${showMobileMenu ? 'block' : 'hidden'}`}>
            <Sidebar 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange} 
              isCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          </div>
          
          {/* Overlay para cerrar el menú móvil al hacer clic fuera */}
          {showMobileMenu && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
          )}
          
          <AdminHeader 
            currentUser={currentUser} 
            onLogout={handleLogout}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />

          {/* Main Content */}
          <main className={`${isSidebarCollapsed ? 'lg:ml-14 sm:lg:ml-16' : 'lg:ml-56 sm:lg:ml-64'} pt-12 sm:pt-14 lg:pt-20 p-2 sm:p-3 lg:p-6 transition-all duration-300`}>
            {renderActiveSection()}
          </main>

          {/* Botón flotante para mostrar menú en móvil cuando está oculto */}
          {!showMobileMenu && (
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="fixed bottom-3 sm:bottom-6 left-3 sm:left-6 lg:hidden z-50 bg-gradient-to-r from-black via-gray-700 to-black text-white p-2 sm:p-3 rounded-full shadow-lg active:scale-95 transition-transform"
              aria-label="Mostrar menú"
            >
              <Menu className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
          )}
        </div>
      )}
    </ClientOnly>
  )
}
