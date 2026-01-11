"use client"

import { useState } from "react"
import { X, UserPlus, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Table } from "@/types"

interface AddGuestModalProps {
  isOpen: boolean
  onClose: () => void
  table: Table
  onAddGuest: (tableId: number, guestName: string, phone?: string) => Promise<void>
}

export function AddGuestModal({ isOpen, onClose, table, onAddGuest }: AddGuestModalProps) {
  const [guestName, setGuestName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!guestName.trim()) {
      setError("El nombre del cliente es obligatorio")
      return
    }

    try {
      setLoading(true)
      await onAddGuest(table.id, guestName.trim(), phone.trim() || undefined)
      // Limpiar campos y cerrar modal en caso de éxito
      setGuestName("")
      setPhone("")
      onClose()
    } catch (err: any) {
      setError(err.message || "Error al agregar el cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setGuestName("")
    setPhone("")
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Agregar Cliente</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="text-center mb-4">
            <p className="text-gray-600">
              Agregar cliente a la <span className="font-bold text-green-600">Mesa {table.number}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Para clientes sin celular para escanear el código QR
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="guestName" className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-500" />
              Nombre del Cliente *
            </Label>
            <Input
              id="guestName"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-gray-500" />
              Teléfono (opcional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej: 300 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600"
              disabled={loading || !guestName.trim()}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
