"use client"

import { useEffect, useState, useMemo } from "react"
import { useApi } from "@/hooks/useApi"
import { Plus, Minus, X, ShoppingCart, PlusCircle, StickyNote, Edit3, ChefHat, ChevronLeft, ChevronRight, Users, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MenuItem, Table, OrderItem } from "@/types"

interface TableGuest {
  id: number
  name?: string
  guest_name?: string
  phone?: string
  total_spent: number
  item_count: number
}

// Helper para obtener el nombre del cliente de forma segura
const getGuestName = (guest: TableGuest): string => {
  return guest.guest_name || guest.name || 'Cliente'
}

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTable: Table | null
  menuItems: MenuItem[]
  menuCategories: string[]
  onAddItem: (tableId: number, menuItem: MenuItem, notes?: string, guestId?: number | null) => void
  onRemoveItem: (tableId: number, orderItemId: number) => void
  onDecreaseQuantity: (tableId: number, orderItemId: number) => void
  onUpdateTableNotes?: (tableId: number, notes: string) => void
  onUpdateItemNotes?: (tableId: number, orderItemId: number, notes: string) => void
  newGuestName?: string | null // Nombre del cliente recién agregado
  newGuestId?: number | null // ID del cliente recién agregado
  onClearNewGuest?: () => void // Función para limpiar el nombre del cliente
}

