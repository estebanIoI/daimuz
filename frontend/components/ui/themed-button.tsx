"use client"

import { forwardRef } from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

interface ThemedButtonProps extends ButtonProps {
  useGradient?: boolean
}

/**
 * Botón con colores dinámicos basados en el tema seleccionado
 */
export const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, useGradient = true, children, ...props }, ref) => {
    const { theme } = useTheme()

    if (!useGradient) {
      return (
        <Button
          ref={ref}
          className={cn(className)}
          style={{
            backgroundColor: theme.buttonPreset.primary,
            color: "white",
          }}
          {...props}
        >
          {children}
        </Button>
      )
    }

    return (
      <Button
        ref={ref}
        className={cn(
          `bg-gradient-to-r ${theme.buttonPreset.gradient} hover:opacity-90 text-white`,
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

ThemedButton.displayName = "ThemedButton"
