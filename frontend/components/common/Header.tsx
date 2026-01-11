"use client"

import { LogOut, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface HeaderProps {
  title: string
  subtitle: string
  userName: string
  userRole: string
  currentTime: Date | null
  onLogout: () => void
}

export function Header({ title, subtitle, userName, userRole, currentTime, onLogout }: HeaderProps) {
  return (
    <header className="bg-transparent shadow-sm border-b border-green-100 sticky top-0 z-30">
      <div className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 relative flex-shrink-0">
            <Image src="/images/logo zet.png" alt="Zet Logo" fill className="object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">{title}</h1>
            <p className="text-[10px] sm:text-xs lg:text-sm text-green-600 font-medium truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 flex-shrink-0">
          {/* Desktop user info */}
          <div className="text-right hidden lg:block">
            <p className="text-sm text-gray-600">{userName}</p>
            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3" />
              {currentTime ? currentTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
          </div>

          {/* Tablet user info */}
          <div className="text-right hidden sm:block lg:hidden">
            <p className="text-xs text-gray-600 truncate max-w-24">{userName.split(" ")[0]}</p>
            <p className="text-[10px] text-gray-500 flex items-center justify-end gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {currentTime ? currentTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
          </div>

          {/* Mobile user info */}
          <div className="text-right sm:hidden">
            <p className="text-[10px] text-gray-600 truncate max-w-14">{userName.split(" ")[0]}</p>
            <p className="text-[10px] text-gray-500">
              {currentTime ? currentTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
          </div>

          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent text-[10px] sm:text-xs lg:text-sm px-1.5 sm:px-2 lg:px-3 h-6 sm:h-7 lg:h-8"
          >
            <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
            <span className="hidden lg:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
