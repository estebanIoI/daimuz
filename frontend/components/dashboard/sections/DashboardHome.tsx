"use client"

import { useState, useEffect } from "react"
import { Coffee, Users, ShoppingCart, CreditCard, Plus, Trash2, AlertTriangle, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StatsCard } from "@/components/common/StatsCard"
import { useApi } from "@/hooks/useApi"
import { useToast } from "@/hooks/use-toast"
import { OrderModal } from "@/components/dashboard/modals/OrderModal"
import type { Table, MenuItem, Category } from "@/types"
import { formatCurrency, formatOrderCount } from "@/lib/formatters"

interface DashboardHomeProps {
  tables: Table[]
  setTables: (tables: Table[]) => void
  onRefreshTables?: () => Promise<void>
  menuItems: MenuItem[]
  categories: Category[]
  onAddItemToOrder: (tableId: number, menuItem: MenuItem) => void
  onDecreaseQuantity: (tableId: number, orderId: number) => void
  onRemoveItem: (tableId: number, orderId: number) => void
  onCloseAccount: (tableId: number) => void
  dailySales?: any[] // Datos de ventas diarias
}

export function DashboardHome({
  tables,
  setTables,
  onRefreshTables,
  menuItems,
  categories,
  onAddItemToOrder,
  onDecreaseQuantity,
  onRemoveItem,
  onCloseAccount,
  dailySales = [],
}: DashboardHomeProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  
  // Estados para el modal de agregar mesa
  const [isAddTableDialogOpen, setIsAddTableDialogOpen] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState<number | "">("")
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  
  // Estados para confirmación de eliminar
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null)
  const [isDeletingTable, setIsDeletingTable] = useState(false)
  
  // Estado para modo selección múltiple
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedTables, setSelectedTables] = useState<Set<number>>(new Set())

  const { apiCall, loading } = useApi()
  const { toast } = useToast()

  // Obtener próximo número de mesa disponible
  const fetchNextTableNumber = async () => {
    try {
      const nextNumberData = await apiCall("table.getNextNumber")
      setNewTableNumber(nextNumberData.nextNumber)
    } catch (err) {
      console.error("Error obteniendo próximo número:", err)
      // Calcular localmente si falla
      const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0
      setNewTableNumber(maxNumber + 1)
    }
  }

  // Abrir modal de agregar mesa
  const openAddTableDialog = async () => {
    await fetchNextTableNumber()
    setNewTableCapacity(4)
    setIsAddTableDialogOpen(true)
  }

  // Agregar mesa con validaciones
  const handleAddTable = async () => {
    if (!newTableNumber || newTableNumber <= 0) {
      toast({
        title: "Error",
        description: "El número de mesa debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (newTableCapacity < 1 || newTableCapacity > 20) {
      toast({
        title: "Error",
        description: "La capacidad debe estar entre 1 y 20 personas",
        variant: "destructive",
      })
      return
    }

    // Verificar si ya existe una mesa con ese número
    if (tables.some(t => t.number === newTableNumber)) {
      toast({
        title: "Error",
        description: `Ya existe una mesa con el número ${newTableNumber}`,
        variant: "destructive",
      })
      return
    }

    setIsCreatingTable(true)

    try {
      const created = await apiCall("table.create", {
        number: newTableNumber,
        capacity: newTableCapacity,
        status: "libre"
      })
      
      // Actualización optimista inmediata en la UI
      const newTable = { ...created, orders: [], total: 0 }
      setTables([...tables, newTable])
      
      toast({
        title: "¡Mesa creada!",
        description: `Mesa ${newTableNumber} creada exitosamente con capacidad para ${newTableCapacity} personas`,
      })
      
      setIsAddTableDialogOpen(false)
      setNewTableNumber("")
      setNewTableCapacity(4)
      
      // Refrescar en segundo plano (sin bloquear UI)
      if (onRefreshTables) {
        onRefreshTables()
      }
      
    } catch (err: any) {
      console.error("❌ Error al agregar mesa:", err)
      toast({
        title: "Error al crear mesa",
        description: err.message || "No se pudo crear la mesa",
        variant: "destructive",
      })
      
      if (onRefreshTables) {
        onRefreshTables()
      }
    } finally {
      setIsCreatingTable(false)
    }
  }

  // Agregar mesa rápida (con valores por defecto)
  const handleQuickAddTable = async () => {
    try {
      const nextNumberData = await apiCall("table.getNextNumber")
      const nextNumber = nextNumberData.nextNumber
      
      const created = await apiCall("table.create", {
        number: nextNumber,
        capacity: 4,
        status: "libre"
      })
      
      const newTable = { ...created, orders: [], total: 0 }
      setTables([...tables, newTable])
      
      toast({
        title: "¡Mesa creada!",
        description: `Mesa ${nextNumber} añadida rápidamente`,
      })
      
      // Refrescar en segundo plano (sin bloquear UI)
      if (onRefreshTables) {
        onRefreshTables()
      }
      
    } catch (err: any) {
      console.error("❌ Error al agregar mesa rápida:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear la mesa",
        variant: "destructive",
      })
    }
  }

  // Confirmar eliminación de mesa
  const confirmDeleteTable = (table: Table) => {
    if (table.status !== "libre") {
      toast({
        title: "No se puede eliminar",
        description: "Solo se pueden eliminar mesas que estén libres",
        variant: "destructive",
      })
      return
    }
    setTableToDelete(table)
  }

  // Eliminar mesa individual
  const handleDeleteTable = async () => {
    if (!tableToDelete) return
    
    const tableToRemove = tableToDelete
    setIsDeletingTable(true)
    
    console.log("🗑️ Intentando eliminar mesa:", {
      id: tableToRemove.id,
      number: tableToRemove.number,
      status: tableToRemove.status
    })

    // Cerrar el modal y actualizar UI INMEDIATAMENTE (optimistic update)
    setTableToDelete(null)
    const filteredTables = tables.filter(t => t.id !== tableToRemove.id)
    setTables(filteredTables)

    try {
      const result = await apiCall("table.delete", { id: tableToRemove.id })
      console.log("✅ Mesa eliminada del servidor:", result)
      
      toast({
        title: "Mesa eliminada",
        description: `Mesa ${tableToRemove.number} eliminada correctamente`,
      })
      
      // NO hacer refresh automático - confiar en la actualización optimista
      // El backend ya invalidó el caché, y el estado local ya está correcto
      console.log("✅ Estado local actualizado correctamente, mesas restantes:", filteredTables.length)
      
    } catch (err: any) {
      console.error("❌ Error al eliminar mesa:", err)
      
      toast({
        title: "Error al eliminar",
        description: err.message === "Mesa no encontrada" 
          ? "La mesa ya no existe"
          : (err.message || "No se pudo eliminar la mesa"),
        variant: "destructive",
      })
      
      // Si hay error, refrescar para restaurar estado correcto
      if (onRefreshTables) {
        onRefreshTables()
      }
    } finally {
      setIsDeletingTable(false)
    }
  }

  // Toggle selección de mesa
  const toggleTableSelection = (tableId: number) => {
    const newSelection = new Set(selectedTables)
    if (newSelection.has(tableId)) {
      newSelection.delete(tableId)
    } else {
      newSelection.add(tableId)
    }
    setSelectedTables(newSelection)
  }

  // Eliminar mesas seleccionadas
  const handleDeleteSelectedTables = async () => {
    const tablesToDelete = tables.filter(t => selectedTables.has(t.id) && t.status === "libre")
    
    if (tablesToDelete.length === 0) {
      toast({
        title: "Sin mesas para eliminar",
        description: "No hay mesas libres seleccionadas",
        variant: "destructive",
      })
      return
    }

    // Optimistic update - actualizar UI inmediatamente
    const idsToDelete = new Set(tablesToDelete.map(t => t.id))
    const filteredTables = tables.filter(t => !idsToDelete.has(t.id))
    setTables(filteredTables)
    setSelectedTables(new Set())
    setIsSelectionMode(false)
    setIsDeletingTable(true)

    try {
      let deletedCount = 0
      let errors = 0

      for (const table of tablesToDelete) {
        try {
          await apiCall("table.delete", { id: table.id })
          deletedCount++
        } catch {
          errors++
        }
      }

      toast({
        title: "Mesas eliminadas",
        description: `${deletedCount} mesa(s) eliminada(s) correctamente${errors > 0 ? `. ${errors} error(es)` : ""}`,
      })

      // NO hacer refresh automático - confiar en la actualización optimista
      // El backend ya invalidó el caché para cada mesa eliminada
      console.log("✅ Estado local actualizado correctamente, mesas restantes:", filteredTables.length)
      
      // Solo refrescar si hubo errores para restaurar el estado correcto
      if (errors > 0 && onRefreshTables) {
        onRefreshTables()
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: "Error al eliminar mesas seleccionadas",
        variant: "destructive",
      })
      
      // Si hay error, refrescar para restaurar estado correcto
      if (onRefreshTables) {
        onRefreshTables()
      }
    } finally {
      setIsDeletingTable(false)
    }
  }

  // Cancelar modo selección
  const cancelSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedTables(new Set())
  }

  const openOrderModal = (table: Table) => {
    setSelectedTable(table)
    setIsOrderModalOpen(true)
  }

  // Sincronizar selectedTable con el estado global de tables
  // Estado para mantener el resumen de ventas calculado
  const [salesSummary, setSalesSummary] = useState({
    todaySales: 0,
    activeTablesTotal: 0,
    combinedTotal: 0
  });

  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find((t) => t.id === selectedTable.id)
      if (updated) setSelectedTable(updated)
    }
  }, [tables])

  // Efecto para calcular el resumen de ventas cuando cambian los datos relevantes
  useEffect(() => {
    if (dailySales && dailySales.length > 0) {
      // Ventas completadas del día actual (primer elemento en el array)
      const todaySales = parseFloat(dailySales[0]?.total_sales || '0');
      
      // Ventas activas (mesas ocupadas actualmente)
      const activeTablesTotal = tables.reduce(
        (sum, table) => sum + parseFloat(table.total?.toString() || '0'), 
        0
      );
      
      // Total combinado
      const combinedTotal = todaySales + activeTablesTotal;
      
      console.log("Calculando resumen de ventas:", {
        dailySales: dailySales,
        todaySales: todaySales,
        activeTablesTotal: activeTablesTotal,
        combinedTotal: combinedTotal
      });
      
      setSalesSummary({
        todaySales,
        activeTablesTotal,
        combinedTotal
      });
    } else {
      // Solo ventas activas si no hay datos de ventas completadas
      const activeTablesTotal = tables.reduce(
        (sum, table) => sum + parseFloat(table.total?.toString() || '0'), 
        0
      );
      
      setSalesSummary({
        todaySales: 0,
        activeTablesTotal,
        combinedTotal: activeTablesTotal
      });
    }
  }, [dailySales, tables]);

  const closeOrderModal = () => {
    setIsOrderModalOpen(false)
    setSelectedTable(null)
  }

  const handleCloseAccount = (tableId: number) => {
    onCloseAccount(tableId)
    closeOrderModal()
  }

  return (
    <>
      {/* Barra de acciones para mesas */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 sm:mt-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          {!isSelectionMode ? (
            <>
              <Button 
                onClick={openAddTableDialog} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Agregar Mesa</span>
                <span className="sm:hidden">+ Mesa</span>
              </Button>
              <Button 
                onClick={handleQuickAddTable} 
                variant="outline"
                className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4 border-blue-300 text-blue-600 hover:bg-blue-50"
                title="Agregar mesa rápida con valores por defecto"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Rápida</span>
              </Button>
              {tables.filter(t => t.status === "libre").length > 0 && (
                <Button 
                  onClick={() => setIsSelectionMode(true)} 
                  variant="outline"
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Eliminar Varias</span>
                  <span className="sm:hidden">Eliminar</span>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                onClick={handleDeleteSelectedTables}
                disabled={selectedTables.size === 0 || isDeletingTable}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Eliminar ({selectedTables.size})
              </Button>
              <Button 
                onClick={cancelSelectionMode}
                variant="outline"
                className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Cancelar
              </Button>
              <span className="text-xs text-gray-500 hidden sm:inline">
                Selecciona mesas libres para eliminar
              </span>
            </>
          )}
        </div>
        
        {/* Contador de mesas libres */}
        <div className="text-xs sm:text-sm text-gray-500">
          {tables.filter(t => t.status === "libre").length} mesa(s) libre(s)
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-4 mb-3 sm:mb-8">
          <StatsCard
            title="Mesas"
            value={tables.length}
            icon={Coffee}
            iconColor="text-orange-600"
            bgColor="bg-orange-100"
            borderColor="border-orange-200"
          />
          <StatsCard
            title="Ocupadas"
            value={tables.filter((t) => t.status === "ocupada").length}
            icon={Users}
            iconColor="text-green-600"
            bgColor="bg-green-100"
            borderColor="border-green-200"
          />
          <StatsCard
            title="Pedidos"
            value={tables.filter((t) => t.orders.length > 0).length}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
            borderColor="border-blue-200"
          />
          <StatsCard
            title="Ventas"
            value={formatCurrency(salesSummary.combinedTotal)}
            icon={CreditCard}
            iconColor="text-purple-600"
            bgColor="bg-purple-100"
            borderColor="border-purple-200"
          />
        </div>

        {/* Admin Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4 mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-800 mb-1 sm:mb-2">Panel Admin - Gestión de Mesas</h3>
          <p className="text-[10px] sm:text-xs text-blue-700">
            {isSelectionMode 
              ? "Modo selección activo. Toca las mesas libres que deseas eliminar y luego presiona 'Eliminar'."
              : "Toca una mesa para gestionar pedidos. Usa los botones superiores para agregar o eliminar mesas."}
          </p>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
          {tables.map((table) => {
            const isSelected = selectedTables.has(table.id)
            const canSelect = isSelectionMode && table.status === "libre"
            
            return (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-95 sm:hover:scale-105 relative ${
                  isSelected
                    ? "border-red-500 bg-gradient-to-br from-red-50 to-red-100 ring-2 ring-red-400"
                    : table.status === "ocupada"
                      ? "border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100 hover:border-orange-400"
                      : "border-green-300 bg-gradient-to-br from-green-50 to-green-100 hover:border-green-400"
                } ${isSelectionMode && table.status !== "libre" ? "opacity-50" : ""}`}
                onClick={() => {
                  if (isSelectionMode) {
                    if (table.status === "libre") {
                      toggleTableSelection(table.id)
                    }
                  } else {
                    openOrderModal(table)
                  }
                }}
              >
                {/* Indicador de selección */}
                {isSelectionMode && table.status === "libre" && (
                  <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? "bg-red-500 border-red-500" 
                      : "bg-white border-gray-300"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                  </div>
                )}
                
                <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-4">
                  <div className="flex items-center justify-between gap-1">
                    <CardTitle className="text-sm sm:text-lg font-bold text-gray-800">Mesa {table.number}</CardTitle>
                    <Badge
                      variant={table.status === "ocupada" ? "destructive" : "default"}
                      className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
                        isSelected
                          ? "bg-red-500 hover:bg-red-600"
                          : table.status === "ocupada"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                      <span className="hidden sm:inline">
                        {isSelected ? "Seleccionada" : table.status === "ocupada" ? "Ocupada" : "Libre"}
                      </span>
                      <span className="sm:hidden">
                        {isSelected ? "✓" : table.status === "ocupada" ? "🟠" : "🟢"}
                      </span>
                    </Badge>
                  </div>
                  
                  {/* Botón eliminar solo si la mesa está libre y NO estamos en modo selección */}
                  {table.status === "libre" && !isSelectionMode && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 sm:mt-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 text-[10px] sm:text-xs h-6 sm:h-8 w-full"
                      onClick={e => {
                        e.stopPropagation()
                        confirmDeleteTable(table)
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Eliminar Mesa</span>
                      <span className="sm:hidden">Eliminar</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-2 sm:p-4 pt-0">
                  {table.status === "ocupada" ? (
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] sm:text-sm text-gray-600">
                          {table.orders.length} item{table.orders.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm sm:text-xl font-bold text-orange-600">{formatCurrency(parseFloat(table.total.toString()))}</p>
                      </div>
                      {table.waiter && <p className="text-[9px] sm:text-xs text-gray-500 truncate">Mesero: {table.waiter}</p>}
                      <p className="text-[9px] sm:text-xs text-blue-600 font-medium hidden sm:block">Click para gestionar</p>
                    </div>
                  ) : (
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">
                        {isSelectionMode ? "Toca para seleccionar" : "Disponible"}
                      </p>
                      {!isSelectionMode && (
                        <Button
                          size="sm"
                          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-[10px] sm:text-sm h-6 sm:h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openOrderModal(table)
                          }}
                        >
                          <span className="hidden sm:inline">Tomar Pedido</span>
                          <span className="sm:hidden">+ Pedido</span>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Modal para agregar mesa personalizada */}
      <Dialog open={isAddTableDialogOpen} onOpenChange={setIsAddTableDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Agregar Nueva Mesa
            </DialogTitle>
            <DialogDescription>
              Configura los detalles de la nueva mesa. El número sugerido es el siguiente disponible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableNumber" className="text-right">
                Número
              </Label>
              <Input
                id="tableNumber"
                type="number"
                min={1}
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value ? parseInt(e.target.value) : "")}
                className="col-span-3"
                placeholder="Ej: 1, 2, 3..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableCapacity" className="text-right">
                Capacidad
              </Label>
              <Input
                id="tableCapacity"
                type="number"
                min={1}
                max={20}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                className="col-span-3"
                placeholder="Número de personas"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              La capacidad indica cuántas personas pueden sentarse en esta mesa.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddTableDialogOpen(false)}
              disabled={isCreatingTable}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddTable}
              disabled={isCreatingTable || !newTableNumber}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingTable ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Mesa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar mesa */}
      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar Mesa {tableToDelete?.number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La mesa será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTable}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              disabled={isDeletingTable}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingTable ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOrderModalOpen && selectedTable && (
        <OrderModal
          key={selectedTable.id}
          isOpen={isOrderModalOpen}
          onClose={closeOrderModal}
          selectedTable={selectedTable}
          menuItems={menuItems}
          categories={categories}
          onAddItem={onAddItemToOrder}
          onDecreaseQuantity={onDecreaseQuantity}
          onRemoveItem={onRemoveItem}
          onCloseAccount={handleCloseAccount}
        />
      )}
    </>
  )
}
