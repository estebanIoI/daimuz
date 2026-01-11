import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface PreparationStatusProps {
  orderId: number | null;
  guestId: number;
  sessionToken: string | null;
}

interface OrderItemStatus {
  order_item_id: number;
  menu_item_name: string;
  quantity: number;
  item_status: 'pendiente' | 'preparacion' | 'listo' | 'entregado';
}

export default function PreparationStatus({ orderId, guestId, sessionToken }: PreparationStatusProps) {
  const { apiCall } = useApi();
  const [items, setItems] = useState<OrderItemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && guestId) {
      fetchStatus();
    }
    // eslint-disable-next-line
  }, [orderId, guestId]);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall('order.getActiveWithItems', {});
      // Filtrar la orden y los items del invitado
      const order = Array.isArray(result) ? result.find((o: any) => o.order_id === orderId) : null;
      if (!order) throw new Error('No se encontró la orden');
      const guestItems = order.items.filter((i: any) => i.guest_id === guestId);
      setItems(guestItems);
    } catch (e: any) {
      setError(e.message || 'Error al obtener estado');
    }
    setLoading(false);
  };

  if (!orderId || !guestId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-purple-700 bg-white/80 rounded-lg p-3 my-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Consultando estado de tu pedido...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-white/80 rounded-lg p-3 my-4">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-purple-700 bg-white/80 rounded-lg p-3 my-4">
        No tienes productos en preparación.
      </div>
    );
  }

  // Progreso: entregado=100, listo=75, preparacion=50, pendiente=25
  const statusProgress = {
    'pendiente': 25,
    'preparacion': 50,
    'listo': 75,
    'entregado': 100
  };

  return (
    <div className="bg-white/80 rounded-lg p-4 my-4">
      <h3 className="font-bold text-purple-700 mb-2 text-sm">Estado de tu pedido</h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.order_item_id} className="flex items-center gap-2">
            <span className="font-medium text-gray-700 flex-1 truncate">{item.menu_item_name} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
            <Badge variant="secondary" className="capitalize text-xs">
              {item.item_status}
            </Badge>
            <div className="w-24">
              <Progress value={statusProgress[item.item_status]} className="h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
