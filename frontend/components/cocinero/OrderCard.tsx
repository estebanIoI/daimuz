"use client"

import { Timer, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductImageUrl } from "@/lib/utils"
import type { KitchenOrder } from "@/types"


interface OrderCardProps {
  order: KitchenOrder
  onUpdateStatus: (orderId: number, newStatus: KitchenOrder["status"]) => void
}

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const getStatusColor = (status: KitchenOrder["status"]) => {
    switch (status) {
      case "pendiente":
        return "bg-red-500"
      case "preparacion":
        return "bg-yellow-500"
      case "listo":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: KitchenOrder["status"]) => {
    switch (status) {
      case "pendiente":
        return "Pendiente"
      case "preparacion":
        return "En Preparación"
      case "listo":
        return "Listo"
      default:
        return "Desconocido"
    }
  }

  const getBorderColor = (status: KitchenOrder["status"]) => {
    switch (status) {
      case "pendiente":
        return "border-l-red-500 bg-red-50"
      case "preparacion":
        return "border-l-yellow-500 bg-yellow-50"
      case "listo":
        return "border-l-green-500 bg-green-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  return (
    <Card className={`border-l-4 ${getBorderColor(order.status)} transition-all duration-300 hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Mesa {order.tableNumber}</span>
            {order.items.some(item => item.isNew) && (
              <Badge className="bg-blue-500 text-white animate-pulse">
                🆕 PRODUCTOS NUEVOS
              </Badge>
            )}
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{order.waiter}</span>
          <Badge variant="outline" className={`${getStatusColor(order.status)} text-white`}>
            {getStatusText(order.status)}
          </Badge>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {order.time}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {order.items.map((item, index) => {
            // Siempre mostrar en verde los productos servidos
            // Mostrar en rojo los productos nuevos (isNew)
            let itemBg = "bg-white";
            let border = "border";
            let text = "text-gray-800";
            let notify = false;
            if (item.status === "servido" || item.wasServed === true) {
              itemBg = "bg-green-500";
              border = "border-green-600";
              text = "text-white";
            } else if (item.isNew) {
              itemBg = "bg-red-500";
              border = "border-red-600";
              text = "text-white";
            }
            // Notificación si la cantidad aumentó
            if (typeof item.prevQuantity === 'number' && item.quantity > item.prevQuantity) {
              notify = true;
            }
            return (
              <div key={index} className={`flex justify-between items-start p-2 rounded ${itemBg} ${border} gap-2`}>
                {/* Imagen del producto */}
                {item.image_url && (
                  <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100">
                    <img
                      src={getProductImageUrl(item.image_url) || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg'
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${text}`}>{item.name}</p>
                    {notify && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded animate-pulse font-semibold">Cantidad aumentada</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-orange-600 italic bg-orange-50 px-2 py-1 rounded mt-1">
                      📝 Nota: {item.notes}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={`ml-2 font-bold ${text} ${itemBg} border-none`}>
                  x{item.quantity}
                </Badge>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2">
          {(() => {
            const hasNewItems = order.items.some(item => item.isNew)
            const hasReadyItems = order.items.some(item => item.status === "servido")

            if (order.status === "pendiente") {
              return (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, "preparacion")}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  <Timer className="w-4 h-4 mr-1" />
                  Iniciar Preparación
                </Button>
              )
            }

            if (order.status === "preparacion") {
              return (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, "listo")}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Marcar Listo
                </Button>
              )
            }

            if (order.status === "listo") {
              if (hasNewItems) {
                return (
                  <div className="flex gap-2 w-full">
                    <div className="flex-1 text-center py-2 bg-green-100 rounded text-green-800 font-medium border border-green-200">
                      ✅ Productos Anteriores Listos
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(order.id, "preparacion")}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Timer className="w-4 h-4 mr-1" />
                      Preparar Nuevos
                    </Button>
                  </div>
                )
              } else {
                return (
                  <div className="flex-1 text-center py-2 bg-green-100 rounded text-green-800 font-medium border border-green-200">
                    ✅ Pedido Completado
                  </div>
                )
              }
            }

            return null
          })()}
        </div>
      </CardContent>
    </Card>
  )
}
