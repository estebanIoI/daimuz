'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Copy, RefreshCw, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: number;
    number: number;
  };
}

interface QRData {
  id: number;
  qrToken: string;
  qrUrl: string;
  qrImage: string;
  tableId: number;
  expiresAt: string;
}

interface Guest {
  id: number;
  guest_name: string;
  phone?: string;
  joined_at: string;
  total_spent: number;
}

export function QRModal({ isOpen, onClose, table }: QRModalProps) {
  const { apiCall } = useApi();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);

  useEffect(() => {
    if (isOpen && table) {
      loadExistingQR();
      loadGuests();
    }
  }, [isOpen, table?.id]);

  const loadExistingQR = async () => {
    try {
      setLoading(true);
      const result = await apiCall('qr.getActiveByTable', { tableId: table.id });
      if (result) {
        setQrData(result);
      }
    } catch (error) {
      // No hay QR activo, está bien
      console.log('No hay QR activo para esta mesa');
    } finally {
      setLoading(false);
    }
  };

  const loadGuests = async () => {
    try {
      setLoadingGuests(true);
      const result = await apiCall('guest.getByTable', { tableId: table.id });
      setGuests(result || []);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoadingGuests(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      const result = await apiCall('qr.generate', { tableId: table.id });
      setQrData(result);
      toast.success('QR generado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al generar QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData?.qrImage) return;
    
    const link = document.createElement('a');
    link.href = qrData.qrImage;
    link.download = `mesa-${table.number}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR descargado');
  };

  const handleCopyUrl = async () => {
    if (!qrData?.qrUrl) return;
    
    try {
      await navigator.clipboard.writeText(qrData.qrUrl);
      toast.success('URL copiada al portapapeles');
    } catch (error) {
      toast.error('Error al copiar URL');
    }
  };

  const handleDeactivateQR = async () => {
    try {
      await apiCall('qr.deactivate', { tableId: table.id });
      setQrData(null);
      setGuests([]);
      toast.success('QR desactivado');
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar QR');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-purple-600" />
            QR para Mesa {table.number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : qrData ? (
            <>
              {/* QR Image */}
              <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-dashed border-gray-200">
                <img 
                  src={qrData.qrImage} 
                  alt="QR Code"
                  className="w-56 h-56"
                />
              </div>
              
              {/* URL Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">
                  Comparte este QR con los clientes de la mesa
                </p>
                <p className="text-xs font-mono bg-white p-2 rounded break-all border">
                  {qrData.qrUrl}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Expira: {new Date(qrData.expiresAt).toLocaleString('es-CO')}
                </p>
              </div>
              
              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleDownloadQR}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCopyUrl}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar URL
                </Button>
              </div>
              
              <Button 
                variant="outline"
                onClick={handleGenerateQR}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerar QR
              </Button>

              {/* Connected Guests */}
              {guests.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" />
                    Clientes conectados ({guests.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {guests.map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <p className="font-medium">{guest.guest_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(guest.joined_at).toLocaleTimeString('es-CO', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          ${Number(guest.total_spent || 0).toLocaleString('es-CO')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deactivate */}
              <Button 
                variant="destructive"
                onClick={handleDeactivateQR}
                className="w-full"
                size="sm"
              >
                Desactivar QR y cerrar sesiones
              </Button>
            </>
          ) : (
            /* No QR - Generate button */
            <div className="text-center py-6 space-y-4">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <QrCode className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">No hay QR activo</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Genera un código QR para que los clientes puedan ordenar desde su celular
                </p>
              </div>
              <Button 
                onClick={handleGenerateQR}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Generar Código QR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
