'use client';

import { Users, CreditCard, Music, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatCurrencyShort } from '@/lib/formatters';

interface GuestHeaderProps {
  guestName: string;
  tableNumber: number;
  tableTotal: number;
  minimumAmount: number;
}

export default function GuestHeader({ guestName, tableNumber, tableTotal, minimumAmount }: GuestHeaderProps) {
  const progress = Math.min((tableTotal / minimumAmount) * 100, 100);
  const canRequestSong = tableTotal >= minimumAmount;
  const remaining = Math.max(0, minimumAmount - tableTotal);

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{guestName}</h1>
              <p className="text-sm text-purple-100">Mesa {tableNumber}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <CreditCard className="h-4 w-4 text-purple-200" />
              <span className="text-xs text-purple-100">Total Mesa</span>
            </div>
            <p className="text-lg md:text-xl font-bold">
              {formatCurrency(tableTotal)}
            </p>
          </div>
        </div>

        {/* Progress hacia canción gratis */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="text-sm font-medium">
                {canRequestSong ? '¡Puedes solicitar canciones!' : 'Solicita tu canción'}
              </span>
            </div>
            {canRequestSong && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
          </div>
          
          <Progress value={progress} className="h-2 bg-white/20" />
          
          <div className="flex justify-between mt-2 text-xs text-purple-100">
            <span>{formatCurrencyShort(tableTotal)}</span>
            {!canRequestSong && (
              <span className="hidden sm:inline">Faltan {formatCurrency(remaining)}</span>
            )}
            <span>{formatCurrency(minimumAmount)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
