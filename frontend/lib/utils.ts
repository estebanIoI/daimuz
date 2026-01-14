import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Construye la URL completa para una imagen de producto
 * Maneja URLs relativas del backend y URLs absolutas
 */
export function getProductImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url

  // Limpiar el path para asegurar que no tenga problemas de slashes
  const cleanPath = url.startsWith('/') ? url : `/${url}`

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isProdDomain = hostname === 'daimuz.me' ||
        hostname === 'www.daimuz.me' ||
        hostname.endsWith('ondigitalocean.app');

      if (isProdDomain && !process.env.NEXT_PUBLIC_API_URL) {
        return window.location.origin;
      }
    }
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    return rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  }

  const baseUrl = getBaseUrl();
  return `${baseUrl}${cleanPath}`
}
