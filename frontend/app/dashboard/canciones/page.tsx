'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, SkipForward, CheckCircle, XCircle, RefreshCw, Loader2, Headphones } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/common/Header';
import { StatsCard } from '@/components/common/StatsCard';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { toast } from 'sonner';
import ClientOnly from '@/components/ClientOnly';

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

export default function CancionesPage() {
  const { apiCall } = useApi();
  const { currentUser, isAuthenticated, handleLogout } = useAuth('administrador');
  const currentTime = useCurrentTime(60000);
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
    if (isAuthenticated) {
      loadSongs();
    }
  }, [isAuthenticated, loadSongs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;
    
    const interval = setInterval(() => loadSongs(false), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, loadSongs]);

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', label: string, className: string }> = {
      pending: { variant: 'secondary', label: '⏳ Pendiente', className: 'bg-yellow-100 text-yellow-700' },
      playing: { variant: 'default', label: '🎵 Reproduciendo', className: 'bg-green-500 text-white animate-pulse' },
      played: { variant: 'outline', label: '✅ Reproducida', className: 'text-gray-600' },
      skipped: { variant: 'destructive', label: '⏭️ Omitida', className: 'bg-orange-100 text-orange-700' },
      rejected: { variant: 'destructive', label: '❌ Rechazada', className: 'bg-red-100 text-red-700' }
    };
    
    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const pendingSongs = songs.filter(s => s.status === 'pending');
  const playingSong = songs.find(s => s.status === 'playing');
  const historySongs = songs.filter(s => ['played', 'skipped', 'rejected'].includes(s.status));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Header
          title=""
          subtitle="🎵 Cola de Canciones"
          userName={currentUser || "Admin"}
          userRole="Administrador"
          currentTime={currentTime}
          onLogout={handleLogout}
        />

        <div className="p-4 sm:p-6 space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
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
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {pendingSongs.length} en cola
            </Badge>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatsCard
                title="Total Hoy"
                value={stats.total_requests}
                icon={Music}
                iconColor="text-purple-600"
                bgColor="bg-purple-50"
                borderColor="border-purple-200"
              />
              <StatsCard
                title="Reproducidas"
                value={stats.played}
                icon={CheckCircle}
                iconColor="text-green-600"
                bgColor="bg-green-50"
                borderColor="border-green-200"
              />
              <StatsCard
                title="Pendientes"
                value={stats.pending}
                icon={Headphones}
                iconColor="text-yellow-600"
                bgColor="bg-yellow-50"
                borderColor="border-yellow-200"
              />
              <StatsCard
                title="Omitidas"
                value={stats.skipped + stats.rejected}
                icon={SkipForward}
                iconColor="text-orange-600"
                bgColor="bg-orange-50"
                borderColor="border-orange-200"
              />
            </div>
          )}

          {/* Now Playing */}
          {playingSong && (
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-white/20 rounded-full animate-pulse">
                    <Play className="h-6 w-6" />
                  </div>
                  Reproduciendo Ahora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">{playingSong.song_name}</h3>
                {playingSong.artist && (
                  <p className="text-lg opacity-90 mb-3">{playingSong.artist}</p>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <span>Mesa {playingSong.table_number}</span>
                    {playingSong.guest_name && <span>• {playingSong.guest_name}</span>}
                  </div>
                  <div className="flex gap-2">
                    {playingSong.song_url && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(playingSong.song_url!, '_blank')}
                      >
                        Abrir enlace
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => updateStatus(playingSong.id, 'played')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Terminada
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Queue */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Music className="h-6 w-6 text-purple-600" />
              Siguientes ({pendingSongs.length})
            </h2>
            
            {loading && songs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : pendingSongs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No hay canciones en cola</p>
                  <p className="text-gray-400 text-sm mt-1">Las solicitudes aparecerán aquí</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {pendingSongs.map((song, index) => (
                  <Card key={song.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            <h3 className="text-lg font-semibold truncate">{song.song_name}</h3>
                          </div>
                          {song.artist && (
                            <p className="text-gray-600 mb-1">{song.artist}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span>Mesa {song.table_number}</span>
                            {song.guest_name && <span>• {song.guest_name}</span>}
                            <span>• {new Date(song.requested_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {song.song_url && (
                            <a 
                              href={song.song_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              🔗 Ver en {song.platform}
                            </a>
                          )}
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => updateStatus(song.id, 'playing')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(song.id, 'skipped')}
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(song.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {historySongs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-600">Historial de hoy</h2>
              <div className="space-y-2">
                {historySongs.slice(0, 20).map(song => (
                  <Card key={song.id} className="bg-gray-50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{song.song_name}</span>
                        {song.artist && (
                          <span className="text-gray-500 text-sm"> - {song.artist}</span>
                        )}
                        <span className="text-xs text-gray-400 ml-2">
                          (Mesa {song.table_number})
                        </span>
                      </div>
                      {getStatusBadge(song.status)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
