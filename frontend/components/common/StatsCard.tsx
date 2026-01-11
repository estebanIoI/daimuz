import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  bgColor: string
  borderColor: string
  subtitle?: string
}

export function StatsCard({ title, value, icon: Icon, iconColor, bgColor, borderColor, subtitle }: StatsCardProps) {
  return (
    <Card className={`${borderColor} h-full`}>
      <CardContent className="p-1.5 sm:p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ${bgColor} rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[9px] sm:text-xs lg:text-sm text-gray-500 truncate leading-tight">{title}</p>
            <p className="text-xs sm:text-lg lg:text-2xl font-bold text-gray-800 truncate leading-tight">{value}</p>
            {subtitle && <p className="text-[9px] sm:text-xs lg:text-sm text-green-600 truncate">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
