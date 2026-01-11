"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Presets de colores para botones
export const buttonColorPresets = [
  { name: "Naranja-Verde", primary: "#f97316", secondary: "#22c55e", gradient: "from-orange-500 to-green-500" },
  { name: "Azul", primary: "#3b82f6", secondary: "#06b6d4", gradient: "from-blue-500 to-cyan-500" },
  { name: "Púrpura", primary: "#8b5cf6", secondary: "#ec4899", gradient: "from-purple-500 to-pink-500" },
  { name: "Rojo", primary: "#ef4444", secondary: "#f97316", gradient: "from-red-500 to-orange-500" },
  { name: "Verde", primary: "#22c55e", secondary: "#14b8a6", gradient: "from-green-500 to-teal-500" },
  { name: "Índigo", primary: "#6366f1", secondary: "#8b5cf6", gradient: "from-indigo-500 to-purple-500" },
  { name: "Rosa", primary: "#ec4899", secondary: "#f43f5e", gradient: "from-pink-500 to-rose-500" },
  { name: "Ámbar", primary: "#f59e0b", secondary: "#eab308", gradient: "from-amber-500 to-yellow-500" },
]

// Presets de colores para fondos
export const backgroundColorPresets = [
  { name: "Blanco", value: "#ffffff", class: "bg-white" },
  { name: "Gris claro", value: "#f9fafb", class: "bg-gray-50" },
  { name: "Crema", value: "#fef3c7", class: "bg-amber-100" },
  { name: "Azul claro", value: "#eff6ff", class: "bg-blue-50" },
  { name: "Verde claro", value: "#f0fdf4", class: "bg-green-50" },
  { name: "Rosa claro", value: "#fdf2f8", class: "bg-pink-50" },
  { name: "Púrpura claro", value: "#faf5ff", class: "bg-purple-50" },
  { name: "Naranja claro", value: "#fff7ed", class: "bg-orange-50" },
]

interface ThemeConfig {
  buttonPreset: typeof buttonColorPresets[0]
  backgroundPreset: typeof backgroundColorPresets[0]
}

interface ThemeContextType {
  theme: ThemeConfig
  setButtonPreset: (preset: typeof buttonColorPresets[0]) => void
  setBackgroundPreset: (preset: typeof backgroundColorPresets[0]) => void
  getButtonGradient: () => string
  getButtonHoverGradient: () => string
}

const defaultTheme: ThemeConfig = {
  buttonPreset: buttonColorPresets[0], // Naranja-Verde por defecto
  backgroundPreset: backgroundColorPresets[0], // Blanco por defecto
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme")
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        // Buscar los presets por nombre
        const buttonPreset = buttonColorPresets.find(p => p.name === parsed.buttonPresetName) || buttonColorPresets[0]
        const backgroundPreset = backgroundColorPresets.find(p => p.name === parsed.backgroundPresetName) || backgroundColorPresets[0]
        setTheme({ buttonPreset, backgroundPreset })
      } catch (e) {
        console.error("Error parsing saved theme:", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Guardar tema en localStorage y aplicar variables CSS
  useEffect(() => {
    if (!isLoaded) return

    localStorage.setItem("admin-theme", JSON.stringify({
      buttonPresetName: theme.buttonPreset.name,
      backgroundPresetName: theme.backgroundPreset.name,
    }))

    // Aplicar variables CSS personalizadas
    document.documentElement.style.setProperty("--theme-primary", theme.buttonPreset.primary)
    document.documentElement.style.setProperty("--theme-secondary", theme.buttonPreset.secondary)
    document.documentElement.style.setProperty("--theme-background", theme.backgroundPreset.value)
  }, [theme, isLoaded])

  const setButtonPreset = (preset: typeof buttonColorPresets[0]) => {
    setTheme(prev => ({ ...prev, buttonPreset: preset }))
  }

  const setBackgroundPreset = (preset: typeof backgroundColorPresets[0]) => {
    setTheme(prev => ({ ...prev, backgroundPreset: preset }))
  }

  const getButtonGradient = () => {
    return `bg-gradient-to-r ${theme.buttonPreset.gradient}`
  }

  const getButtonHoverGradient = () => {
    // Generar la versión hover (600 en lugar de 500)
    const gradient = theme.buttonPreset.gradient
    return `hover:${gradient.replace(/500/g, "600")}`
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setButtonPreset, 
      setBackgroundPreset,
      getButtonGradient,
      getButtonHoverGradient
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
