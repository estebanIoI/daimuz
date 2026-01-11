"use client"

import { LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeCustomizer } from "@/components/dashboard/ThemeCustomizer"

interface AdminHeaderProps {
  currentUser: string
  onLogout: () => void
  isCollapsed: boolean
  toggleSidebar: () => void
}

export function AdminHeader({ 
  currentUser, 
  onLogout,
  isCollapsed,
  toggleSidebar
}: AdminHeaderProps) {
  return (
    <header className={`fixed top-0 ${isCollapsed ? 'left-14 sm:left-16' : 'left-56 sm:left-64'} right-0 bg-white shadow-sm border-b border-orange-100 z-30 transition-all duration-300`}>
      <div className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-orange-500 lg:hidden h-7 w-7 sm:h-8 sm:w-8"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-800 truncate">Panel Admin</h1>
            <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 truncate hidden sm:block">Gestiona tu restaurante</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4">
          {/* Personalizador de tema */}
          <ThemeCustomizer />
          
          <div className="text-right hidden sm:block">
            <p className="text-xs lg:text-sm text-gray-600 truncate max-w-24 lg:max-w-none">{currentUser}</p>
            <p className="text-[10px] lg:text-xs text-gray-500">Administrador</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 sm:gap-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3 h-7 sm:h-8 lg:h-9"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Cerrar Sesión</span>
            <span className="lg:hidden">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