export function OrderModal({
  isOpen,
  onClose,
  selectedTable,
  menuItems,
  menuCategories,
  onAddItem,
  onRemoveItem,
  onDecreaseQuantity,
  onUpdateTableNotes,
  onUpdateItemNotes,
  newGuestName,
  newGuestId,
  onClearNewGuest,
}: OrderModalProps) {
  const { apiCall } = useApi()
  const [tableNotes, setTableNotes] = useState(selectedTable?.tableNotes || "")
  const [newItemNotes, setNewItemNotes] = useState<{[key: number]: string}>({})
  const [editingItemNotes, setEditingItemNotes] = useState<{[key: number]: string}>({})
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>({})
  const [categoryPage, setCategoryPage] = useState(0)
  
  // Estado para clientes de la mesa
  const [tableGuests, setTableGuests] = useState<TableGuest[]>([])
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null)
  const [loadingGuests, setLoadingGuests] = useState(false)

  // Helper para construir URL de imagen
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
    return `${baseUrl}${url}`
  }

  // Colores aleatorios para las categorías
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500', 
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500'
  ]

  // Cargar clientes de la mesa cuando se abre el modal
  useEffect(() => {
    const fetchTableGuests = async () => {
      if (!selectedTable?.id || !isOpen) return
      
      try {
        setLoadingGuests(true)
        const result = await apiCall("cashier.getTableGuests", { table_id: selectedTable.id })
        setTableGuests(result.guests || [])
        
        // Si hay un cliente recién agregado, seleccionarlo automáticamente
        if (newGuestId) {
          setSelectedGuestId(newGuestId)
        }
      } catch (error) {
        console.error("Error al obtener clientes de la mesa:", error)
        setTableGuests([])
      } finally {
        setLoadingGuests(false)
      }
    }
    
    fetchTableGuests()
  }, [selectedTable?.id, isOpen, apiCall, newGuestId])

  // Asignar colores aleatorios a categorías
  useEffect(() => {
    const newColors: {[key: string]: string} = {}
    menuCategories.forEach((category, index) => {
      newColors[category] = colors[index % colors.length]
    })
    setCategoryColors(newColors)
  }, [menuCategories])

  // Actualizar las notas cuando cambie la mesa seleccionada - Simplificado
  useEffect(() => {
    setTableNotes(selectedTable?.tableNotes || "")
  }, [selectedTable?.id, selectedTable?.tableNotes])

  // Obtener el guest_id a usar (prioridad: newGuestId > selectedGuestId > null)
  const activeGuestId = newGuestId ?? selectedGuestId

  // Función para manejar la adición de producto con notas - Simplificada
  const handleAddItemWithNotes = (menuItem: MenuItem) => {
    if (!selectedTable) return
    
    const notes = newItemNotes[menuItem.id] || ""
    onAddItem(selectedTable.id, menuItem, notes, activeGuestId)
    
    // Limpiar las notas después de agregar
    setNewItemNotes(prev => ({...prev, [menuItem.id]: ""}))
    setShowNotesFor(null)
  }

  // Función para agregar item - Simplificada como el dashboard
  const handleAddItem = (menuItem: MenuItem, notes?: string) => {
    if (!selectedTable) return
    onAddItem(selectedTable.id, menuItem, notes, activeGuestId)
  }

  // Función para decrementar cantidad - Simplificada como el dashboard
  const handleDecreaseQuantity = (orderItemId: number) => {
    if (!selectedTable) return
    onDecreaseQuantity(selectedTable.id, orderItemId)
  }

  // Función para remover item - Simplificada como el dashboard
  const handleRemoveItem = (orderItemId: number) => {
    if (!selectedTable) return
    onRemoveItem(selectedTable.id, orderItemId)
  }

  // Función para guardar notas de la mesa
  const handleSaveTableNotes = () => {
    if (selectedTable && onUpdateTableNotes) {
      onUpdateTableNotes(selectedTable.id, tableNotes)
    }
  }

  // Función para guardar notas de un item
  const handleSaveItemNotes = (orderItemId: number) => {
    if (selectedTable && onUpdateItemNotes) {
      const notes = editingItemNotes[orderItemId] || ""
      onUpdateItemNotes(selectedTable.id, orderItemId, notes)
      setEditingItemNotes(prev => {
        const newState = {...prev}
        delete newState[orderItemId]
        return newState
      })
    }
  }

  // Filtrar solo los items disponibles
  const availableMenuItems = menuItems.filter((item) => item.available)

  // Paginación para categorías (4 por página para el nuevo diseño)
  const categoriesPerPage = 4
  const totalCategoryPages = Math.ceil(menuCategories.length / categoriesPerPage)
  const currentCategories = menuCategories.slice(
    categoryPage * categoriesPerPage,
    (categoryPage + 1) * categoriesPerPage
  )

  // Pedido actual - usar directamente los datos de selectedTable como en el dashboard
  const currentOrders = selectedTable?.orders || []
  const currentTotal = selectedTable?.total || 0

  // Resetear páginas cuando cambie la mesa
  useEffect(() => {
    setCategoryPage(0)
  }, [selectedTable?.id])

  // Debug: mostrar datos en consola
  console.log("Menu Categories:", menuCategories)
  console.log("Available Menu Items:", availableMenuItems.slice(0, 2)) // Solo los primeros 2 para no saturar
  console.log("First item category:", availableMenuItems[0]?.category)
  console.log("First item category_name:", availableMenuItems[0]?.category_name)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[98vh] w-full sm:w-[98vw] overflow-hidden border-0 sm:border-2 border-blue-400 bg-white/95 shadow-2xl rounded-none sm:rounded-lg p-0 sm:p-6">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-0 border-b sm:border-0 border-gray-200 bg-gradient-to-r from-green-500 to-emerald-500 sm:from-transparent sm:to-transparent">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-white sm:text-gray-800">
            🍽️ Mesa {selectedTable?.number} - Pedido
          </DialogTitle>
        </DialogHeader>

        {/* Banner de cliente recién agregado */}
        {newGuestName && (
          <div className="mx-2 sm:mx-0 mt-2 sm:mt-0 mb-2 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-lg p-3 flex items-center justify-between shadow-md animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-green-800 font-bold text-sm sm:text-base">
                  ¡Completa el pedido para {newGuestName}!
                </p>
                <p className="text-green-600 text-xs sm:text-sm">
                  Selecciona los productos del menú para este cliente
                </p>
              </div>
            </div>
            <button
              onClick={onClearNewGuest}
              className="text-green-600 hover:text-green-800 p-1 hover:bg-green-200 rounded-full transition-colors"
              title="Cerrar mensaje"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selector de cliente para asignar productos */}
        {tableGuests.length > 0 && !newGuestName && (
          <div className="mx-2 sm:mx-0 mt-2 sm:mt-0 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Asignar pedido a:</span>
              </div>
              <Select
                value={selectedGuestId?.toString() || "none"}
                onValueChange={(value) => setSelectedGuestId(value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[280px] bg-white border-blue-300 focus:ring-blue-500">
                  <SelectValue>
                    {selectedGuestId 
                      ? (() => {
                          const guest = tableGuests.find(g => g.id === selectedGuestId)
                          return guest ? `👤 ${getGuestName(guest)} - $${guest.total_spent?.toLocaleString('es-CO') || '0'}` : '🛒 Mesa general'
                        })()
                      : '🛒 Mesa general (sin cliente)'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-gray-500" />
                      <span>Mesa general (sin cliente)</span>
                    </div>
                  </SelectItem>
                  {tableGuests.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{getGuestName(guest)}</span>
                        <span className="text-gray-500">-</span>
                        <span className="text-green-600 font-medium">
                          ${guest.total_spent?.toLocaleString('es-CO') || '0'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGuestId && (
                <Badge className="bg-blue-500 text-white flex-shrink-0">
                  Asignando a: {(() => {
                    const guest = tableGuests.find(g => g.id === selectedGuestId)
                    return guest ? getGuestName(guest) : 'Cliente'
                  })()}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Indicador de carga de clientes */}
        {loadingGuests && (
          <div className="mx-2 sm:mx-0 mb-2 text-center text-sm text-gray-500">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Cargando clientes...
            </div>
          </div>
        )}

        {/* Contenedor principal con scroll adaptativo */}
        <div className="flex flex-col h-full max-h-[calc(100dvh-60px)] sm:max-h-[85vh] overflow-hidden p-2 sm:p-0">
          {/*
          Notas generales de la mesa
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex-shrink-0">
            <Label htmlFor="table-notes" className="text-sm font-medium text-blue-800 mb-2 block">
              📝 Notas generales de la mesa
            </Label>
            <div className="flex gap-2">
              <Textarea
                id="table-notes"
                placeholder="Ej: Cliente alérgico a mariscos, mesa para celebración..."
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
                className="flex-1 bg-white"
                rows={2}
              />
              <Button 
                onClick={handleSaveTableNotes}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
              >
                Guardar
              </Button>
            </div>
          </div>
          */}

          {/* Contenedor adaptativo para menú y pedido */}
          <div className="flex-1 min-h-0 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full divide-y lg:divide-y-0 lg:divide-x divide-gray-200 overflow-hidden">
          {/* Menu Section - Encapsulado */}
          <div className="h-[45vh] sm:h-full flex flex-col min-h-0 p-2 sm:p-4">
            <div className="flex items-center justify-between flex-shrink-0 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Menú</h3>
              </div>
              {/* Paginación de categorías */}
              {!selectedCategory && totalCategoryPages > 1 && (
                <div className="flex items-center gap-1 md:gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-sm">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCategoryPage(prev => Math.max(0, prev - 1))}
                    disabled={categoryPage === 0}
                    className="h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-gray-600 font-medium px-2">
                    {categoryPage + 1} de {totalCategoryPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCategoryPage(prev => Math.min(totalCategoryPages - 1, prev + 1))}
                    disabled={categoryPage === totalCategoryPages - 1}
                    className="h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden min-h-0">
              {/* Vista de categorías cuando no hay ninguna seleccionada */}
              {!selectedCategory ? (
                <div className="h-full overflow-y-auto">
                  {/* Grid elegante con espaciado para las categorías */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4 h-auto sm:h-full p-1 sm:p-2">
                    {currentCategories.map((category) => {
                      const categoryItems = availableMenuItems.filter((item) => item.category_name === category)
                      const isHovered = activeCategory === category
                      const isExpanded = expandedCategory === category
                      
                      return (
                        <div key={category} className="relative min-h-[80px] sm:min-h-[120px] group">
                          {/* Tarjeta de categoría elegante */}
                          <div
                            className={`
                              relative p-2 sm:p-4 cursor-pointer transition-all duration-500 h-full flex flex-col justify-between
                              border border-gray-200 rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg active:scale-95 sm:active:scale-100
                              ${isHovered 
                                ? `bg-gradient-to-br ${categoryColors[category]} text-white shadow-xl transform sm:scale-105 z-10 border-transparent` 
                                : 'bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                              }
                            `}
                            onMouseEnter={() => setActiveCategory(category)}
                            onMouseLeave={() => setActiveCategory(null)}
                            onClick={() => setSelectedCategory(category)}
                          >
                            {/* Icono decorativo elegante */}
                            <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isHovered ? 'bg-white/20 scale-110' : `bg-gradient-to-r ${categoryColors[category]} shadow-md`
                            }`}>
                              <ChefHat className={`w-3 h-3 sm:w-4 sm:h-4 ${isHovered ? 'text-white' : 'text-white'}`} />
                            </div>

                            {/* Indicador de categoria con gradiente */}
                            <div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r ${categoryColors[category]} ${isHovered ? 'opacity-100' : 'opacity-60'}`} />

                            {/* Contenido principal elegante */}
                            <div className="flex flex-col gap-1 sm:gap-2 pr-7 sm:pr-10 pt-1 sm:pt-2">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                                  isHovered ? 'bg-white animate-pulse' : `bg-gradient-to-r ${categoryColors[category]}`
                                }`} />
                                
                                <h3 className={`text-xs sm:text-sm font-bold transition-all duration-300 line-clamp-1 ${isHovered ? 'text-white' : 'text-gray-800'}`}>
                                  {category}
                                </h3>
                              </div>
                              
                              <Badge 
                                variant={isHovered ? "secondary" : "outline"} 
                                className={`text-[10px] sm:text-xs w-fit px-1.5 sm:px-2 py-0.5 sm:py-1 transition-all duration-300 ${
                                  isHovered 
                                    ? 'bg-white/20 text-white border-white/30 shadow-md' 
                                    : `bg-gradient-to-r ${categoryColors[category]}/10 text-gray-700 border-gray-200`
                                }`}
                              >
                                {categoryItems.length} prod.
                              </Badge>

                              {categoryItems.length > 0 && (
                                <p className={`text-[10px] sm:text-xs leading-relaxed font-medium transition-all duration-300 ${
                                  isHovered ? 'text-white/90' : 'text-gray-600'
                                }`}>
                                  ${Math.round(Math.min(...categoryItems.map(item => parseFloat(item.price.toString())))).toLocaleString('es-CO')}
                                </p>
                              )}
                            </div>

                            {/* Footer elegante con hover */}
                            <div className="flex items-center justify-end mt-1 sm:mt-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCategory(category)
                                }}
                                className={`h-5 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs transition-all duration-300 rounded-lg ${
                                  isHovered 
                                    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/20' 
                                    : `bg-gradient-to-r ${categoryColors[category]}/10 text-gray-700 hover:bg-gradient-to-r hover:${categoryColors[category]}/20 border border-gray-200`
                                }`}
                                title="Ver todos los productos"
                              >
                                Ver →
                              </Button>
                            </div>

                            {/* Efecto de brillo elegante al hacer hover */}
                            {isHovered && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-xl" />
                            )}

                            {/* Sombra interna sutil */}
                            <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                              isHovered ? 'shadow-inner' : ''
                            }`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* Vista de productos de la categoría seleccionada con animación de desprendimiento */
                <div className="h-full flex flex-col animate-in slide-in-from-bottom duration-700 ease-out">
                  {/* Header de categoría seleccionada con animación */}
                  <div className={`
                    flex-shrink-0 p-2 sm:p-4 bg-gradient-to-r ${categoryColors[selectedCategory]} text-white shadow-2xl
                    animate-in slide-in-from-top duration-500 ease-out
                  `}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCategory(null)}
                          className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white transition-all duration-300 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                        >
                          ← Volver
                        </Button>
                        <h3 className="text-sm sm:text-xl font-bold animate-in fade-in duration-700 line-clamp-1">{selectedCategory}</h3>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 animate-in fade-in duration-700 delay-200 text-[10px] sm:text-xs hidden sm:inline-flex">
                          {availableMenuItems.filter(item => item.category_name === selectedCategory).length} productos
                        </Badge>
                      </div>
                      <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 animate-bounce flex-shrink-0" />
                    </div>
                  </div>

                  {/* Lista de productos ocupando toda la tarjeta con animación escalonada */}
                  <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin min-h-0 bg-gray-50">
                    <div className="p-2 sm:p-4 space-y-2 sm:space-y-4">
                      {availableMenuItems
                        .filter((item) => item.category_name === selectedCategory)
                        .map((item, index) => (
                          <div
                            key={item.id}
                            className={`
                              border border-gray-200 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-xl hover:border-gray-300 bg-white
                              animate-in slide-in-from-right duration-500 ease-out active:scale-[0.98]
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-start sm:items-center justify-between p-2 sm:p-4 gap-2">
                              {/* Imagen del producto */}
                              {item.image_url && (
                                <div className="flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={getImageUrl(item.image_url) || '/placeholder.jpg'}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.jpg'
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-0 mb-1 sm:mb-2">
                                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r ${categoryColors[selectedCategory]} animate-pulse flex-shrink-0`} />
                                  <p className="font-bold text-gray-800 text-sm sm:text-lg line-clamp-1">{item.name}</p>
                                </div>
                                <p className="text-lg sm:text-2xl font-bold text-green-600 mb-1 sm:mb-2">
                                  ${Math.round(parseFloat(item.price.toString())).toLocaleString('es-CO')}
                                </p>
                                {item.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 bg-gray-50 p-1.5 sm:p-2 rounded-lg hidden sm:block">{item.description}</p>
                                )}
                                {item.preparation_time && (
                                  <div className="flex items-center gap-1 mt-1 sm:mt-2 p-1 sm:p-2 bg-orange-50 rounded-lg">
                                    <p className="text-[10px] sm:text-sm text-orange-700 font-medium">
                                      ⏱️ {item.preparation_time} min
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-center gap-1 sm:gap-2 ml-2 sm:ml-6 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowNotesFor(showNotesFor === item.id ? null : item.id)}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50 transition-all duration-300 h-7 sm:h-8 px-2 sm:px-3 text-xs"
                                  title="Agregar nota especial"
                                >
                                  <StickyNote className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Nota</span>
                                </Button>
                                <Button
                                  size="default"
                                  onClick={() => {
                                    if (showNotesFor === item.id && newItemNotes[item.id]) {
                                      handleAddItemWithNotes(item)
                                    } else {
                                      handleAddItem(item)
                                    }
                                  }}
                                  className={`
                                    transition-all duration-300 bg-gradient-to-r ${categoryColors[selectedCategory]} 
                                    hover:shadow-xl transform active:scale-95 sm:hover:scale-110 sm:hover:-translate-y-1
                                    text-white font-bold px-3 sm:px-6 py-2 sm:py-3 h-9 sm:h-11
                                  `}
                                  title="Agregar al pedido"
                                >
                                  <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                                  <span className="hidden sm:inline">Agregar</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* Campo de notas expandible con animación */}
                            {showNotesFor === item.id && (
                              <div className="px-4 pb-4 border-t border-gray-200 bg-blue-50/70 animate-in slide-in-from-top duration-300">
                                <Label className="text-sm text-blue-800 mb-3 block font-bold mt-3">
                                  💡 Agregar instrucciones especiales
                                </Label>
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Ej: Sin cebolla, término medio, extra picante, sin sal..."
                                    value={newItemNotes[item.id] || ""}
                                    onChange={(e) => setNewItemNotes(prev => ({
                                      ...prev,
                                      [item.id]: e.target.value
                                    }))}
                                    className="text-sm flex-1 border-blue-300 focus:border-blue-500"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddItemWithNotes(item)}
                                    disabled={!newItemNotes[item.id]?.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105"
                                  >
                                    <PlusCircle className="w-4 h-4 mr-1" />
                                    Agregar con nota
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mensaje si no hay productos disponibles */}
              {availableMenuItems.length === 0 && (
                <div className="text-center py-12">
                  <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No hay productos disponibles</p>
                  <p className="text-gray-400 text-sm">Contacta al administrador</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Order Section - Encapsulado */}
          <div className="h-[40vh] sm:h-full flex flex-col min-h-0 p-2 sm:p-4">
            <div className="flex items-center justify-between flex-shrink-0 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800">Pedido</h3>
                {currentOrders.length > 0 && (
                  <Badge variant="default" className="text-[10px] sm:text-xs bg-green-500 ml-1">
                    {currentOrders.length}
                  </Badge>
                )}
              </div>
              {currentOrders.length > 0 && (
                <span className="text-sm sm:text-lg font-bold text-green-600">
                  ${Math.round(currentTotal).toLocaleString('es-CO')}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden min-h-0">
              {currentOrders.length === 0 ? (
                <div className="text-center py-4 sm:py-12 flex flex-col items-center justify-center h-full">
                  <ShoppingCart className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm sm:text-lg">Pedido vacío</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Selecciona del menú</p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto scrollbar-thin">
                  <div className="space-y-2 md:space-y-3 pb-4">
                    {currentOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-2 md:p-3 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        {/* Header del producto - Diseño compacto responsivo */}
                        <div className="flex items-center justify-between gap-2 md:gap-3">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-800 text-xs md:text-sm truncate">{order.menuItem.name}</p>
                                {/* Indicador de estado del producto */}
                                {order.status && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs px-2 py-0.5 ${
                                      order.status === 'pendiente' 
                                        ? 'bg-gray-100 text-gray-700 border-gray-300' 
                                        : order.status === 'preparacion' 
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse' 
                                        : order.status === 'listo' 
                                        ? 'bg-green-100 text-green-700 border-green-300' 
                                        : 'bg-blue-100 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    {order.status === 'pendiente' && '⏳ Pendiente'}
                                    {order.status === 'preparacion' && '👨‍🍳 En Preparación'}
                                    {order.status === 'listo' && '✅ Listo'}
                                    {order.status === 'entregado' && '🍽️ Entregado'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 md:gap-2 mt-1">
                                <p className="text-xs text-gray-600">
                                  ${Math.round(parseFloat(order.menuItem.price.toString())).toLocaleString('es-CO')} × {order.quantity}
                                </p>
                                <p className="text-xs md:text-sm font-bold text-green-600">
                                  = ${Math.round(parseFloat((order.menuItem.price * order.quantity).toString())).toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Controles de cantidad - Compactos responsivos */}
                          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecreaseQuantity(order.id)}
                              className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-red-50 hover:border-red-200"
                              title="Disminuir cantidad"
                            >
                              <Minus className="w-2 h-2 md:w-3 md:h-3" />
                            </Button>
                            
                            <div className="w-6 h-5 md:w-8 md:h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                              <span className="font-bold text-xs">{order.quantity}</span>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddItem(order.menuItem)}
                              className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-green-50 hover:border-green-200"
                              title="Aumentar cantidad"
                            >
                              <Plus className="w-2 h-2 md:w-3 md:h-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(order.id)}
                              className="h-5 w-5 md:h-6 md:w-6 p-0 ml-1"
                              title="Eliminar producto"
                            >
                              <X className="w-2 h-2 md:w-3 md:h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Notas del producto - Compactas responsivas */}
                        {order.notes && !editingItemNotes[order.id] && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="text-amber-800 font-medium text-xs">💡 Nota:</span>
                                <p className="text-amber-700 text-xs mt-1">{order.notes}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingItemNotes(prev => ({
                                  ...prev,
                                  [order.id]: order.notes || ""
                                }))}
                                className="flex-shrink-0 h-5 w-5 md:h-6 md:w-6 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                                title="Editar nota"
                              >
                                <Edit3 className="w-2 h-2 md:w-3 md:h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Botón para agregar nota cuando no existe */}
                        {!order.notes && editingItemNotes[order.id] === undefined && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItemNotes(prev => ({
                                ...prev,
                                [order.id]: ""
                              }))}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-5 md:h-6 px-2"
                            >
                              <StickyNote className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              Agregar nota
                            </Button>
                          </div>
                        )}
                        
                        {/* Campo de edición de notas - Compacto responsivo */}
                        {editingItemNotes[order.id] !== undefined && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                            <Label className="text-xs font-medium text-blue-800">
                              ✏️ Editando nota especial
                            </Label>
                            <Textarea
                              placeholder="Ej: Sin cebolla, término medio, extra picante..."
                              value={editingItemNotes[order.id]}
                              onChange={(e) => setEditingItemNotes(prev => ({
                                ...prev,
                                [order.id]: e.target.value
                              }))}
                              className="text-xs bg-white"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveItemNotes(order.id)}
                                className="bg-blue-600 hover:bg-blue-700 h-5 md:h-6 px-2 text-xs"
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItemNotes(prev => {
                                  const newState = {...prev}
                                  delete newState[order.id]
                                  return newState
                                })}
                                className="h-5 md:h-6 px-2 text-xs"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedTable && currentOrders.length > 0 && (
              <div className="border-t pt-2 space-y-2 flex-shrink-0 bg-white -mx-2 sm:mx-0 px-2 sm:px-0">
                <div className="flex justify-between items-center text-sm sm:text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600 text-base sm:text-xl">${Math.round(currentTotal).toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <p className="text-[10px] sm:text-sm text-yellow-800">
                    ⚠️ El cajero se encargará del pago.
                  </p>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
