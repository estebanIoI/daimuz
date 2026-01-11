import React from 'react';
import { Calendar, User, CreditCard, Receipt, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  table_number: number;
  waiter_name: string;
  cashier_name: string;
  subtotal: number;
  total: number;
  payment_method: 'efectivo' | 'tarjeta' | 'nequi' | 'transferencia';
  transaction_id?: string;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
}

interface InvoiceCardProps {
  invoice: Invoice;
  onViewDetails?: (invoice: Invoice) => void;
  onPrint?: (invoice: Invoice) => void;
}

export function InvoiceCard({ invoice, onViewDetails, onPrint }: InvoiceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'efectivo':
        return '💵';
      case 'tarjeta':
        return '💳';
      case 'nequi':
        return '📱';
      case 'transferencia':
        return '🏦';
      default:
        return '💰';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'nequi':
        return 'bg-purple-100 text-purple-800';
      case 'transferencia':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-lg hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            {invoice.invoice_number}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${getPaymentMethodColor(invoice.payment_method)} border-none`}
          >
            {getPaymentMethodIcon(invoice.payment_method)} {invoice.payment_method.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información básica */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">#{invoice.table_number}</span>
            </div>
            <div>
              <p className="font-medium">Mesa {invoice.table_number}</p>
              <p className="text-gray-500 text-xs">Pedido #{invoice.order_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">{formatDate(invoice.created_at)}</p>
              <p className="text-gray-500 text-xs">Fecha de emisión</p>
            </div>
          </div>
        </div>

        {/* Personal */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            <div>
              <span className="font-medium">Mesero:</span>
              <span className="ml-2 text-gray-700">{invoice.waiter_name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <div>
              <span className="font-medium">Cajero:</span>
              <span className="ml-2 text-gray-700">{invoice.cashier_name}</span>
            </div>
          </div>
        </div>

        {/* Resumen de productos */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Productos ({invoice.items.length} items)
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {invoice.items.map((item, index) => (
              <div key={`${item.order_item_id}-${index}`} className="flex justify-between items-center text-xs">
                <div className="flex-1">
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="ml-1">{item.menu_item_name}</span>
                  {item.notes && (
                    <p className="text-gray-500 text-xs italic ml-4">"{item.notes}"</p>
                  )}
                </div>
                <span className="font-medium text-gray-700">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
            <span>Total:</span>
            <span className="text-green-600">{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Información adicional */}
        {invoice.transaction_id && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            <strong>ID Transacción:</strong> {invoice.transaction_id}
          </div>
        )}

        {invoice.notes && (
          <div className="text-xs text-gray-600 bg-yellow-50 rounded p-2">
            <strong>Notas:</strong> {invoice.notes}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(invoice)}
              className="flex-1"
            >
              Ver Detalles
            </Button>
          )}
          {onPrint && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPrint(invoice)}
              className="flex-1"
            >
              Imprimir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}