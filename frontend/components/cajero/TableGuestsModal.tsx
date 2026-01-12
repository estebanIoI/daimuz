// Definir interfaz para factura (InvoiceItem) para tipado correcto
interface InvoiceItem {
  order_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  menu_item_id: number;
  menu_item_name: string;
  description?: string;
  category_name: string;
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, User, CreditCard, ShoppingBag, Clock, ChevronRight, 
  Banknote, Smartphone, ArrowLeft, Check, Loader2, Package
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

// Función helper para formatear precios en formato colombiano
const formatCOP = (amount: number) => {
  return Math.round(amount).toLocaleString('es-CO');
};

// Helper para construir URL de imagen
const getImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${baseUrl}${url}`;
};

interface Guest {
  id: number;
  name: string;
  phone?: string;
  joined_at: string;
  last_activity: string;
  is_active: boolean;
  item_count: number;
  total_quantity: number;
  total_spent: number;
}

interface GuestItem {
  order_item_id: number;
  order_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  status?: string;
  menu_item: {
    id: number;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category_name: string;
  };
}

interface WaiterOrder {
  items: any[];
  item_count: number;
  total_quantity: number;
  total: number;
}

interface TableGuestsData {
  table: {
    id: number;
    number: number;
    status: string;
  };
  order: {
    id: number;
    total: number;
    waiter_id: number;
    waiter_name: string;
  } | null;
  guests: Guest[];
  waiterOrders: WaiterOrder;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
}

interface TableGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number;
  tableNumber: number;
  orderId: number;
  onPaymentComplete: (guestPaymentData: {
    orderId: number;
    guestId?: number;
    amount: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'nequi' | 'transferencia';
    items: InvoiceItem[];
  }) => void;
}

export function TableGuestsModal({
  isOpen,
  onClose,
  tableId,
  tableNumber,
  orderId,
  onPaymentComplete
}: TableGuestsModalProps) {
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<TableGuestsData | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestItems, setGuestItems] = useState<GuestItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'nequi'>('efectivo');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Cargar datos de la mesa
  const loadTableData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('cashier.getTableGuests', { table_id: tableId });
      setTableData(data);
    } catch (error) {
      console.error('Error cargando datos de la mesa:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, tableId]);

  // Cargar items de un guest
  const loadGuestItems = useCallback(async (guest: Guest) => {
    try {
      setLoadingItems(true);
      setSelectedGuest(guest);
      const data = await apiCall('cashier.getGuestItems', { 
        guest_id: guest.id, 
        order_id: orderId 
      });
      setGuestItems(data.items || []);
    } catch (error) {
      console.error('Error cargando items del cliente:', error);
    } finally {
      setLoadingItems(false);
    }
  }, [apiCall, orderId]);

  // Procesar pago individual
  const processGuestPayment = async () => {
    if (!selectedGuest) return;

    try {
      setProcessingPayment(true);
      
      // Re-validate guest status before processing payment
      // This ensures the guest is still active and hasn't already paid
      const freshData = await apiCall('cashier.getTableGuests', { table_id: tableId });
      const currentGuest = freshData?.guests?.find((g: Guest) => g.id === selectedGuest.id && g.is_active);
      
      if (!currentGuest) {
        alert('Este cliente ya realizó su pago o fue eliminado. La lista se actualizará.');
        setTableData(freshData);
        setSelectedGuest(null);
        setGuestItems([]);
        setShowPaymentOptions(false);
        return;
      }

      // Guardar items antes de la llamada al backend (para el callback posterior)
      const invoiceItems = guestItems.map(item => ({
        order_item_id: item.order_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes,
        menu_item_id: item.menu_item.id,
        menu_item_name: item.menu_item.name,
        description: item.menu_item.description,
        category_name: item.menu_item.category_name,
      }));

      // Llamada al backend
      await apiCall('cashier.registerGuestPayment', {
        guest_id: selectedGuest.id,
        order_id: orderId,
        payment_method: paymentMethod,
        amount_received: selectedGuest.total_spent
      });

      // Recargar datos
      await loadTableData();
      
      // Pasar los datos del pago individual al callback
      onPaymentComplete({
        orderId: orderId,
        guestId: selectedGuest.id,
        amount: selectedGuest.total_spent,
        paymentMethod: paymentMethod,
        items: invoiceItems,
      });

      setSelectedGuest(null);
      setGuestItems([]);
      setShowPaymentOptions(false);
    } catch (error: any) {
      console.error('Error procesando pago:', error);
      
      // Handle specific guest-not-found error
      const errorMessage = error.message || 'Error al procesar el pago';
      if (errorMessage.includes('Invitado no encontrado') || 
          errorMessage.includes('ya inactivo')) {
        alert('Este cliente ya realizó su pago o no está disponible. La lista se actualizará.');
        await loadTableData();
        setSelectedGuest(null);
        setGuestItems([]);
        setShowPaymentOptions(false);
      } else {
        alert(errorMessage);
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      loadTableData();
      setSelectedGuest(null);
      setGuestItems([]);
      setShowPaymentOptions(false);
    }
  }, [isOpen, loadTableData]);

  const handleBack = () => {
    if (showPaymentOptions) {
      setShowPaymentOptions(false);
    } else if (selectedGuest) {
      setSelectedGuest(null);
      setGuestItems([]);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            {(selectedGuest || showPaymentOptions) && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {showPaymentOptions 
                ? `Cobrar a ${selectedGuest?.name}`
                : selectedGuest 
                  ? `Consumo de ${selectedGuest.name}` 
                  : `Mesa ${tableNumber} - Clientes Activos`
              }
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[70vh] p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Cargando información...</p>
            </div>
          ) : !tableData?.order ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin pedido activo</h3>
              <p className="text-gray-500">Esta mesa no tiene un pedido activo.</p>
            </div>
          ) : showPaymentOptions && selectedGuest ? (
            // Vista de opciones de pago
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Total a cobrar</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${formatCOP(selectedGuest.total_spent)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{selectedGuest.total_quantity} items</p>
                      <p className="text-sm font-medium">{selectedGuest.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Método de pago</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`flex flex-col items-center gap-2 h-auto py-4 ${
                      paymentMethod === 'efectivo' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'hover:bg-green-50 hover:border-green-300'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span>Efectivo</span>
                    {paymentMethod === 'efectivo' && <Check className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant={paymentMethod === 'tarjeta' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`flex flex-col items-center gap-2 h-auto py-4 ${
                      paymentMethod === 'tarjeta' 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Tarjeta</span>
                    {paymentMethod === 'tarjeta' && <Check className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant={paymentMethod === 'nequi' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('nequi')}
                    className={`flex flex-col items-center gap-2 h-auto py-4 ${
                      paymentMethod === 'nequi' 
                        ? 'bg-purple-500 hover:bg-purple-600' 
                        : 'hover:bg-purple-50 hover:border-purple-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span>Nequi</span>
                    {paymentMethod === 'nequi' && <Check className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={processGuestPayment}
                disabled={processingPayment}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 h-12"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Confirmar Pago - ${formatCOP(selectedGuest.total_spent)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-2">
                Al confirmar, el consumo del cliente se descontará del total de la mesa
              </p>
            </div>
          ) : selectedGuest ? (
            // Vista de items del cliente
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{selectedGuest.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Llegó: {new Date(selectedGuest.joined_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">${formatCOP(selectedGuest.total_spent)}</p>
                      <Badge variant="secondary">{selectedGuest.total_quantity} items</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : guestItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Sin consumo registrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Productos consumidos</h4>
                  {guestItems.map((item) => (
                    <Card key={item.order_item_id} className="border-gray-200">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center gap-3">
                          {/* Imagen del producto */}
                          {item.menu_item.image_url && (
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={getImageUrl(item.menu_item.image_url) || '/placeholder.jpg'}
                                alt={item.menu_item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.jpg'
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menu_item.name}</p>
                            <p className="text-xs text-gray-500">{item.menu_item.category_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">${formatCOP(item.subtotal)}</p>
                            <p className="text-xs text-gray-500">{item.quantity} x ${formatCOP(item.unit_price)}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">Nota: {item.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedGuest.total_spent > 0 && (
                <Button
                  onClick={() => setShowPaymentOptions(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cobrar ${formatCOP(selectedGuest.total_spent)}
                </Button>
              )}
            </div>
          ) : (
            // Vista de lista de clientes
            <div className="space-y-4">
              {/* Resumen de la mesa */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{tableData.guests.length}</p>
                      <p className="text-xs text-gray-600">Clientes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{tableData.totalQuantity}</p>
                      <p className="text-xs text-gray-600">Items</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">${formatCOP(tableData.totalAmount)}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de clientes */}
              {tableData.guests.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clientes ({tableData.guests.length})
                  </h4>
                  {tableData.guests.map((guest) => (
                    <Card 
                      key={guest.id} 
                      className="border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all"
                      onClick={() => loadGuestItems(guest)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{guest.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(guest.joined_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                <span>•</span>
                                <Package className="w-3 h-3" />
                                {guest.total_quantity} items
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-bold text-blue-600">${formatCOP(guest.total_spent)}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay clientes registrados con QR</p>
                  <p className="text-xs text-gray-400 mt-1">Los pedidos fueron tomados por el mesero</p>
                </div>
              )}

              {/* Pedidos del mesero (sin guest_id) */}
              {tableData.waiterOrders && tableData.waiterOrders.total > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Pedidos por Mesero
                  </h4>
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-orange-700">Mesero: {tableData.order?.waiter_name}</p>
                          <p className="text-sm text-orange-600">{tableData.waiterOrders.total_quantity} items</p>
                        </div>
                        <p className="font-bold text-orange-600">${formatCOP(tableData.waiterOrders.total)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
