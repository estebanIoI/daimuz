'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';

// Componentes
import GuestHeader from '@/components/cliente/GuestHeader';
import MenuCatalog from '@/components/cliente/MenuCatalog';
import CartSummary from '@/components/cliente/CartSummary';
import SongSelector from '@/components/cliente/SongSelector';
import GuestRegistration from '@/components/cliente/GuestRegistration';
import PreparationStatus from '@/components/cliente/PreparationStatus';
import { Loader2 } from 'lucide-react';

interface GuestInfo {
  id: number;
  guest_name: string;
  table_id: number;
  table_number: number;
  session_token: string;
  qr_token: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
}

export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const { apiCall } = useApi();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [canRequestSong, setCanRequestSong] = useState(false);
  const [tableTotal, setTableTotal] = useState(0);
  const [minimumAmount, setMinimumAmount] = useState(600000);
  const [orderId, setOrderId] = useState<number | null>(null);

  const qrToken = params.token as string;

  useEffect(() => {
    if (qrToken) {
      initializeSession();
    }
  }, [qrToken]);

  const initializeSession = async () => {
    try {
      setError(null);

      // Verificar si ya tiene sesión guardada
      const savedToken = localStorage.getItem(`guest_session_${qrToken}`);

      if (savedToken) {
        try {
          // Validar sesión existente
          const sessionInfo = await apiCall('guest.getSessionInfo', {
            sessionToken: savedToken
          });

          setGuestInfo({
            id: sessionInfo.id,
            guest_name: sessionInfo.guest_name,
            table_id: sessionInfo.table_id,
            table_number: sessionInfo.table_number,
            session_token: savedToken,
            qr_token: sessionInfo.qr_token
          });
          setSessionToken(savedToken);
          await checkSongEligibility(sessionInfo.table_id);
        } catch (e: any) {
          // Sesión inválida (posiblemente cerrada por cajero), limpiar y continuar con registro
          localStorage.removeItem(`guest_session_${qrToken}`);
          console.log('🔒 Sesión expirada o cerrada, revalidando QR...');

          try {
            // Validar QR
            await apiCall('qr.validate', { qrToken });
          } catch (qrError: any) {
            // Si el QR también está inválido, mostrar mensaje específico
            if (qrError.message?.includes('expirado') || qrError.message?.includes('inválido')) {
              throw new Error('Tu sesión ha sido cerrada. Por favor, escanea nuevamente el código QR de tu mesa.');
            }
            throw qrError;
          }
        }
      } else {
        // Validar QR
        await apiCall('qr.validate', { qrToken });
      }

      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || 'QR inválido o expirado');
      setIsLoading(false);
    }
  };

  const handleGuestRegistration = async (name: string, phone?: string) => {
    try {
      const result = await apiCall('guest.register', {
        qrToken,
        guestName: name,
        phone
      });

      setSessionToken(result.sessionToken);
      setGuestInfo({
        id: result.guestId,
        guest_name: result.guestName,
        table_id: result.tableId,
        table_number: result.tableNumber,
        session_token: result.sessionToken,
        qr_token: qrToken
      });
      localStorage.setItem(`guest_session_${qrToken}`, result.sessionToken);

      await checkSongEligibility(result.tableId);
      toast.success(`¡Bienvenido ${name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Error al registrarse');
    }
  };

  const checkSongEligibility = async (tableId: number) => {
    try {
      const result = await apiCall('song.canRequest', { tableId });
      setCanRequestSong(result.canRequest);
      setTableTotal(result.tableTotal);
      setMinimumAmount(result.minimumAmount);
    } catch (error) {
      console.error('Error checking song eligibility:', error);
    }
  };

  const addToCart = (item: any, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty <= 0) {
          return prev.filter(i => i.id !== item.id);
        }
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: newQty }
            : i
        );
      }
      if (quantity <= 0) return prev;
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i =>
      i.id === itemId ? { ...i, quantity } : i
    ));
  };

  const handleCheckout = async () => {
    if (!guestInfo || cart.length === 0) return;

    try {
      let currentOrderId = orderId;

      // Crear orden si no existe
      if (!currentOrderId) {
        const order = await apiCall('order.createGuest', {
          tableId: guestInfo.table_id,
          guestId: guestInfo.id,
          sessionToken: sessionToken
        });
        currentOrderId = order.order_id;
        setOrderId(currentOrderId);
      }

      // Agregar items
      for (const item of cart) {
        await apiCall('order.addItemGuest', {
          order_id: currentOrderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: item.notes || '',
          guestId: guestInfo.id,
          sessionToken: sessionToken
        });
      }

      setCart([]);
      await checkSongEligibility(guestInfo.table_id);
      toast.success('¡Pedido enviado a cocina! 🍻');
    } catch (error: any) {
      const errorMsg = error.message || 'Error al enviar pedido';

      // Detectar si la sesión fue cerrada por el cajero
      if (errorMsg.includes('inválida') || errorMsg.includes('expirada') || errorMsg.includes('invitado')) {
        toast.error('Tu cuenta ha sido cerrada. No puedes hacer más pedidos.', {
          duration: 5000,
          description: 'Para continuar, escanea nuevamente el código QR.'
        });

        // Limpiar sesión y redirigir a error
        localStorage.removeItem(`guest_session_${qrToken}`);
        setGuestInfo(null);
        setSessionToken(null);
        setError('Tu cuenta ha sido cerrada. Por favor, escanea nuevamente el código QR de tu mesa.');
      } else {
        toast.error(errorMsg);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <div className="text-6xl">❌</div>
        <h1 className="text-2xl font-bold text-white text-center">QR Inválido</h1>
        <p className="text-purple-200 text-center">{error}</p>
        <p className="text-purple-300 text-sm text-center mt-4">
          Por favor, pide al mesero un nuevo código QR
        </p>
      </div>
    );
  }

  if (!guestInfo) {
    return <GuestRegistration onSubmit={handleGuestRegistration} />;
  }

  return (
    <div className="min-h-screen pb-32">
      <GuestHeader
        guestName={guestInfo.guest_name}
        tableNumber={guestInfo.table_number}
        tableTotal={tableTotal}
        minimumAmount={minimumAmount}
      />

      {/* Estado de preparación del pedido */}
      <div className="container mx-auto px-4">
        <PreparationStatus
          orderId={orderId}
          guestId={guestInfo.id}
          sessionToken={sessionToken}
          onSessionClosed={() => {
            toast.success('¡Gracias por tu visita! Tu cuenta ha sido pagada.', {
              duration: 5000,
              icon: '👋'
            });
            // Dar tiempo para leer el mensaje antes de limpiar
            setTimeout(() => {
              localStorage.removeItem(`guest_session_${qrToken}`);
              setGuestInfo(null);
              setSessionToken(null);
              setCart([]);
            }, 5000);
          }}
        />
      </div>

      <main className="container mx-auto px-4 py-6">
        <MenuCatalog
          onAddToCart={addToCart}
          cart={cart}
        />
        {canRequestSong && (
          <SongSelector
            tableId={guestInfo.table_id}
            guestId={guestInfo.id}
            tableTotal={tableTotal}
          />
        )}
      </main>
      <CartSummary
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
