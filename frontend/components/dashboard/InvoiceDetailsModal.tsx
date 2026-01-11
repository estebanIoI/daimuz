import React from 'react';
import { X, Printer, Download, Calendar, User, CreditCard, Receipt, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: (invoice: Invoice) => void;
}

export function InvoiceDetailsModal({ 
  invoice, 
  isOpen, 
  onClose, 
  onPrint 
}: InvoiceDetailsModalProps) {
  if (!invoice) return null;

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
      month: 'long',
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

  const handlePrint = () => {
    if (onPrint) {
      onPrint(invoice);
    } else {
      // Función de impresión por defecto
      window.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              Factura {invoice.invoice_number}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Encabezado de la factura */}
          <div className="border-b pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-lg">Restaurante Sirius</h3>
                <p className="text-gray-600">Sistema de Facturación</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Fecha de emisión:</p>
                <p className="font-medium">{formatDate(invoice.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Información del pedido */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Información del Pedido
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de Factura:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pedido #:</span>
                  <span className="font-medium">{invoice.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mesa:</span>
                  <span className="font-medium">#{invoice.table_number}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mesero:</span>
                  <span className="font-medium">{invoice.waiter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cajero:</span>
                  <span className="font-medium">{invoice.cashier_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" />
              Información de Pago
            </h4>
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className={`${getPaymentMethodColor(invoice.payment_method)} border-none text-sm px-3 py-1`}
              >
                {getPaymentMethodIcon(invoice.payment_method)} {invoice.payment_method.toUpperCase()}
              </Badge>
              {invoice.transaction_id && (
                <div className="text-sm text-gray-600">
                  <strong>ID Transacción:</strong> {invoice.transaction_id}
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Productos Pedidos</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Producto</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Cant.</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Precio Unit.</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={`${item.order_item_id}-${index}`} className="border-t">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-sm">{item.menu_item_name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500">{item.description}</p>
                          )}
                          <p className="text-xs text-blue-600">{item.category_name}</p>
                          {item.notes && (
                            <p className="text-xs text-orange-600 italic mt-1">
                              Nota: "{item.notes}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center font-medium">{item.quantity}</td>
                      <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="border-t pt-4">
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          {invoice.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Notas del Pedido:</h4>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Pie de factura */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Gracias por su visita</p>
            <p>Esta es una factura generada electrónicamente</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}