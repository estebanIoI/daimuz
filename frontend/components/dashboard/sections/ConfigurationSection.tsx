import { useState, useEffect } from "react"
import { Upload, Database, AlertCircle, Download, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApi } from "@/hooks/useApi"
import { AuthDebugger } from "@/components/dashboard/AuthDebugger"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

// Tipos para los respaldos
interface Backup {
  fileName: string;
  createdAt: string;
  size: number;
  sizeFormatted: string;
}

interface BackupListResponse {
  backups: Backup[];
  lastBackup: Backup | null;
}

export function ConfigurationSection() {
  const { apiCall } = useApi()
  const [isLoading, setIsLoading] = useState(false)
  const [backupMessage, setBackupMessage] = useState("")
  const [lastBackupDate, setLastBackupDate] = useState<string | null>("15/01/2024 - 23:30")
  const [backups, setBackups] = useState<Backup[]>([])
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)

  // Cargar lista de respaldos disponibles
  const loadBackups = async () => {
    try {
      console.log("Iniciando carga de respaldos con token:", localStorage.getItem("token")?.substring(0, 15) + "...");
      
      const data = await apiCall("database.listBackups") as BackupListResponse
      console.log("Respuesta de listBackups:", data);
      
      if (data?.backups) {
        setBackups(data.backups)
        
        // Actualizar la fecha del último respaldo si existe
        if (data.lastBackup) {
          const date = new Date(data.lastBackup.createdAt)
          setLastBackupDate(date.toLocaleDateString() + " - " + date.toLocaleTimeString())
        }
      } else {
        console.warn("La respuesta no contiene la propiedad 'backups':", data);
        setBackups([])
      }
    } catch (error) {
      console.error("Error al cargar respaldos:", error)
      setBackupMessage("❌ No se pudieron cargar los respaldos. Comprueba que tu usuario tiene permisos.")
      setBackups([])
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setBackupMessage(""), 5000)
    }
  }
  
  // Cargar respaldos al montar el componente
  useEffect(() => {
    loadBackups()
  }, [])

  // Crear respaldo de la base de datos
  const createBackup = async () => {
    setIsLoading(true)
    setBackupMessage("")
    
    try {
      await apiCall("database.backup")
      setBackupMessage("✅ Respaldo creado exitosamente")
      setLastBackupDate(new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString())
      
      // Recargar la lista de respaldos
      await loadBackups()
      
      setTimeout(() => setBackupMessage(""), 3000)
    } catch (error) {
      setBackupMessage("❌ Error al crear el respaldo")
      console.error("Error al crear el respaldo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Restaurar respaldo de la base de datos
  const restoreBackup = async (fileName?: string) => {
    const confirmMessage = fileName 
      ? `¿Está seguro que desea restaurar la base de datos desde el respaldo "${fileName}"? Esta acción no se puede deshacer.`
      : "¿Está seguro que desea restaurar la base de datos desde el respaldo más reciente? Esta acción no se puede deshacer.";
    
    if (confirm(confirmMessage)) {
      setIsLoading(true)
      setBackupMessage("")
      
      try {
        await apiCall("database.restore", { fileName })
        setBackupMessage("✅ Respaldo restaurado exitosamente")
        setTimeout(() => setBackupMessage(""), 3000)
      } catch (error) {
        setBackupMessage("❌ Error al restaurar el respaldo")
        console.error("Error al restaurar el respaldo:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">⚙️ Configuración</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Respaldos de base de datos</p>
        </div>
        {backupMessage && (
          <span className={`text-[10px] sm:text-sm ${backupMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {backupMessage}
          </span>
        )}
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base">💾 Respaldo y Restauración</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-6">
          <div className="space-y-2">
            <Button 
              onClick={() => createBackup()} 
              disabled={isLoading} 
              size="sm"
              className="w-full h-8 sm:h-10 text-xs sm:text-sm"
            >
              <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {isLoading ? "Procesando..." : "Crear Respaldo"}
            </Button>
            
            <div className="flex gap-1.5 sm:gap-2">
              <Button 
                onClick={() => restoreBackup()} 
                disabled={isLoading} 
                variant="outline" 
                size="sm"
                className="flex-grow h-8 sm:h-10 text-[10px] sm:text-sm"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Restaurar Último</span>
                <span className="sm:hidden">Restaurar</span>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading || backups.length === 0} 
                    className="px-2 sm:px-3 h-8 sm:h-10"
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">Seleccione un respaldo</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                    {backups.length > 0 ? (
                      <div className="space-y-2 py-2">
                        {backups.map((backup) => {
                          const date = new Date(backup.createdAt);
                          const formattedDate = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
                          
                          return (
                            <div key={backup.fileName} className="flex items-center justify-between p-2 sm:p-3 border rounded hover:bg-gray-50">
                              <div className="min-w-0">
                                <p className="font-medium text-xs sm:text-sm truncate">{formattedDate}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">{backup.sizeFormatted}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 sm:h-8 px-2 text-xs sm:text-sm flex-shrink-0"
                                onClick={() => {
                                  restoreBackup(backup.fileName);
                                }}
                              >
                                <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Restaurar</span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">No hay respaldos</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                className="px-2 sm:px-3 h-8 sm:h-10"
                onClick={() => loadBackups()}
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-2 sm:p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-[10px] sm:text-sm font-medium text-yellow-800">Estado:</span>
            </div>
            {lastBackupDate ? (
              <p className="text-[10px] sm:text-sm text-yellow-700 mt-1">
                Último: {lastBackupDate} 
                <span className="block mt-0.5 text-[9px] sm:text-xs">
                  Total: {backups.length} respaldos
                </span>
              </p>
            ) : (
              <p className="text-[10px] sm:text-sm text-yellow-700 mt-1">
                Sin respaldos aún.
              </p>
            )}
          </div>
          
          <div className="p-2 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-[10px] sm:text-sm text-blue-700">
              <strong>Nota:</strong> Los respaldos incluyen todos los datos del sistema.
            </p>
          </div>
          
          <AuthDebugger />
        </CardContent>
      </Card>
    </div>
  )
}
