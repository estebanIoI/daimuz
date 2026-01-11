"use client"

import { useState } from "react"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTheme, buttonColorPresets, backgroundColorPresets } from "@/contexts/ThemeContext"

export function ThemeCustomizer() {
  const { theme, setButtonPreset, setBackgroundPreset } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-gray-600 hover:text-orange-500 hover:bg-orange-50 h-7 sm:h-8 lg:h-9 px-2 sm:px-3"
          title="Personalizar colores"
        >
          <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xl:inline text-xs lg:text-sm">Colores</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Palette className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">Personalizar Tema</h3>
          </div>

          {/* Colores de botones */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Color de Botones</label>
            <div className="grid grid-cols-4 gap-2">
              {buttonColorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setButtonPreset(preset)}
                  className={`
                    relative w-full aspect-square rounded-lg transition-all duration-200
                    bg-gradient-to-br ${preset.gradient}
                    hover:scale-105 hover:shadow-lg
                    ${theme.buttonPreset.name === preset.name ? "ring-2 ring-offset-2 ring-gray-800" : ""}
                  `}
                  title={preset.name}
                >
                  {theme.buttonPreset.name === preset.name && (
                    <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">{theme.buttonPreset.name}</p>
          </div>

          {/* Colores de fondo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Color de Fondo</label>
            <div className="grid grid-cols-4 gap-2">
              {backgroundColorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setBackgroundPreset(preset)}
                  className={`
                    relative w-full aspect-square rounded-lg transition-all duration-200 border
                    hover:scale-105 hover:shadow-lg
                    ${theme.backgroundPreset.name === preset.name ? "ring-2 ring-offset-2 ring-gray-800" : "border-gray-200"}
                  `}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {theme.backgroundPreset.name === preset.name && (
                    <Check className="absolute inset-0 m-auto w-4 h-4 text-gray-700 drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">{theme.backgroundPreset.name}</p>
          </div>

          {/* Vista previa */}
          <div className="pt-2 border-t">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Vista Previa</label>
            <div 
              className="p-3 rounded-lg border"
              style={{ backgroundColor: theme.backgroundPreset.value }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600">Botón ejemplo:</span>
                <button
                  className={`px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r ${theme.buttonPreset.gradient}`}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
