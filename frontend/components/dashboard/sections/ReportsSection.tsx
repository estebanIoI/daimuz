import { useState, useEffect } from "react"
import { Filter, Download, Calendar, BarChart3, TrendingUp, CreditCard, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Table as TableData, MenuItem } from "@/types"
import { StatsCard } from "@/components/common/StatsCard"
import { useApi } from "@/hooks/useApi"
import { InvoiceCard } from "@/components/dashboard/InvoiceCard"
import { InvoiceDetailsModal } from "@/components/dashboard/InvoiceDetailsModal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Interfaces for API data
interface DailySale {
  date: string
  total_payments: number
  total_sales: number
}

interface ProductSale {
  id: number
  name: string
  category: string
  unitsSold: number
  revenue: number
}

interface TablePerformance {
  id: number
  tableNumber: number
  ordersServed: number
  totalRevenue: number
  avgOrderValue: number
  waiterName: string
}

interface PaymentMethod {
  method: string
  totalRevenue: number
  transactions: number
}

interface WaiterPerformance {
  id: number
  waiterName: string
  ordersServed: number
  totalRevenue: number
  avgOrderValue: number
}

interface InvoiceItem {
  order_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  menu_item_id: number;
  menu_item_name: string;
  description?: string;
  category_name: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  table_number: number;
  waiter_name: string;
  cashier_name: string;
  subtotal: number;
  total: number;
  payment_method: 'efectivo' | 'tarjeta' | 'nequi' | 'transferencia';
  transaction_id?: string;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
}

interface ReportsSectionProps {
  tables: TableData[]
  menuItems: MenuItem[]
}

