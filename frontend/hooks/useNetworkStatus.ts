import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial connection
    setIsOnline(navigator.onLine)

    // Test connection speed (simplified)
    const testConnection = () => {
      const start = performance.now()
      fetch('/api/health', { method: 'HEAD' })
        .then(() => {
          const end = performance.now()
          const duration = end - start
          
          if (duration < 100) {
            setConnectionSpeed('fast')
          } else if (duration < 500) {
            setConnectionSpeed('normal')
          } else {
            setConnectionSpeed('slow')
          }
        })
        .catch(() => {
          setConnectionSpeed('slow')
        })
    }

    // Test connection every 30 seconds
    const interval = setInterval(testConnection, 30000)
    testConnection() // Initial test

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, connectionSpeed }
}
