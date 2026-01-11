import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import type { User } from "@/types"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: any) => void
  editingUser?: User | null
}

export function UserModal({ isOpen, onClose, onSave, editingUser }: UserModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "mesero",
    active: true,
  })

  // Update form when editing user changes
  useEffect(() => {
    if (editingUser) {
      setForm({
        name: editingUser.name,
        email: editingUser.email,
        password: "", // Don't show existing password
        role: editingUser.role,
        active: editingUser.active,
      })
    } else {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "mesero",
        active: true,
      })
    }
  }, [editingUser])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = () => {
    // For editing, don't send empty password
    const submitData = { ...form }
    if (editingUser && !submitData.password) {
      const { password, ...dataWithoutPassword } = submitData
      onSave(dataWithoutPassword)
    } else {
      onSave(submitData)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nombre completo"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              {editingUser ? "Nueva Contraseña (dejar vacío para mantener actual)" : "Contraseña"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="mesero">Mesero</SelectItem>
                <SelectItem value="cajero">Cajero</SelectItem>
                <SelectItem value="cocinero">Cocinero</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(checked) => setForm({ ...form, active: checked })}
            />
            <Label htmlFor="active">Usuario Activo</Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600">
              {editingUser ? "Actualizar Usuario" : "Guardar Usuario"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
