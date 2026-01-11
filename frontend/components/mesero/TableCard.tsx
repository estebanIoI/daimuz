"use client"

import { Plus, StickyNote, QrCode, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Table } from "@/types"

interface TableCardProps {
  table: Table
  onOpenModal: (table: Table) => void
  onOpenQRModal?: (table: Table) => void
  onOpenAddGuestModal?: (table: Table) => void
}

export function TableCard({ table, onOpenModal, onOpenQRModal, onOpenAddGuestModal }: TableCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-95 sm:hover:scale-105 ${
        table.status === "ocupada"
          ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100"
          : "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
      onClick={() => onOpenModal(table)}
    >
      <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-4">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <CardTitle className="text-sm sm:text-lg font-bold text-gray-800 truncate">Mesa {table.number}</CardTitle>
            {table.tableNotes && (
              <StickyNote className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <Badge
            variant={table.status === "ocupada" ? "default" : "secondary"}
            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0 ${table.status === "ocupada" ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}`}
          >
            {table.status === "ocupada" ? "✅" : "⚪"}
            <span className="hidden sm:inline ml-1">{table.status === "ocupada" ? "Ocupada" : "Libre"}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 pt-0">
        {table.status === "ocupada" ? (
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] sm:text-sm text-gray-600">
                {table.orders.length} item{table.orders.length !== 1 ? "s" : ""}
              </p>
              <p className="text-sm sm:text-xl font-bold text-green-600">${Number(table.total).toLocaleString('es-CO')}</p>
            </div>
            {/* Lista compacta de productos - solo en pantallas grandes */}
            <div className="hidden sm:block text-xs text-gray-500 max-h-20 overflow-y-auto">
              {table.orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex justify-between items-center mb-0.5">
                  <div className="flex items-center gap-1 truncate flex-1 mr-2">
                    <span className="truncate">{order.menuItem.name}</span>
                    {order.notes && <StickyNote className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />}
                  </div>
                  <span className={`text-[10px] px-1 rounded ${
                    order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'preparacion' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'listo' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'pendiente' ? '⏳' : order.status === 'preparacion' ? '👨‍🍳' : order.status === 'listo' ? '✅' : '🍽️'}
                  </span>
                </div>
              ))}
              {table.orders.length > 3 && (
                <p className="text-[10px] text-gray-400">+{table.orders.length - 3} más...</p>
              )}
            </div>
            {/* Indicadores de estado compactos para móvil */}
            <div className="flex sm:hidden gap-1 flex-wrap">
              {table.orders.some(o => o.status === 'listo') && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">✅ {table.orders.filter(o => o.status === 'listo').length}</span>
              )}
              {table.orders.some(o => o.status === 'preparacion') && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">👨‍🍳 {table.orders.filter(o => o.status === 'preparacion').length}</span>
              )}
              {table.orders.some(o => o.status === 'pendiente') && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">⏳ {table.orders.filter(o => o.status === 'pendiente').length}</span>
              )}
            </div>
            <Button
              size="sm"
              className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-[10px] sm:text-sm h-7 sm:h-9"
              onClick={(e) => {
                e.stopPropagation()
                onOpenModal(table)
              }}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Agregar Producto</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
            {onOpenQRModal && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1 border-purple-300 text-purple-600 hover:bg-purple-50 text-[10px] sm:text-sm h-7 sm:h-9"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenQRModal(table)
                }}
              >
                <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Código QR</span>
                <span className="sm:hidden">QR</span>
              </Button>
            )}
            {onOpenAddGuestModal && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1 border-blue-300 text-blue-600 hover:bg-blue-50 text-[10px] sm:text-sm h-7 sm:h-9"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAddGuestModal(table)
                }}
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Agregar Cliente</span>
                <span className="sm:hidden">Cliente</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-2">
            <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Disponible</p>
            <Button
              size="sm"
              className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-[10px] sm:text-sm h-7 sm:h-9"
              onClick={(e) => {
                e.stopPropagation()
                onOpenModal(table)
              }}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Nuevo Pedido</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
            {onOpenQRModal && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1 border-purple-300 text-purple-600 hover:bg-purple-50 text-[10px] sm:text-sm h-7 sm:h-9"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenQRModal(table)
                }}
              >
                <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Código QR</span>
                <span className="sm:hidden">QR</span>
              </Button>
            )}
            {onOpenAddGuestModal && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-1 border-blue-300 text-blue-600 hover:bg-blue-50 text-[10px] sm:text-sm h-7 sm:h-9"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAddGuestModal(table)
                }}
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Agregar Cliente</span>
                <span className="sm:hidden">Cliente</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
