import { useEffect, useState, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { Loader2, CheckCircle2, AlertCircle, Clock, ChefHat, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface PreparationStatusProps {
  orderId: number | null;
  guestId: number;
  sessionToken: string | null;
  onSessionClosed?: () => void; // Callback cuando la sesión se cierra (pago completado)
}

interface OrderItemStatus {
  order_item_id: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  item_status: 'pendiente' | 'preparacion' | 'listo' | 'entregado';
}

export default function PreparationStatus({ orderId, guestId, sessionToken, onSessionClosed }: PreparationStatusProps) {
  const { apiCall } = useApi();
  const [items, setItems] = useState<OrderItemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchStatus = useCallback(async () => {
    if (!guestId || !sessionToken) {
      setLoading(false);
      return;
    }

    try {
      // Primero verificar si la sesión sigue activa
      const sessionInfo = await apiCall('guest.getSessionInfo', {
        sessionToken: sessionToken
      });

      if (!sessionInfo || !sessionInfo.is_active) {
        setSessionClosed(true);
        if (sessionInfo.invoice) {
          setInvoice(sessionInfo.invoice);
        }
        setItems([]);
        if (onSessionClosed) onSessionClosed();
        return;
      }

      // Obtener items del pedido del invitado
      const result = await apiCall('guest.getMyItems', {
        guestId: guestId,
        sessionToken: sessionToken
      });

      if (result && result.items) {
        setItems(result.items);
        setTotalAmount(result.total || 0);
      }
      setError(null);
    } catch (e: any) {
      // Detectar si la sesión fue cerrada (pago completado)
      if (e.message?.includes('inválida') || e.message?.includes('expirada') || e.message?.includes('cerrada')) {
        setSessionClosed(true);
        setItems([]);
        if (onSessionClosed) onSessionClosed();
      } else {
        setError(e.message || 'Error al obtener estado');
      }
    }
    setLoading(false);
  }, [guestId, sessionToken, apiCall, onSessionClosed]);

  useEffect(() => {
    if (guestId && sessionToken) {
      fetchStatus();

      // Auto-refresh cada 10 segundos
      const interval = setInterval(fetchStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [guestId, sessionToken, fetchStatus]);

  // Si la sesión fue cerrada (cliente ya pagó)
  if (sessionClosed) {
    return (
      <div className="space-y-4 my-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-green-100 border border-green-300 rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <div>
              <h3 className="font-bold text-green-800 text-lg">¡Cuenta Pagada!</h3>
              <p className="text-green-700">Gracias por tu visita. Esperamos verte pronto.</p>
            </div>
          </div>
        </div>

        {invoice && (
          <div className="bg-white rounded-xl p-5 shadow-xl border-t-4 border-purple-600 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h4 className="font-bold text-gray-900">Resumen de Pago</h4>
                <p className="text-xs text-gray-500">Factura: {invoice.invoice_number}</p>
                <p className="text-xs text-gray-500">
                  {new Date(invoice.created_at).toLocaleString('es-CO')}
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-700">Digital</Badge>
            </div>

            <div className="space-y-2">
              {(() => {
                try {
                  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
                  return items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.menu_item_name} <span className="text-xs text-gray-400">x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        ${Math.round(item.subtotal).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ));
                } catch (e) {
                  return <p className="text-xs text-red-400">No se pudo cargar el detalle.</p>;
                }
              })()}
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900">TOTAL PAGADO</span>
              <span className="text-xl font-black text-purple-700">
                ${Math.round(invoice.total).toLocaleString('es-CO')}
              </span>
            </div>

            <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider">
              Comprobante de pago electrónico - Sistema Bar
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!guestId || !sessionToken) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-purple-700 bg-white/80 rounded-lg p-3 my-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Consultando tu pedido...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 my-4">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-purple-700 bg-white/80 rounded-lg p-3 my-4 text-center">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aún no tienes productos en tu pedido.</p>
        <p className="text-sm opacity-75">¡Explora el menú y haz tu primer pedido!</p>
      </div>
    );
  }

  // Progreso y colores por estado
  const statusConfig = {
    'pendiente': { progress: 25, color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
    'preparacion': { progress: 50, color: 'bg-blue-100 text-blue-800', icon: ChefHat, label: 'En preparación' },
    'listo': { progress: 75, color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Listo' },
    'entregado': { progress: 100, color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Entregado' }
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl p-4 my-4 shadow-lg border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-purple-700 text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Tu pedido
        </h3>
        <span className="text-sm font-semibold text-purple-600">
          Total: ${Math.round(totalAmount).toLocaleString('es-CO')}
        </span>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const config = statusConfig[item.item_status] || statusConfig.pendiente;
          const StatusIcon = config.icon;

          return (
            <div key={item.order_item_id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 flex-1">
                  {item.menu_item_name}
                  <span className="text-xs text-gray-500 ml-1">x{item.quantity}</span>
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  ${Math.round(item.subtotal).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${config.color} text-xs flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <div className="flex-1">
                  <Progress value={config.progress} className="h-2" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Se actualiza automáticamente
      </p>
    </div>
  );
}

