"use client"

import { Coffee, Users, BarChart3, Settings, Utensils, ChevronLeft, ChevronRight, Menu, Music } from "lucide-react"
import Image from "next/image"
import { useTheme } from "@/contexts/ThemeContext"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  toggleSidebar: () => void
}

const menuItems = [
  { id: "inicio", label: "Inicio", icon: Coffee },
  { id: "menu", label: "Menú", icon: Utensils },
  { id: "canciones", label: "Canciones", icon: Music },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "configuracion", label: "Configuración", icon: Settings },
]

export function Sidebar({ activeSection, onSectionChange, isCollapsed, toggleSidebar }: SidebarProps) {
  const { theme } = useTheme()
  
  return (
    <div className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-14 sm:w-16' : 'w-56 sm:w-64'} bg-white shadow-lg border-r border-orange-100 z-40 transition-all duration-300`}>
      <div className={`${isCollapsed ? 'py-4 sm:py-6 px-1 sm:px-2' : 'p-3 sm:p-6'} border-b border-orange-100 flex justify-between items-center`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
              <Image src="/images/logo zet.png" alt="Zet Logo" fill className="object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 text-sm sm:text-base">DAIMUZ</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Sistema de Gestión</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 sm:w-10 sm:h-10 relative">
            <Image src="/images/logo zet.png" alt="Zet Logo" fill className="object-contain" />
          </div>
        )}
        
        <button 
          onClick={toggleSidebar} 
          className="text-gray-500 hover:text-orange-500 transition-colors p-1 rounded-full hover:bg-orange-50 flex-shrink-0"
        >
          {isCollapsed ? <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />}
        </button>
      </div>

      <nav className={`${isCollapsed ? 'p-1 sm:p-2' : 'p-2 sm:p-4'}`}>
        <div className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex ${isCollapsed ? 'justify-center' : ''} items-center gap-2 sm:gap-3 ${isCollapsed ? 'px-1.5 py-2 sm:px-2 sm:py-3' : 'px-2 py-2 sm:px-4 sm:py-3'} rounded-lg transition-all duration-200 ${
                activeSection === item.id
                  ? `bg-gradient-to-r ${theme.buttonPreset.gradient} text-white shadow-md`
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-xs sm:text-sm truncate">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
