'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface MenuCatalogProps {
  onAddToCart: (item: any, quantity: number) => void;
  cart: CartItem[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  category_name?: string;
  image_url?: string;
  available: boolean;
  preparation_time?: number;
}

export default function MenuCatalog({ onAddToCart, cart }: MenuCatalogProps) {
  const { apiCall } = useApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  // Helper para construir URL de imagen
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url}`;
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        apiCall('category.getPublic', {}),
        apiCall('menu.getPublic', {})
      ]);
      
      const activeCategories = categoriesData.filter((c: Category) => c.active);
      setCategories(activeCategories);
      setMenuItems(itemsData.filter((i: MenuItem) => i.available));
      
      if (activeCategories.length > 0) {
        setActiveTab(activeCategories[0].id.toString());
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('Error al cargar el menú');
      setLoading(false);
    }
  };

  const getItemQuantityInCart = (itemId: number) => {
    const cartItem = cart.find(i => i.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAdd = (item: MenuItem) => {
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url
    }, 1);
    toast.success(`${item.name} agregado 🍻`);
  };

  const handleDecrease = (item: MenuItem) => {
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url
    }, -1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        <p className="text-white">Cargando menú...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white text-lg">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Contenedor con scroll horizontal para móvil */}
      <div className="relative mb-6">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max md:w-full md:flex gap-1 bg-white/10 backdrop-blur p-1.5 rounded-xl">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id.toString()}
                className="whitespace-nowrap px-4 py-2 text-sm md:text-base md:flex-1 min-w-[80px] text-white/80 font-medium rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 hover:text-white hover:bg-white/10"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {/* Indicador de scroll en móvil */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/80 to-transparent pointer-events-none md:hidden" />
      </div>

      {categories.map(category => (
        <TabsContent key={category.id} value={category.id.toString()} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems
              .filter(item => item.category_id === category.id)
              .map(item => {
                const quantityInCart = getItemQuantityInCart(item.id);
                
                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all bg-white/95 backdrop-blur">
                    {item.image_url && (
                      <div className="h-48 sm:h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-2">
                        <img 
                          src={getImageUrl(item.image_url) || '/placeholder.jpg'} 
                          alt={item.name}
                          className="max-w-full max-h-full object-contain hover:scale-105 transition-transform drop-shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg'
                          }}
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-base line-clamp-2">{item.name}</h3>
                        <Badge variant="secondary" className="ml-2 shrink-0 bg-purple-100 text-purple-700 text-xs">
                          {formatCurrency(item.price)}
                        </Badge>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {item.preparation_time && (
                          <span className="text-xs text-gray-500">
                            ⏱️ {item.preparation_time} min
                          </span>
                        )}
                        
                        {quantityInCart > 0 ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDecrease(item)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold min-w-[24px] text-center">
                              {quantityInCart}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleAdd(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm"
                            className="ml-auto bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleAdd(item)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
          
          {menuItems.filter(item => item.category_id === category.id).length === 0 && (
            <div className="text-center py-8">
              <p className="text-purple-200">No hay productos en esta categoría</p>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
