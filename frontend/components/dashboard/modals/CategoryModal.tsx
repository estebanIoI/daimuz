"use client"

import type React from "react"

import { Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/contexts/ThemeContext"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryName: string
  setCategoryName: (name: string) => void
  categoryDescription: string
  setCategoryDescription: (description: string) => void
  onSave: () => void
}

export function CategoryModal({
  isOpen,
  onClose,
  categoryName,
  setCategoryName,
  categoryDescription,
  setCategoryDescription,
  onSave,
}: CategoryModalProps) {
  const { theme } = useTheme()
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Categoría</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category-name">Nombre de la Categoría</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej: Sopas, Ensaladas, etc."
              onKeyDown={handleKeyDown}
            />
          </div>
          <div>
            <Label htmlFor="category-description">Descripción</Label>
            <Input
              id="category-description"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Descripción breve de la categoría"
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              className={`flex-1 bg-gradient-to-r ${theme.buttonPreset.gradient} hover:opacity-90 text-white`}
              disabled={!categoryName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
