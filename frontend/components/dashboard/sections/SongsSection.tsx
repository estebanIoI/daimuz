'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, SkipForward, CheckCircle, XCircle, RefreshCw, Loader2, Headphones, ExternalLink } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import { toast } from 'sonner';

interface Song {
  id: number;
  table_id: number;
  guest_id: number | null;
  song_name: string;
  artist: string | null;
  song_url: string | null;
  platform: 'youtube' | 'spotify' | 'other';
  status: 'pending' | 'playing' | 'played' | 'skipped' | 'rejected';
  requested_at: string;
  played_at: string | null;
  table_number: number;
  guest_name: string | null;
}

interface DailyStats {
  total_requests: number;
  played: number;
  pending: number;
  playing: number;
  skipped: number;
  rejected: number;
}

export function SongsSection() {
  const { apiCall } = useApi();
  const [songs, setSongs] = useState<Song[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadSongs = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [songsData, statsData] = await Promise.all([
        apiCall('song.getQueue', {}),
        apiCall('song.getDailyStats', {})
      ]);
      setSongs(songsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => loadSongs(false), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadSongs]);

  const updateStatus = async (songId: number, status: string) => {
    try {
      await apiCall('song.updateStatus', { songId, status });
      await loadSongs(false);
      
      const statusMessages: Record<string, string> = {
        playing: '🎵 Reproduciendo...',
        played: '✅ Marcada como reproducida',
        skipped: '⏭️ Canción omitida',
        rejected: '❌ Canción rechazada'
      };
      
      toast.success(statusMessages[status] || 'Estado actualizado');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  const pendingSongs = songs.filter(s => s.status === 'pending');
  const playingSong = songs.find(s => s.status === 'playing');
  const historySongs = songs.filter(s => ['played', 'skipped', 'rejected'].includes(s.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Music className="h-7 w-7 text-purple-600" />
            Cola de Canciones
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las solicitudes de música de los clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "border-green-500 text-green-600" : ""}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSongs()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/dashboard/canciones" target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              Vista completa
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Total Hoy</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.total_requests}</p>
                </div>
                <Music className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Reproducidas</p>
                  <p className="text-2xl font-bold text-green-700">{stats.played}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">En Cola</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <Headphones className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Omitidas</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.skipped + stats.rejected}</p>
                </div>
                <SkipForward className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Now Playing */}
      {playingSong && (
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full animate-pulse">
                <Play className="h-5 w-5" />
              </div>
              Reproduciendo Ahora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl sm:text-2xl font-bold mb-1">{playingSong.song_name}</h3>
            {playingSong.artist && (
              <p className="text-lg opacity-90 mb-2">{playingSong.artist}</p>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-white/80">
                Mesa {playingSong.table_number} {playingSong.guest_name && `• ${playingSong.guest_name}`}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateStatus(playingSong.id, 'played')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Terminada
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Queue */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          Siguientes ({pendingSongs.length})
        </h2>
        
        {loading && songs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : pendingSongs.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <Music className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay canciones en cola</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingSongs.slice(0, 5).map((song, index) => (
              <Card key={song.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">#{index + 1}</Badge>
                        <span className="font-medium truncate">{song.song_name}</span>
                        {song.artist && <span className="text-gray-500 truncate">- {song.artist}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Mesa {song.table_number} {song.guest_name && `• ${song.guest_name}`}
                      </p>
                    </div>
                    
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 h-8 w-8 p-0"
                        onClick={() => updateStatus(song.id, 'playing')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateStatus(song.id, 'skipped')}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => updateStatus(song.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {pendingSongs.length > 5 && (
              <p className="text-center text-sm text-gray-500">
                +{pendingSongs.length - 5} más en cola
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent History */}
      {historySongs.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-gray-600">Historial reciente</h2>
          <div className="space-y-1">
            {historySongs.slice(0, 5).map(song => (
              <Card key={song.id} className="bg-gray-50">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-sm truncate">
                    {song.song_name} {song.artist && `- ${song.artist}`}
                    <span className="text-xs text-gray-400 ml-2">(Mesa {song.table_number})</span>
                  </span>
                  <Badge 
                    className={
                      song.status === 'played' ? 'bg-green-100 text-green-700' :
                      song.status === 'skipped' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }
                  >
                    {song.status === 'played' ? '✅' : song.status === 'skipped' ? '⏭️' : '❌'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
