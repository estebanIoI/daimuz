'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, Search, Youtube, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/formatters';

interface SongSelectorProps {
  tableId: number;
  guestId: number;
  tableTotal: number;
}

export default function SongSelector({ tableId, guestId, tableTotal }: SongSelectorProps) {
  const { apiCall } = useApi();
  const [songName, setSongName] = useState('');
  const [artist, setArtist] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!songName.trim()) {
      toast.error('Ingresa el nombre de la canción');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiCall('song.request', {
        tableId,
        guestId,
        songData: {
          songName: songName.trim(),
          artist: artist.trim() || null,
          songUrl: songUrl.trim() || null,
          platform: songUrl.includes('youtube') ? 'youtube' : 
                   songUrl.includes('spotify') ? 'spotify' : 'other'
        }
      });

      toast.success('¡Canción solicitada! 🎵', {
        description: 'Tu canción se agregó a la cola de reproducción'
      });
      setSongName('');
      setArtist('');
      setSongUrl('');
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar canción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/50 to-transparent rounded-bl-full" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-purple-700">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="flex items-center gap-2">
              ¡Solicita tu Canción!
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </span>
            <p className="text-sm font-normal text-gray-600 mt-1">
              Tu mesa ha alcanzado {formatCurrency(tableTotal)} - ¡Elige la música!
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="songName" className="text-gray-700">Nombre de la Canción *</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="songName"
                type="text"
                placeholder="Ej: Bohemian Rhapsody"
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                className="pl-10 bg-white"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="artist" className="text-gray-700">Artista</Label>
            <Input
              id="artist"
              type="text"
              placeholder="Ej: Queen"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="mt-1 bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="songUrl" className="text-gray-700">
              URL (YouTube/Spotify) - Opcional
            </Label>
            <div className="relative mt-1">
              <Youtube className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="songUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                className="pl-10 bg-white"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Si tienes el enlace, será más fácil encontrar tu canción
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg" 
            size="lg"
            disabled={isSubmitting || !songName.trim()}
          >
            <Music className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Enviando...' : 'Solicitar Canción 🎶'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
