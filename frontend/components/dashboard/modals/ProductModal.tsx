"use client"

import { useState, useRef } from "react"
import { Save, Upload, X, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/contexts/ThemeContext"
import { getProductImageUrl } from "@/lib/utils"
import type { MenuItem, Category, ProductForm } from "@/types"

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  editingProduct: MenuItem | null
  productForm: ProductForm
  setProductForm: (form: ProductForm) => void
  categories: Category[]
  onSave: () => void
  onImageUpload?: (file: File) => Promise<string | null>
  isUploading?: boolean
}

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  productForm,
  setProductForm,
  categories,
  onSave,
  onImageUpload,
  isUploading = false,
}: ProductModalProps) {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)')
      return
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 5MB')
      return
    }

    setUploadError(null)

    // Mostrar preview local inmediatamente
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    // Subir imagen al servidor
    if (onImageUpload) {
      const uploadedUrl = await onImageUpload(file)
      if (uploadedUrl) {
        setProductForm({ ...productForm, image_url: uploadedUrl })
        // Mantenemos el previewURL para evitar el pestañeo "blanco" mientras carga la remota
        // se limpiará al cerrar el modal o cambiar de imagen
      } else {
        setUploadError('Error al subir la imagen')
        setPreviewUrl(null)
      }
    }
  }

  const handleRemoveImage = () => {
    setProductForm({ ...productForm, image_url: '' })
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Limpiar preview cuando se cierra el modal
  const handleClose = () => {
    setPreviewUrl(null)
    setUploadError(null)
    onClose()
  }

  // Determinar qué imagen mostrar
  const displayImage = previewUrl || getProductImageUrl(productForm.image_url)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-name">Nombre del Producto</Label>
            <Input
              id="product-name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="Ej: Arepa de Chócolo"
            />
          </div>
          <div>
            <Label htmlFor="product-price">Precio</Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="product-category">Categoría</Label>
            <Select
              value={productForm.category}
              onValueChange={(value) => setProductForm({ ...productForm, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Descripción del producto..."
              rows={3}
            />
          </div>

          {/* Sección de imagen mejorada */}
          <div className="space-y-2">
            <Label>Imagen del Producto</Label>

            {/* Input oculto para seleccionar archivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview de imagen o botón para subir */}
            {displayImage ? (
              <div className="relative group">
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={displayImage}
                    alt="Preview del producto"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg'
                    }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span className="text-sm">Subiendo...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleOpenFileDialog}
                    className="h-8 w-8 p-0"
                    title="Cambiar imagen"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveImage}
                    className="h-8 w-8 p-0"
                    title="Eliminar imagen"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={handleOpenFileDialog}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Haz clic para subir una imagen</span>
                <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (máx. 5MB)</span>
              </div>
            )}

            {/* Mensaje de error */}
            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}

            {/* Campo alternativo para URL manual */}
            <div className="pt-2">
              <Label htmlFor="product-image-url" className="text-xs text-gray-500">
                O ingresa una URL directamente:
              </Label>
              <Input
                id="product-image-url"
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="product-prep-time">Tiempo de preparación (minutos)</Label>
            <Input
              id="product-prep-time"
              type="number"
              min={0}
              value={productForm.preparation_time}
              onChange={(e) => setProductForm({ ...productForm, preparation_time: e.target.value })}
              placeholder="Ej: 15"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Producto Disponible</Label>
            <Switch
              checked={productForm.available}
              onCheckedChange={(checked) => setProductForm({ ...productForm, available: checked })}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={isUploading}
              className={`flex-1 bg-gradient-to-r ${theme.buttonPreset.gradient} hover:opacity-90 text-white`}
            >
              <Save className="w-4 h-4 mr-2" />
              {isUploading ? "Subiendo..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
