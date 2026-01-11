import { useState, useEffect, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export interface GlobalRefreshEvent {
  type: 'ORDER_UPDATED' | 'ORDER_CREATED' | 'ORDER_DELETED' | 'PAYMENT_PROCESSED'
  timestamp: number
  source: 'mesero' | 'cajero' | 'dashboard' | 'cocinero'
  tableId?: number
  orderId?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      duration: 5000, // 5 seconds default
      ...notification
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Función para disparar refresh global entre vistas
  const triggerGlobalRefresh = useCallback((event: Partial<GlobalRefreshEvent> & { source: string }) => {
    const refreshEvent: GlobalRefreshEvent = {
      type: 'ORDER_UPDATED',
      timestamp: Date.now(),
      source: event.source as GlobalRefreshEvent['source'],
      tableId: event.tableId,
      orderId: event.orderId
    }
    
    // Usar localStorage para comunicar entre pestañas
    localStorage.setItem('globalRefreshTrigger', JSON.stringify(refreshEvent))
    
    // Disparar evento personalizado para pestañas de la misma sesión
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('globalRefresh', { detail: refreshEvent }))
    }
  }, [])

  // Hook para escuchar eventos de refresh global
  const useGlobalRefresh = useCallback((
    source: string,
    onRefresh: (event: GlobalRefreshEvent) => void
  ) => {
    useEffect(() => {
      const handleGlobalRefresh = (event: Event) => {
        const customEvent = event as CustomEvent<GlobalRefreshEvent>
        const { source: eventSource, timestamp } = customEvent.detail
        
        // Solo actualizar si el evento viene de otra vista y es reciente (menos de 5 segundos)
        if (eventSource !== source && Date.now() - timestamp < 5000) {
          onRefresh(customEvent.detail)
        }
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'globalRefreshTrigger' && event.newValue) {
          try {
            const refreshEvent: GlobalRefreshEvent = JSON.parse(event.newValue)
            if (refreshEvent.source !== source && Date.now() - refreshEvent.timestamp < 5000) {
              onRefresh(refreshEvent)
            }
          } catch (error) {
            console.error('Error procesando evento de storage:', error)
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('globalRefresh', handleGlobalRefresh)
        window.addEventListener('storage', handleStorageChange)

        return () => {
          window.removeEventListener('globalRefresh', handleGlobalRefresh)
          window.removeEventListener('storage', handleStorageChange)
        }
      }
    }, [source, onRefresh])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    triggerGlobalRefresh,
    useGlobalRefresh
  }
}
