"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Calculator, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActiveOrder } from "@/types"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedOrder: ActiveOrder | null
  paymentMethod: "efectivo" | "tarjeta" | "nequi"
  onPaymentMethodChange: (method: "efectivo" | "tarjeta" | "nequi") => void
  onProcessPayment: () => void
}

export function PaymentModal({
  isOpen,
  onClose,
  selectedOrder,
  paymentMethod,
  onPaymentMethodChange,
  onProcessPayment,
}: PaymentModalProps) {
  const [amountReceived, setAmountReceived] = useState("")
  const [change, setChange] = useState(0)
  const [isValidPayment, setIsValidPayment] = useState(false)

  // Reset calculator when modal opens/closes or order changes
  useEffect(() => {
    if (isOpen && selectedOrder) {
      setAmountReceived("")
      setChange(0)
      setIsValidPayment(false)
    }
  }, [isOpen, selectedOrder])

  // Calculate change when amount received changes
  useEffect(() => {
    if (selectedOrder && amountReceived) {
      const received = Number(amountReceived.replace(/[^\d]/g, ""))
      const total = selectedOrder.total
      const calculatedChange = received - total

      setChange(calculatedChange)
      setIsValidPayment(received >= total)
    } else {
      setChange(0)
      setIsValidPayment(false)
    }
  }, [amountReceived, selectedOrder])

  // Format currency input
  const handleAmountChange = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/[^\d]/g, "")

    // Format with thousands separator
    if (numbers) {
      const formatted = Number(numbers).toLocaleString()
      setAmountReceived(formatted)
    } else {
      setAmountReceived("")
    }
  }

  // Quick amount buttons
  const quickAmounts = [50000, 100000, 200000]

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toLocaleString())
  }

  const handleProcessPayment = () => {
    if (paymentMethod === "efectivo" && !isValidPayment) {
      return
    }
    onProcessPayment()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Procesar Pago - Mesa {selectedOrder?.tableNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Resumen del Pedido</h4>
            <div className="space-y-1">
              {selectedOrder?.items.map((item, index) => (
                <p key={index} className="text-sm text-blue-700">
                  {item}
                </p>
              ))}
            </div>
            <div className="border-t border-blue-200 mt-3 pt-3">
              <p className="text-lg font-bold text-blue-800">Total: ${selectedOrder?.total.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                <SelectItem value="nequi">📱 Nequi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cash Calculator */}
          {paymentMethod === "efectivo" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h4 className="font-medium text-green-800 text-sm sm:text-base">Calculadora de Cambio</h4>
              </div>

              {/* Amount Received Input */}
              <div>
                <Label htmlFor="amount-received" className="text-xs sm:text-sm font-medium text-gray-700">
                  Dinero Recibido
                </Label>
                <Input
                  id="amount-received"
                  type="text"
                  value={amountReceived}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="text-base sm:text-lg font-bold text-center mt-1 h-10 sm:h-12"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">Montos Rápidos</Label>
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="text-xs px-2 py-1 h-8 sm:h-9"
                    >
                      ${amount.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Change Calculation */}
              {amountReceived && (
                <div className="border-t border-green-200 pt-2 sm:pt-3">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Total a pagar:</span>
                      <span className="font-medium text-sm sm:text-base">${selectedOrder?.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Dinero recibido:</span>
                      <span className="font-medium text-sm sm:text-base">${amountReceived}</span>
                    </div>
                  </div>
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Cambio a devolver:</span>
                      <span
                        className={`text-base sm:text-lg font-bold ${change >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        ${Math.abs(change).toLocaleString()}
                      </span>
                    </div>
                    {change < 0 && (
                      <p className="text-xs text-red-600 mt-1">⚠️ Falta dinero: ${Math.abs(change).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={onClose} className="w-full sm:flex-1 bg-transparent order-2 sm:order-1">
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={paymentMethod === "efectivo" && !isValidPayment}
              className="w-full sm:flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base">
                {paymentMethod === "efectivo" && !isValidPayment ? "Dinero Insuficiente" : "Confirmar Pago"}
              </span>
            </Button>
          </div>

          {/* Payment Instructions */}
          {paymentMethod !== "efectivo" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                {paymentMethod === "tarjeta" && "💳 Procesar pago con tarjeta en el datáfono"}
                {paymentMethod === "nequi" && "📱 Solicitar transferencia Nequi al cliente"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
