'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2, Send, Plus, Minus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/formatters';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CartSummaryProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  onCheckout: () => void;
}

export default function CartSummary({ cart, onUpdateQuantity, onRemove, onCheckout }: CartSummaryProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (cart.length === 0) return null;

  return (
    <>
      {/* Botón flotante móvil */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 z-50"
            size="lg"
          >
            <div className="relative">
              <ShoppingCart className="h-7 w-7" />
              <Badge className="absolute -top-3 -right-3 h-6 w-6 p-0 flex items-center justify-center bg-white text-purple-600 font-bold">
                {totalItems}
              </Badge>
            </div>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
              Tu Pedido
              <Badge variant="secondary" className="ml-2">{totalItems} items</Badge>
            </SheetTitle>
          </SheetHeader>
          <CartContent 
            cart={cart}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            subtotal={subtotal}
            onCheckout={onCheckout}
          />
        </SheetContent>
      </Sheet>

      {/* Barra inferior con resumen - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="h-8 w-8 text-purple-600" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {totalItems}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">{totalItems} productos</p>
                <p className="text-xl font-bold">{formatCurrency(subtotal)}</p>
              </div>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="mr-4">
                  Ver pedido
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px]">
                <SheetHeader>
                  <SheetTitle>Tu Pedido</SheetTitle>
                </SheetHeader>
                <CartContent 
                  cart={cart}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                  subtotal={subtotal}
                  onCheckout={onCheckout}
                />
              </SheetContent>
            </Sheet>
            
            <Button 
              onClick={onCheckout} 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="mr-2 h-5 w-5" />
              Enviar Pedido
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function CartContent({ cart, onUpdateQuantity, onRemove, subtotal, onCheckout }: {
  cart: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  subtotal: number;
  onCheckout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 py-4">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-sm text-purple-600 font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span className="font-bold min-w-[24px] text-center">
                {item.quantity}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4 pb-6 space-y-4 mt-auto">
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium">Subtotal:</span>
          <span className="font-bold text-xl">{formatCurrency(subtotal)}</span>
        </div>
        
        <Button 
          onClick={onCheckout} 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
          size="lg"
        >
          <Send className="mr-2 h-5 w-5" />
          Enviar Pedido
        </Button>
        
        <p className="text-xs text-center text-gray-500">
          El pago se realiza directamente con el mesero
        </p>
      </div>
    </div>
  );
}