export function ReportsSection({ tables, menuItems }: ReportsSectionProps) {
  const { apiCall } = useApi()
  
  // Función para validar y obtener valores numéricos seguros
  const getValidNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  // Función utilitaria para formatear moneda en COP
  const formatCurrency = (amount: number) => {
    // Asegurarse de que el valor sea un número válido
    const validAmount = getValidNumber(amount);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(validAmount);
  };

  // Función para formatear moneda sin símbolo (para PDFs)
  const formatCurrencyPlain = (amount: number) => {
    const validAmount = getValidNumber(amount);
    return `$${validAmount.toLocaleString('es-CO')}`;
  };

  // Función para calcular total de ingresos de facturas
  const calculateTotalInvoiceRevenue = (invoices: Invoice[]): number => {
    return invoices.reduce((sum, invoice) => {
      return sum + getValidNumber(invoice.total);
    }, 0);
  };

  // Función para calcular promedio de facturación
  const calculateAverageInvoiceValue = (invoices: Invoice[]): number => {
    if (invoices.length === 0) return 0;
    const total = calculateTotalInvoiceRevenue(invoices);
    return total / invoices.length;
  };
  
  // State for API data
  const [dailySalesData, setDailySalesData] = useState<DailySale[]>([])
  const [salesSummary, setSalesSummary] = useState({
    todaySales: 0,
    weeklyAverage: 0,
    monthlySales: 0,
    todayChange: 0,
    weeklyChange: 0,
    monthlyChange: 0
  })
  const [productSalesData, setProductSalesData] = useState<ProductSale[]>([])
  const [tablePerformanceData, setTablePerformanceData] = useState<TablePerformance[]>([])
  const [paymentMethodSummary, setPaymentMethodSummary] = useState<PaymentMethod[]>([])
  const [waiterPerformanceData, setWaiterPerformanceData] = useState<WaiterPerformance[]>([])
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  
  // Estados para filtros de fecha y hora
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedHour, setSelectedHour] = useState<string>('all')

  // Funciones utilitarias para filtros
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i.toString())
    }
    return years
  }

  const generateMonthOptions = () => {
    return [
      { value: '1', label: 'Enero' },
      { value: '2', label: 'Febrero' },
      { value: '3', label: 'Marzo' },
      { value: '4', label: 'Abril' },
      { value: '5', label: 'Mayo' },
      { value: '6', label: 'Junio' },
      { value: '7', label: 'Julio' },
      { value: '8', label: 'Agosto' },
      { value: '9', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' }
    ]
  }

  const generateDayOptions = () => {
    const days = []
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString())
    }
    return days
  }

  const generateHourOptions = () => {
    const hours = []
    for (let i = 0; i <= 23; i++) {
      const hour = i.toString().padStart(2, '0')
      hours.push({ value: hour, label: `${hour}:00` })
    }
    return hours
  }

  // Función para filtrar datos por fecha y hora (mejorada)
  const filterDataByDateTime = (data: any[], dateField: string = 'date') => {
    if (!data || data.length === 0) return data
    
    // Si no hay filtros activos, devolver todos los datos
    if (selectedYear === 'all' && selectedMonth === 'all' && selectedDay === 'all' && selectedHour === 'all') {
      return data
    }

    return data.filter(item => {
      // Intentar múltiples campos de fecha posibles
      const possibleDateFields = [dateField, 'created_at', 'date', 'timestamp', 'updated_at']
      let itemDate: Date | null = null
      
      for (const field of possibleDateFields) {
        if (item[field]) {
          itemDate = new Date(item[field])
          if (!isNaN(itemDate.getTime())) {
            break
          }
        }
      }
      
      // Si no encontramos una fecha válida, incluir el item
      if (!itemDate || isNaN(itemDate.getTime())) {
        return true
      }
      
      if (selectedYear !== 'all' && itemDate.getFullYear().toString() !== selectedYear) {
        return false
      }
      
      if (selectedMonth !== 'all' && (itemDate.getMonth() + 1).toString() !== selectedMonth) {
        return false
      }
      
      if (selectedDay !== 'all' && itemDate.getDate().toString() !== selectedDay) {
        return false
      }
      
      if (selectedHour !== 'all' && itemDate.getHours().toString().padStart(2, '0') !== selectedHour) {
        return false
      }
      
      return true
    })
  }

  // Función para resetear filtros
  const resetFilters = () => {
    setSelectedYear('all')
    setSelectedMonth('all')
    setSelectedDay('all')
    setSelectedHour('all')
  }

  // Función para construir parámetros de fecha para las APIs
  const buildDateFilters = () => {
    const filters: any = {}
    
    if (selectedYear !== 'all') {
      filters.year = selectedYear
    }
    
    if (selectedMonth !== 'all') {
      filters.month = selectedMonth
    }
    
    if (selectedDay !== 'all') {
      filters.day = selectedDay
    }
    
    if (selectedHour !== 'all') {
      filters.hour = selectedHour
    }
    
    return filters
  }

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Por ahora, obtenemos todos los datos sin filtros del backend
        // En el futuro, cuando el backend soporte filtros, usaremos buildDateFilters()
        const [dailySales, products, tables, payments, invoices, waiters] = await Promise.all([
          apiCall("report.dailySales"),
          apiCall("report.topProducts"),
          apiCall("report.tablePerformance"),
          apiCall("report.paymentSummary"),
          apiCall("invoice.getAll"),
          apiCall("report.waiterPerformance")
        ])

        console.log("📊 Datos de reportes recibidos:", { dailySales, products, tables, payments, invoices, waiters })
        console.log("📄 Facturas específicamente:", invoices)
        console.log("📄 Array de facturas:", invoices?.invoices)
        console.log("👨‍🍳 Rendimiento de meseros:", waiters)

        setDailySalesData(dailySales || [])
        setProductSalesData(products || [])
        setTablePerformanceData(tables || [])
        setPaymentMethodSummary(payments || [])
        setInvoicesData(invoices?.invoices || [])

        // Usar datos de rendimiento de meseros directamente del backend
        if (waiters && Array.isArray(waiters)) {
          setWaiterPerformanceData(waiters)
        } else {
          setWaiterPerformanceData([])
        }

        // Calculate sales summary from dailySales data
        if (dailySales && dailySales.length > 0) {
          const today = dailySales[0]
          const yesterday = dailySales[1]
          const weeklyAvg = dailySales.reduce((sum: number, day: DailySale) => sum + (day.total_sales || 0), 0) / dailySales.length
          
          // Si solo has abierto hoy, usar las ventas de hoy como total mensual
          const todayDate = new Date().toISOString().split('T')[0]
          const onlyToday = dailySales.filter((day: DailySale) => 
            day.date.toString().includes(todayDate)
          ).length === dailySales.length
          
          // Si solo hay ventas de hoy, usar las ventas de hoy como total mensual
          let monthlyTotal = 0
          if (onlyToday) {
            monthlyTotal = today?.total_sales || 0
          } else {
            // Si hay datos de otros días, calcular correctamente el total mensual
            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()
            monthlyTotal = dailySales
              .filter((day: DailySale) => {
                const dayDate = new Date(day.date)
                return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear
              })
              .reduce((sum: number, day: DailySale) => sum + (day.total_sales || 0), 0)
          }

          setSalesSummary({
            todaySales: today?.total_sales || 0,
            weeklyAverage: weeklyAvg,
            monthlySales: monthlyTotal,
            todayChange: yesterday && yesterday.total_sales ? (((today?.total_sales || 0) - (yesterday?.total_sales || 0)) / (yesterday?.total_sales || 1) * 100) : 0,
            weeklyChange: onlyToday ? 0 : 8, // Si solo hay datos de hoy, no hay cambio semanal
            monthlyChange: onlyToday ? 0 : 15 // Si solo hay datos de hoy, no hay cambio mensual
          })
        } else {
          setSalesSummary({
            todaySales: 0,
            weeklyAverage: 0,
            monthlySales: 0,
            todayChange: 0,
            weeklyChange: 0,
            monthlyChange: 0
          })
        }
      } catch (err) {
        console.error("❌ Error cargando reportes:", err)
        // Set default values in case of error
        setDailySalesData([])
        setProductSalesData([])
        setTablePerformanceData([])
        setPaymentMethodSummary([])
        setWaiterPerformanceData([])
        setInvoicesData([])
        setSalesSummary({
          todaySales: 0,
          weeklyAverage: 0,
          monthlySales: 0,
          todayChange: 0,
          weeklyChange: 0,
          monthlyChange: 0
        })
      }
    }

    fetchReports()
  }, []) // Solo ejecutar una vez al montar el componente

  // Efecto para recalcular datos cuando cambien los filtros
  useEffect(() => {
    // Los datos filtrados se recalculan automáticamente cuando cambian las variables de estado
    // Solo necesitamos este efecto si queremos hacer algún procesamiento adicional
  }, [selectedYear, selectedMonth, selectedDay, selectedHour])

  // Agregar valores por defecto para evitar errores
  const safeDailySalesData = dailySalesData || []
  const safeProductSalesData = productSalesData || []
  const safeTablePerformanceData = tablePerformanceData || []
  const safePaymentMethodSummary = paymentMethodSummary || []
  const safeWaiterPerformanceData = waiterPerformanceData || []
  const safeInvoicesData = invoicesData || []

  // Aplicar filtros a todos los datos
  const filteredDailySalesData = filterDataByDateTime(safeDailySalesData, 'date')
  const filteredProductSalesData = filterDataByDateTime(safeProductSalesData, 'created_at')
  const filteredTablePerformanceData = filterDataByDateTime(safeTablePerformanceData, 'created_at')
  const filteredPaymentMethodSummary = filterDataByDateTime(safePaymentMethodSummary, 'created_at')
  const filteredWaiterPerformanceData = filterDataByDateTime(safeWaiterPerformanceData, 'created_at')
  const filteredInvoicesData = filterDataByDateTime(safeInvoicesData, 'created_at')

  // Cálculos seguros para facturas usando datos filtrados
  const totalInvoiceRevenue = calculateTotalInvoiceRevenue(filteredInvoicesData)
  const averageInvoiceValue = calculateAverageInvoiceValue(filteredInvoicesData)

  // Recalcular totales con datos filtrados
  const totalMonthlyRevenue = filteredPaymentMethodSummary.reduce((sum: number, method: PaymentMethod) => sum + (method.totalRevenue || 0), 0)

  // Debug logs
  console.log("🔍 Debug facturas:", {
    safeInvoicesData: safeInvoicesData,
    length: safeInvoicesData.length,
    totalInvoiceRevenue,
    averageInvoiceValue,
    sampleInvoice: safeInvoicesData[0]
  })

  // Función para exportar datos a PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    const currentDate = new Date().toLocaleDateString()
    
    // Configuración del encabezado del PDF
    doc.setFontSize(18)
    doc.text('Reporte del Restaurante', 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Generado el: ${currentDate}`, 14, 30)
    
    // Sección de resumen de ventas
    doc.setFontSize(14)
    doc.text('Resumen de Ventas', 14, 40)
    
    // Tabla de resumen
    autoTable(doc, {
      startY: 45,
      head: [['Período', 'Ventas', 'Cambio']],
      body: [
        ['Hoy', formatCurrencyPlain(salesSummary.todaySales), `${salesSummary.todayChange >= 0 ? '+' : ''}${salesSummary.todayChange.toFixed(1)}%`],
        ['Promedio Semanal', formatCurrencyPlain(salesSummary.weeklyAverage), `${salesSummary.weeklyChange >= 0 ? '+' : ''}${salesSummary.weeklyChange}%`],
        ['Total Mensual', formatCurrencyPlain(salesSummary.monthlySales), `${salesSummary.monthlyChange >= 0 ? '+' : ''}${salesSummary.monthlyChange}%`]
      ],
      didDrawPage: function(data) {
        // Usar el evento didDrawPage para calcular la posición siguiente
      }
    })

    // Sección de productos más vendidos (en nueva página para evitar problemas de posición)
    doc.addPage()
    doc.setFontSize(18)
    doc.text('Productos Más Vendidos', 14, 20)
    
    autoTable(doc, {
      startY: 25,
      head: [['Producto', 'Categoría', 'Unidades Vendidas', 'Ingresos']],
      body: productSalesData.map(product => [
        product.name,
        product.category,
        product.unitsSold.toString(),
        formatCurrencyPlain(product.revenue)
      ])
    })

    // Sección de rendimiento de mesas (en nueva página)
    doc.addPage()
    doc.setFontSize(18)
    doc.text('Rendimiento de Mesas', 14, 20)
    
    autoTable(doc, {
      startY: 25,
      head: [['Mesa', 'Órdenes', 'Ingresos', 'Valor Promedio', 'Mesero']],
      body: tablePerformanceData.map(table => [
        table.tableNumber.toString(),
        table.ordersServed.toString(),
        formatCurrencyPlain(table.totalRevenue),
        formatCurrencyPlain(table.avgOrderValue),
        table.waiterName
      ])
    })

    // Sección de rendimiento de meseros
    if (waiterPerformanceData.length > 0) {
      doc.addPage()
      doc.setFontSize(18)
      doc.text('Rendimiento de Meseros', 14, 20)
      
      autoTable(doc, {
        startY: 25,
        head: [['Mesero', 'Órdenes', 'Ingresos', 'Valor Promedio']],
        body: waiterPerformanceData.map(waiter => [
          waiter.waiterName,
          waiter.ordersServed.toString(),
          formatCurrencyPlain(waiter.totalRevenue),
          formatCurrencyPlain(waiter.avgOrderValue)
        ])
      })
    }

    // Sección de métodos de pago
    doc.addPage()
    doc.setFontSize(18)
    doc.text('Métodos de Pago', 14, 20)
    
    autoTable(doc, {
      startY: 25,
      head: [['Método', 'Ingresos', 'Transacciones']],
      body: paymentMethodSummary.map(method => [
        method.method,
        formatCurrencyPlain(method.totalRevenue),
        method.transactions.toString()
      ])
    })
    
    // Guardar el PDF
    doc.save('reporte-restaurante.pdf')
  }

  // Funciones para manejar facturas
  const handleViewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsInvoiceModalOpen(true)
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    const doc = new jsPDF()
    
    // Configurar la impresión de la factura
    doc.setFontSize(16)
    doc.text('FACTURA', 14, 20)
    doc.text(invoice.invoice_number, 14, 30)
    
    doc.setFontSize(12)
    doc.text(`Mesa: ${invoice.table_number}`, 14, 45)
    doc.text(`Mesero: ${invoice.waiter_name}`, 14, 55)
    doc.text(`Cajero: ${invoice.cashier_name}`, 14, 65)
    doc.text(`Fecha: ${new Date(invoice.created_at).toLocaleString('es-CO')}`, 14, 75)
    doc.text(`Método de pago: ${invoice.payment_method.toUpperCase()}`, 14, 85)
    
    // Tabla de productos
    autoTable(doc, {
      startY: 95,
      head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: invoice.items.map(item => [
        item.menu_item_name,
        item.quantity.toString(),
        formatCurrencyPlain(item.unit_price),
        formatCurrencyPlain(item.subtotal)
      ]),
      foot: [
        ['', '', 'TOTAL:', formatCurrencyPlain(invoice.total)]
      ]
    })
    
    doc.save(`factura-${invoice.invoice_number}.pdf`)
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">📊 Reportes</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Análisis de ventas</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2">

          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-4" onClick={handleExportPDF}>
            <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden ml-1">PDF</span>
          </Button>
        </div>
      </div>

      {/* Filtros de fecha y hora */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 items-end">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="year-filter" className="text-[10px] sm:text-sm">Año</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year-filter" className="h-7 sm:h-9 text-[10px] sm:text-sm">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {generateYearOptions().map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="month-filter" className="text-[10px] sm:text-sm">Mes</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-filter" className="h-7 sm:h-9 text-[10px] sm:text-sm">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {generateMonthOptions().map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="day-filter" className="text-[10px] sm:text-sm">Día</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger id="day-filter" className="h-7 sm:h-9 text-[10px] sm:text-sm">
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {generateDayOptions().map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="hour-filter" className="text-[10px] sm:text-sm">Hora</Label>
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger id="hour-filter" className="h-7 sm:h-9 text-[10px] sm:text-sm">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {generateHourOptions().map(hour => (
                    <SelectItem key={hour.value} value={hour.value}>{hour.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1 sm:gap-2 col-span-2 sm:col-span-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetFilters}
                className="flex items-center gap-1 sm:gap-2 h-7 sm:h-9 text-[10px] sm:text-sm w-full sm:w-auto"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ventas" className="space-y-3 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-0.5 sm:gap-0 p-0.5 sm:p-1">
          <TabsTrigger value="ventas" className="text-[9px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">📅 <span className="hidden sm:inline ml-1">Ventas</span></TabsTrigger>
          <TabsTrigger value="productos" className="text-[9px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">📈 <span className="hidden sm:inline ml-1">Prod.</span></TabsTrigger>
          <TabsTrigger value="mesas" className="text-[9px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">🧾 <span className="hidden sm:inline ml-1">Mesas</span></TabsTrigger>
          <TabsTrigger value="meseros" className="text-[9px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">👨‍💼 <span className="hidden sm:inline ml-1">Meseros</span></TabsTrigger>
          <TabsTrigger value="ingresos" className="text-[9px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">💳 <span className="hidden sm:inline ml-1">Ingresos</span></TabsTrigger>
          <TabsTrigger value="facturas" className="text-[9px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">📄 <span className="hidden sm:inline ml-1">Facturas</span></TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Ventas Hoy</p>
                    <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(salesSummary.todaySales)}</p>
                    <p className={`text-[9px] sm:text-sm ${salesSummary.todayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesSummary.todayChange >= 0 ? '+' : ''}{salesSummary.todayChange.toFixed(1)}% vs ayer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Prom. Semanal</p>
                    <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(salesSummary.weeklyAverage)}</p>
                    <p className={`text-[9px] sm:text-sm ${salesSummary.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesSummary.weeklyChange >= 0 ? '+' : ''}{salesSummary.weeklyChange}% vs ant.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Total Mensual</p>
                    <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(salesSummary.monthlySales)}</p>
                    {salesSummary.monthlyChange === 0 ? (
                      <p className="text-sm text-blue-600">
                        Solo datos de hoy disponibles
                      </p>
                    ) : (
                      <p className={`text-sm ${salesSummary.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {salesSummary.monthlyChange >= 0 ? '+' : ''}{salesSummary.monthlyChange}% vs mes anterior
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Ventas por Día</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-2">
                {filteredDailySalesData.map((sale, index) => (
                  <div key={`daily-sale-mobile-${index}`} className="p-2 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-medium text-gray-800">
                        {new Date(sale.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs font-bold text-green-600">
                        💰 {formatCurrency(sale.total_sales || 0)}
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                      <span>📝 {sale.total_payments || 0} pedidos</span>
                      <span>📊 Prom: {formatCurrency(((sale.total_sales || 0) / (sale.total_payments || 1)))}</span>
                    </div>
                  </div>
                ))}
                {filteredDailySalesData.length === 0 && (
                  <p className="text-center text-gray-500 text-xs py-4">Sin datos para los filtros</p>
                )}
              </div>
              {/* Vista desktop - Tabla */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Pedidos</TableHead>
                    <TableHead className="text-xs">Total</TableHead>
                    <TableHead className="text-xs">Prom.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDailySalesData.map((sale, index) => (
                    <TableRow key={`daily-sale-${index}-${sale.date}`}>
                      <TableCell className="text-xs">{new Date(sale.date).toLocaleDateString('es-CO', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center">
                          <span className="mr-1">📝</span>
                          {sale.total_payments || 0}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center">
                          <span className="mr-1">💰</span>
                          {formatCurrency(sale.total_sales || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center">
                          <span className="mr-1">📊</span>
                          {formatCurrency(((sale.total_sales || 0) / (sale.total_payments || 1)))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDailySalesData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 text-xs">
                        Sin datos para los filtros
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos" className="space-y-3 sm:space-y-6">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-2">
                {filteredProductSalesData
                  .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
                  .slice(0, 10)
                  .map((product, index) => (
                    <div key={`product-mobile-${product.id}-${index}`} className="p-2 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-medium text-gray-800 truncate flex-1">{product.name || 'Sin nombre'}</div>
                        <div className="text-xs font-bold text-green-600 ml-2">{formatCurrency(product.revenue || 0)}</div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded">{product.category || 'Sin cat.'}</span>
                        <span>{product.unitsSold || 0} uds.</span>
                      </div>
                    </div>
                  ))}
                {filteredProductSalesData.length === 0 && (
                  <p className="text-center text-gray-500 text-xs py-4">Sin datos</p>
                )}
              </div>
              {/* Vista desktop - Tabla */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-xs">Categoría</TableHead>
                    <TableHead className="text-xs">Uds.</TableHead>
                    <TableHead className="text-xs">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductSalesData
                    .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
                    .map((product, index) => (
                      <TableRow key={`product-${product.id}-${index}`}>
                        <TableCell className="font-medium text-xs">{product.name || 'Sin nombre'}</TableCell>
                        <TableCell className="text-xs">{product.category || 'Sin categoría'}</TableCell>
                        <TableCell className="text-xs">{product.unitsSold || 0}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(product.revenue || 0)}</TableCell>
                      </TableRow>
                    ))}
                  {filteredProductSalesData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 text-xs">Sin datos</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Resumen de Categorías</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-2">
                {Object.entries(
                  filteredProductSalesData.reduce(
                    (acc, product) => {
                      const category = product.category || 'Sin categoría'
                      acc[category] = acc[category] || { units: 0, revenue: 0 }
                      acc[category].units += product.unitsSold || 0
                      acc[category].revenue += product.revenue || 0
                      return acc
                    },
                    {} as { [key: string]: { units: number; revenue: number } },
                  ),
                )
                  .sort(([, a], [, b]) => ((b as { revenue: number }).revenue || 0) - ((a as { revenue: number }).revenue || 0))
                  .map(([category, data], index) => (
                    <div key={`category-mobile-${index}`} className="p-2 border rounded-lg bg-gray-50 flex justify-between items-center">
                      <span className="text-xs font-medium">{category}</span>
                      <div className="text-right">
                        <div className="text-xs font-bold text-green-600">{formatCurrency((data as { revenue: number }).revenue || 0)}</div>
                        <div className="text-[10px] text-gray-500">{(data as { units: number }).units} uds.</div>
                      </div>
                    </div>
                  ))}
              </div>
              {/* Vista desktop - Tabla */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Categoría</TableHead>
                    <TableHead className="text-xs">Prods.</TableHead>
                    <TableHead className="text-xs">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    filteredProductSalesData.reduce(
                      (acc, product) => {
                        const category = product.category || 'Sin categoría'
                        acc[category] = acc[category] || { units: 0, revenue: 0 }
                        acc[category].units += product.unitsSold || 0
                        acc[category].revenue += product.revenue || 0
                        return acc
                      },
                      {} as { [key: string]: { units: number; revenue: number } },
                    ),
                  )
                    .sort(([, a], [, b]) => ((b as { revenue: number }).revenue || 0) - ((a as { revenue: number }).revenue || 0))
                    .map(([category, data], index) => (
                      <TableRow key={`category-${index}-${category}`}>
                        <TableCell className="font-medium text-xs">{category}</TableCell>
                        <TableCell className="text-xs">{(data as { units: number }).units || 0}</TableCell>
                        <TableCell className="text-xs">{formatCurrency((data as { revenue: number }).revenue || 0)}</TableCell>
                      </TableRow>
                    ))}
                  {Object.keys(filteredProductSalesData.reduce(
                    (acc, product) => {
                      const category = product.category || 'Sin categoría'
                      acc[category] = true
                      return acc
                    },
                    {} as { [key: string]: boolean },
                  )).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 text-xs">Sin datos</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mesas" className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm sm:text-base">🏆</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Mesa Top</p>
                    <p className="text-sm sm:text-xl font-bold text-gray-800">
                      Mesa {filteredTablePerformanceData.length > 0 ? filteredTablePerformanceData[0]?.tableNumber || 0 : 0}
                    </p>
                    <p className="text-[10px] sm:text-sm text-green-600 truncate">
                      {formatCurrency(filteredTablePerformanceData.length > 0 ? filteredTablePerformanceData[0]?.totalRevenue || 0 : 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm sm:text-base">📈</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Prom. Mesa</p>
                    <p className="text-sm sm:text-xl font-bold text-gray-800 truncate">
                      {(filteredTablePerformanceData.reduce((sum, table) => sum + (table.totalRevenue || 0), 0) / Math.max(filteredTablePerformanceData.length, 1)).toLocaleString('es-CO', {style: 'currency', currency: 'COP', minimumFractionDigits: 0})}
                    </p>
                    <p className="text-[10px] sm:text-sm text-blue-600">
                      {filteredTablePerformanceData.length} mesas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm sm:text-base">🎯</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Pedidos/Mesa</p>
                    <p className="text-sm sm:text-xl font-bold text-gray-800">
                      {(filteredTablePerformanceData.reduce((sum, table) => sum + (table.ordersServed || 0), 0) / Math.max(filteredTablePerformanceData.length, 1)).toFixed(1)}
                    </p>
                    <p className="text-[10px] sm:text-sm text-purple-600">prom.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Rendimiento por Mesa</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-2">
                {filteredTablePerformanceData
                  .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                  .map((table, index) => {
                    const avgRevenue = filteredTablePerformanceData.reduce((sum, t) => sum + (t.totalRevenue || 0), 0) / filteredTablePerformanceData.length
                    const efficiency = avgRevenue > 0 ? ((table.totalRevenue || 0) / avgRevenue) * 100 : 0
                    return (
                      <div key={`table-mobile-${table.id}-${index}`} className="p-2 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                            <span className="text-xs font-medium">Mesa {table.tableNumber}</span>
                          </div>
                          <div className="text-xs font-bold text-green-600">{formatCurrency(table.totalRevenue || 0)}</div>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                          <span>👨‍🍳 {table.waiterName || 'Sin asignar'}</span>
                          <span>📋 {table.ordersServed || 0} | {efficiency.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                {filteredTablePerformanceData.length === 0 && (
                  <p className="text-center text-gray-500 text-xs py-4">Sin datos</p>
                )}
              </div>
              {/* Vista desktop - Tabla */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Mesa</TableHead>
                    <TableHead className="text-xs">Mesero</TableHead>
                    <TableHead className="text-xs">Pedidos</TableHead>
                    <TableHead className="text-xs">Ingresos</TableHead>
                    <TableHead className="text-xs">Prom.</TableHead>
                    <TableHead className="text-xs">Efic.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTablePerformanceData
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .map((table, index) => {
                      const avgRevenue = filteredTablePerformanceData.reduce((sum, t) => sum + (t.totalRevenue || 0), 0) / filteredTablePerformanceData.length
                      const efficiency = avgRevenue > 0 ? ((table.totalRevenue || 0) / avgRevenue) * 100 : 0
                      
                      return (
                        <TableRow key={`table-${table.id}-${index}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-orange-600' : 
                                'bg-gray-300'
                              }`}></div>
                              Mesa {table.tableNumber || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">👨‍🍳</span>
                              {table.waiterName || 'Sin asignar'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">�📋</span>
                              {table.ordersServed || 0}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <span className="mr-2">💰</span>
                              {formatCurrency(table.totalRevenue || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">📊</span>
                              {formatCurrency(table.avgOrderValue || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                efficiency >= 120 ? 'bg-green-500' :
                                efficiency >= 100 ? 'bg-yellow-500' :
                                efficiency >= 80 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}></div>
                              {efficiency.toFixed(1)}%
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  {filteredTablePerformanceData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 text-xs">
                        Sin datos de mesas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meseros" className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm sm:text-base">🏆</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Top Mesero</p>
                    <p className="text-sm sm:text-xl font-bold text-gray-800 truncate">
                      {filteredWaiterPerformanceData.length > 0 ? filteredWaiterPerformanceData[0]?.waiterName || 'Sin datos' : 'Sin datos'}
                    </p>
                    <p className="text-[10px] sm:text-sm text-green-600 truncate">
                      {formatCurrency(filteredWaiterPerformanceData.length > 0 ? filteredWaiterPerformanceData[0]?.totalRevenue || 0 : 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm sm:text-base">📈</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Prom./Mesero</p>
                    <p className="text-sm sm:text-xl font-bold text-gray-800 truncate">
                      {formatCurrency(filteredWaiterPerformanceData.reduce((sum, waiter) => sum + (waiter.totalRevenue || 0), 0) / Math.max(filteredWaiterPerformanceData.length, 1))}
                    </p>
                    <p className="text-[10px] sm:text-sm text-blue-600">
                      {filteredWaiterPerformanceData.length} activos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm sm:text-base">🎯</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Pedidos Prom.</p>
                    <p className="text-sm sm:text-xl font-bold text-gray-800">
                      {(filteredWaiterPerformanceData.reduce((sum, waiter) => sum + (waiter.ordersServed || 0), 0) / Math.max(filteredWaiterPerformanceData.length, 1)).toFixed(1)}
                    </p>
                    <p className="text-[10px] sm:text-sm text-purple-600">por mesero</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Rendimiento de Meseros</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-2">
                {filteredWaiterPerformanceData
                  .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                  .map((waiter, index) => {
                    const avgRevenue = filteredWaiterPerformanceData.reduce((sum, w) => sum + (w.totalRevenue || 0), 0) / filteredWaiterPerformanceData.length
                    const performance = avgRevenue > 0 ? ((waiter.totalRevenue || 0) / avgRevenue) * 100 : 0
                    return (
                      <div key={`waiter-mobile-${waiter.id}-${index}`} className="p-2 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                            <span className="text-xs font-medium truncate">{waiter.waiterName || 'Sin nombre'}</span>
                          </div>
                          <div className="text-xs font-bold text-green-600">{formatCurrency(waiter.totalRevenue || 0)}</div>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                          <span>📋 {waiter.ordersServed || 0} pedidos</span>
                          <span>{performance.toFixed(0)}% rend.</span>
                        </div>
                      </div>
                    )
                  })}
                {filteredWaiterPerformanceData.length === 0 && (
                  <p className="text-center text-gray-500 text-xs py-4">Sin datos</p>
                )}
              </div>
              {/* Vista desktop - Tabla */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Mesero</TableHead>
                    <TableHead className="text-xs">Pedidos</TableHead>
                    <TableHead className="text-xs">Ventas</TableHead>
                    <TableHead className="text-xs">Prom.</TableHead>
                    <TableHead className="text-xs">Rend.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWaiterPerformanceData
                    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                    .map((waiter, index) => {
                      const avgRevenue = filteredWaiterPerformanceData.reduce((sum, w) => sum + (w.totalRevenue || 0), 0) / filteredWaiterPerformanceData.length
                      const performance = avgRevenue > 0 ? ((waiter.totalRevenue || 0) / avgRevenue) * 100 : 0
                      
                      return (
                        <TableRow key={`waiter-${waiter.id}-${index}`}>
                          <TableCell className="font-medium text-xs">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-orange-600' : 
                                'bg-gray-300'
                              }`}></div>
                              {waiter.waiterName || 'Sin nombre'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center">
                              <span className="mr-1">📋</span>
                              {waiter.ordersServed || 0}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-xs">
                            <div className="flex items-center">
                              <span className="mr-1">💰</span>
                              {formatCurrency(waiter.totalRevenue || 0)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center">
                              <span className="mr-1">📊</span>
                              {formatCurrency(waiter.avgOrderValue || 0)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                performance >= 120 ? 'bg-green-500' :
                                performance >= 100 ? 'bg-yellow-500' :
                                performance >= 80 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}></div>
                              {performance.toFixed(1)}%
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  {filteredWaiterPerformanceData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 text-xs">
                        Sin datos de meseros
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingresos" className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            <StatsCard
              title="Ingresos Mensuales"
              value={formatCurrency(totalMonthlyRevenue)}
              icon={TrendingUp}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              borderColor="border-purple-200"
            />
            {filteredPaymentMethodSummary.map((method) => (
              <StatsCard
                key={method.method}
                title={`${method.method || 'Sin método'}`}
                value={formatCurrency(method.totalRevenue || 0)}
                icon={method.method === "efectivo" ? CreditCard : method.method === "tarjeta" ? CreditCard : CreditCard}
                iconColor={
                  method.method === "efectivo"
                    ? "text-green-600"
                    : method.method === "tarjeta"
                      ? "text-blue-600"
                      : "text-orange-600"
                }
                bgColor={
                  method.method === "efectivo"
                    ? "bg-green-50"
                    : method.method === "tarjeta"
                      ? "bg-blue-50"
                      : "bg-orange-50"
                }
                borderColor={
                  method.method === "efectivo"
                    ? "border-green-200"
                    : method.method === "tarjeta"
                      ? "border-blue-200"
                      : "border-orange-200"
                }
                subtitle={`${method.transactions || 0} trans.`}
              />
            ))}
          </div>
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Ingresos por Método</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {/* Vista móvil - Cards */}
              <div className="sm:hidden space-y-2">
                {filteredPaymentMethodSummary.map((method, index) => (
                  <div key={`payment-mobile-${index}`} className="p-2 border rounded-lg bg-gray-50 flex justify-between items-center">
                    <span className="text-xs font-medium">{method.method || 'Sin método'}</span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-green-600">{formatCurrency(method.totalRevenue || 0)}</div>
                      <div className="text-[10px] text-gray-500">{method.transactions || 0} trans.</div>
                    </div>
                  </div>
                ))}
                {filteredPaymentMethodSummary.length === 0 && (
                  <p className="text-center text-gray-500 text-xs py-4">Sin datos</p>
                )}
              </div>
              {/* Vista desktop - Tabla */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Método</TableHead>
                    <TableHead className="text-xs">Trans.</TableHead>
                    <TableHead className="text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPaymentMethodSummary.map((method, index) => (
                    <TableRow key={`payment-method-${index}-${method.method}`}>
                      <TableCell className="font-medium text-xs">{method.method || 'Sin método'}</TableCell>
                      <TableCell className="text-xs">{method.transactions || 0}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(method.totalRevenue || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredPaymentMethodSummary.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 text-xs">Sin datos</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturas" className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Total Facturas</p>
                    <p className="text-sm sm:text-2xl font-bold text-gray-800">{filteredInvoicesData.length}</p>
                    <p className="text-[10px] sm:text-sm text-blue-600">Este mes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Ingresos</p>
                    <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">
                      {formatCurrency(totalInvoiceRevenue)}
                    </p>
                    <p className="text-[10px] sm:text-sm text-green-600">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-gray-500">Promedio</p>
                    <p className="text-sm sm:text-2xl font-bold text-gray-800 truncate">
                      {formatCurrency(averageInvoiceValue)}
                    </p>
                    <p className="text-[10px] sm:text-sm text-purple-600">Por factura</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">📄 Historial de Facturas</CardTitle>
              <p className="text-[10px] sm:text-sm text-gray-600">
                Facturas generadas al cerrar mesas
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {filteredInvoicesData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {filteredInvoicesData.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onViewDetails={handleViewInvoiceDetails}
                      onPrint={handlePrintInvoice}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-12">
                  <Receipt className="w-10 h-10 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-2 sm:mb-4" />
                  <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                    Sin facturas
                  </h3>
                  <p className="text-[10px] sm:text-sm text-gray-500">
                    Las facturas se generan al cobrar pedidos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de detalles de factura */}
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            isOpen={isInvoiceModalOpen}
            onClose={() => {
              setIsInvoiceModalOpen(false)
              setSelectedInvoice(null)
            }}
            onPrint={handlePrintInvoice}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}