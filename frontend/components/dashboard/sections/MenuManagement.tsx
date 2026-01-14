"use client"

import { useState, useMemo } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductModal } from "@/components/dashboard/modals/ProductModal"
import { CategoryModal } from "@/components/dashboard/modals/CategoryModal"
import { useApi } from "@/hooks/useApi"
import { useTheme } from "@/contexts/ThemeContext"
import { getProductImageUrl } from "@/lib/utils"
import type { MenuItem, Category, ProductForm } from "@/types"

interface MenuManagementProps {
  menuItems: MenuItem[]
  setMenuItems: (items: MenuItem[]) => void
  categories: Category[]
  setCategories: (categories: Category[]) => void
  onRefreshMenu?: () => Promise<void>
  onRefreshCategories?: () => Promise<void>
}

export function MenuManagement({ menuItems, setMenuItems, categories, setCategories, onRefreshMenu, onRefreshCategories }: MenuManagementProps) {
  const { apiCall, uploadProductImage, uploading } = useApi()
  const { theme } = useTheme()
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 4


  // Paginación de categorías
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * categoriesPerPage
    const endIndex = startIndex + categoriesPerPage
    return categories.slice(startIndex, endIndex)
  }, [categories, currentPage, categoriesPerPage])

  const totalPages = Math.ceil(categories.length / categoriesPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    price: "",
    category: "",
    description: "",
    available: true,
    image_url: "",
    preparation_time: "",
  })

  const openProductModal = (product?: MenuItem) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        category: product.category_id.toString(),
        description: product.description || "",
        available: product.available,
        image_url: product.image_url || "",
        preparation_time: product.preparation_time ? product.preparation_time.toString() : "",
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: "",
        price: "",
        category: "",
        description: "",
        available: true,
        image_url: "",
        preparation_time: "",
      })
    }
    setIsProductModalOpen(true)
  }

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      alert("Los campos nombre, precio y categoría son obligatorios.");
      return;
    }

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category_id: Number(productForm.category),
      image_url: productForm.image_url || null,
      available: productForm.available,
      preparation_time: productForm.preparation_time ? parseInt(productForm.preparation_time) : 0,
    };

    try {
      if (editingProduct) {
        // 🔄 Actualizar producto existente
        const updatedProduct = await apiCall("menu.update", {
          id: editingProduct.id,
          ...payload,
        });

        // Reemplazar producto actualizado en la lista
        setMenuItems(menuItems.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)));
      } else {
        // ➕ Crear nuevo producto
        const newItem = await apiCall("menu.create", payload);
        setMenuItems([...menuItems, newItem]);
      }

      // Cerrar modal y limpiar
      setIsProductModalOpen(false);
      setEditingProduct(null);

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshMenu) {
        await onRefreshMenu();
      }
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("No se pudo guardar el producto.");
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      await apiCall("menu.delete", { id: productId })
      // Eliminar del estado local
      setMenuItems(menuItems.filter((item: MenuItem) => item.id !== productId))

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshMenu) {
        await onRefreshMenu();
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      alert("No se pudo eliminar el producto.")
    }
  }

  const toggleProductAvailability = async (id: number) => {
    try {
      setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
      console.log("Disponibilidad cambiada para producto:", id)
    } catch (error) {
      console.error("Error toggling availability:", error)
    }
  }

  const saveCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      await apiCall("category.create", {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
      })
      // Actualizar la lista de categorías desde el backend
      const updated = await apiCall("category.getAll")
      setCategories(updated)
      // Limpiar formulario/modal
      setNewCategoryName("")
      setNewCategoryDescription("")
      setIsCategoryModalOpen(false)

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshCategories) {
        await onRefreshCategories();
      }
    } catch (error: any) {
      alert(error.message || "Error creando categoría")
      console.error("Error saving category:", error)
    }
  }

  const deleteCategory = async (category: Category) => {
    const hasProducts = menuItems.some((item) => item.category_id === category.id)
    if (hasProducts) {
      alert("No se puede eliminar una categoría que tiene productos. Mueve o elimina los productos primero.")
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) return

    try {
      await apiCall("category.delete", { id: category.id })
      // Actualizar la lista de categorías desde el backend
      const updated = await apiCall("category.getAll")
      setCategories(updated)
      console.log("Categoría eliminada:", category.name)

      // 🔄 Refrescar inmediatamente desde el servidor para sincronizar
      if (onRefreshCategories) {
        await onRefreshCategories();
      }
    } catch (error: any) {
      alert(error.message || "Error eliminando categoría")
      console.error("Error deleting category:", error)
    }
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">🍽️ Menú</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Administra productos</p>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              onClick={() => setIsCategoryModalOpen(true)}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Categoría</span>
              <span className="sm:hidden">Cat.</span>
            </Button>
            <Button
              onClick={() => openProductModal()}
              size="sm"
              className={`bg-gradient-to-r ${theme.buttonPreset.gradient} hover:opacity-90 text-white text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3`}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar Producto</span>
              <span className="sm:hidden">Prod.</span>
            </Button>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-6">
          {/* Grid responsivo de categorías */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {paginatedCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Header de la categoría */}
                <div className="p-2 sm:p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-sm sm:text-lg">📂</span>
                      <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{category.name}</h3>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                        {menuItems.filter((item) => item.category_id === category.id).length}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCategory(category)}
                      className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  {category.description && (
                    <p className="text-[10px] sm:text-sm text-gray-500 mt-1 line-clamp-1">{category.description}</p>
                  )}
                </div>

                {/* Lista de productos de la categoría */}
                <div className="p-2 sm:p-4 max-h-64 sm:max-h-96 overflow-y-auto scrollbar-thin">
                  <div className="space-y-2 sm:space-y-3">
                    {menuItems
                      .filter((item) => item.category_id === category.id)
                      .slice(0, 5) // Mostrar máximo 5 productos por categoría
                      .map((item) => (
                        <Card key={item.id} className={`transition-all hover:shadow-md ${!item.available ? "opacity-60" : ""}`}>
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex items-start gap-2 sm:gap-3 mb-1 sm:mb-2">
                              {/* Imagen del producto */}
                              {item.image_url && (
                                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100">
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
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 truncate text-xs sm:text-sm">{item.name}</h4>
                                <p className="text-sm sm:text-lg font-bold text-green-600">
                                  ${parseFloat(item.price.toString()).toLocaleString('es-CO')}
                                </p>
                                {item.description && (
                                  <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 ml-1 sm:ml-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleProductAvailability(item.id)}
                                  className="p-0.5 sm:p-1 h-5 w-5 sm:h-7 sm:w-7"
                                  title={item.available ? "Marcar como no disponible" : "Marcar como disponible"}
                                >
                                  {item.available ? (
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openProductModal(item)}
                                  className="p-0.5 sm:p-1 h-5 w-5 sm:h-7 sm:w-7"
                                  title="Editar producto"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteProduct(item.id)}
                                  className="p-0.5 sm:p-1 h-5 w-5 sm:h-7 sm:w-7"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant={item.available ? "default" : "secondary"} className="text-[9px] sm:text-xs">
                                {item.available ? "🛒" : "❌"}
                                <span className="hidden sm:inline ml-1">{item.available ? "Disponible" : "Agotado"}</span>
                              </Badge>
                              {item.preparation_time && (
                                <span className="text-[9px] sm:text-xs text-gray-500">⏱️ {item.preparation_time}m</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {/* Mensaje si hay más productos */}
                    {menuItems.filter((item) => item.category_id === category.id).length > 5 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          +{menuItems.filter((item) => item.category_id === category.id).length - 5} productos más
                        </p>
                      </div>
                    )}

                    {/* Mensaje si no hay productos */}
                    {menuItems.filter((item) => item.category_id === category.id).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No hay productos en esta categoría</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProductModal()}
                          className="mt-2 text-xs"
                        >
                          Agregar producto
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-0.5 sm:gap-1 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-sm"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Ant.</span>
              </Button>

              <div className="flex items-center gap-0.5 sm:gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className={`w-6 h-6 sm:w-10 sm:h-10 p-0 text-[10px] sm:text-sm ${currentPage === page
                        ? `bg-gradient-to-r ${theme.buttonPreset.gradient} text-white`
                        : ""
                      }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-0.5 sm:gap-1 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-sm"
              >
                <span className="hidden sm:inline">Sig.</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          )}

          {/* Información de paginación */}
          {categories.length > 0 && (
            <div className="text-center text-[10px] sm:text-sm text-gray-500">
              {paginatedCategories.length} de {categories.length} cat.
              {totalPages > 1 && ` (Pág. ${currentPage}/${totalPages})`}
            </div>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        categories={categories}
        onSave={saveProduct}
        onImageUpload={uploadProductImage}
        isUploading={uploading}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryName={newCategoryName}
        setCategoryName={setNewCategoryName}
        categoryDescription={newCategoryDescription}
        setCategoryDescription={setNewCategoryDescription}
        onSave={saveCategory}
      />
    </>
  )
}
