"use client"

import { ShoppingCart, PlusCircle, Plus, Minus, X, CreditCard } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/formatters"
import type { Table, MenuItem, Category } from "@/types"

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTable: Table | null
  menuItems: MenuItem[]
  categories: Category[]
  onAddItem: (tableId: number, menuItem: MenuItem) => void
  onDecreaseQuantity: (tableId: number, orderId: number) => void
  onRemoveItem: (tableId: number, orderId: number) => void
  onCloseAccount: (tableId: number) => void
}

export function OrderModal({
  isOpen,
  onClose,
  selectedTable,
  menuItems,
  categories,
  onAddItem,
  onDecreaseQuantity,
  onRemoveItem,
  onCloseAccount,
}: OrderModalProps) {
  const availableMenuItems = menuItems.filter((item) => item.available)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Mesa {selectedTable?.number} - Gestión de Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Menu Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Agregar Productos</h3>
            <div className="h-[55vh] overflow-auto pr-2">
              {categories.map((category) => (
                <div key={category.id} className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3 sticky top-0 bg-white py-2">{category.name}</h4>
                  <div className="space-y-2">
                    {availableMenuItems
                      .filter((item) => item.category_id === category.id)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(parseFloat(item.price.toString()))}</p>
                            {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => selectedTable && onAddItem(selectedTable.id, item)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Order Section */}
          <div className="space-y-4 h-full overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-800">Pedido Actual</h3>
            <ScrollArea className="h-[55vh] pr-2">
              {selectedTable?.orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay productos en el pedido</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTable?.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{order.menuItem.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(parseFloat(order.menuItem.price.toString()))} x {order.quantity}
                        </p>
                        <p className="text-sm font-medium text-orange-600">
                          Total: {formatCurrency(parseFloat((order.menuItem.price * order.quantity).toString()))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectedTable && onDecreaseQuantity(selectedTable.id, order.id)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{order.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectedTable && onAddItem(selectedTable.id, order.menuItem)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => selectedTable && onRemoveItem(selectedTable.id, order.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedTable && selectedTable.orders.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-orange-600">{formatCurrency(parseFloat(selectedTable.total.toString()))}</span>
                </div>
                <Button
                  onClick={() => selectedTable && onCloseAccount(selectedTable.id)}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cerrar Cuenta
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
