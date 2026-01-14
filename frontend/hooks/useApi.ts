"use client"

import { useState, useCallback } from "react"

const getApiBaseUrl = () => {
  // En el cliente, si no estamos en localhost, podemos intentar usar la URL actual
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProdDomain = hostname === 'daimuz.me' ||
      hostname === 'www.daimuz.me' ||
      hostname.endsWith('ondigitalocean.app');

    if (isProdDomain && !process.env.NEXT_PUBLIC_API_URL) {
      return `${window.location.origin}/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
}

const API_BASE_URL = getApiBaseUrl();

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // ✅ Obtener headers con token para autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  // ✅ Subir imagen de producto
  const uploadProductImage = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${API_BASE_URL}/upload/product-image`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al subir la imagen")
      }

      const result = await response.json()

      if (result.success && result.data?.url) {
        console.log("✅ Imagen subida:", result.data.url)
        return result.data.url
      }

      throw new Error("Respuesta inválida del servidor")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al subir la imagen"
      setError(errorMessage)
      console.error("❌ Error subiendo imagen:", errorMessage)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  // ✅ Método general para consumir servicios del backend con retry y rate limiting
  const apiCall = useCallback(async (service: string, payload: any = {}, retries: number = 3, isDeadlockRetry: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      // Validación rápida
      if (!service || typeof service !== "string") {
        throw new Error("El nombre del servicio debe ser una cadena válida.")
      }

      const response = await fetch(`${API_BASE_URL}/service`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ service, payload }),
      })

      // ✅ Manejo específico de rate limiting (429)
      if (response.status === 429) {
        const textResponse = await response.text()
        console.warn("⚠️ Rate limit alcanzado:", textResponse)

        if (retries > 0) {
          // Backoff exponencial: esperar más tiempo en cada intento
          const delay = Math.pow(2, 4 - retries) * 1000 // 2s, 4s, 8s
          console.log(`🔄 Reintentando en ${delay / 1000}s... (${retries} intentos restantes)`)

          await new Promise(resolve => setTimeout(resolve, delay))
          return apiCall(service, payload, retries - 1, isDeadlockRetry)
        } else {
          throw new Error("RATE_LIMIT_EXCEEDED")
        }
      }

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Respuesta no JSON:", textResponse)
        throw new Error(`Respuesta inválida del servidor: ${textResponse.substring(0, 100)}...`)
      }

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al procesar la solicitud")
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"

      // Manejo especial para deadlocks - retry automático
      if (errorMessage.includes("Deadlock found") && !isDeadlockRetry && retries > 0) {
        console.warn(`🔄 Deadlock detectado, reintentando ${4 - retries}/3...`)

        // Esperar un tiempo aleatorio antes de reintentar (50-200ms)
        const delay = Math.random() * 150 + 50
        await new Promise(resolve => setTimeout(resolve, delay))

        // Reintentar la llamada con flag de deadlock
        return apiCall(service, payload, retries - 1, true)
      }

      // No mostrar error en consola si es rate limiting y se está reintentando
      if (errorMessage !== "RATE_LIMIT_EXCEEDED") {
        setError(errorMessage)
        console.error("❌ API Error:", errorMessage)
      }

      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    apiCall,
    uploading,
    uploadProductImage,
  }
}
