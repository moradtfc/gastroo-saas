"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Eye, Edit, Trash2, TrendingUp, DollarSign, Calendar, User, Package, Filter, AlertTriangle, CreditCard } from "lucide-react"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            quantity,
            unit_price,
            total_price,
            recipes (
              id,
              name,
              recipe_ingredients (
                cost
              )
            )
          )
        `)
        .order('sale_date', { ascending: false })

      if (error) throw error
      
      // Calculate costs and profits for each sale
      const salesWithStats = (data || []).map(sale => {
        const items = sale.sale_items || []
        const totalCost = items.reduce((sum: number, item: any) => {
          const recipeCost = item.recipes?.recipe_ingredients?.reduce((recipeSum: number, ri: any) => recipeSum + (ri.cost || 0), 0) || 0
          return sum + (recipeCost * item.quantity)
        }, 0)
        const totalProfit = (sale.total_amount || 0) - totalCost
        const profitMargin = sale.total_amount > 0 ? (totalProfit / sale.total_amount) * 100 : 0

        return {
          ...sale,
          totalCost,
          totalProfit,
          profitMargin,
          itemCount: items.length
        }
      })

      setSales(salesWithStats)
    } catch (error: any) {
      console.error('Error loading sales:', error)
      setError(error.message || 'Error al cargar ventas')
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      // First, delete related sale_items
      await DatabaseService.supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', deleteModal.item.id)

      // Then delete the sale
      const { error } = await DatabaseService.supabase
        .from('sales')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Venta eliminada correctamente')
      loadSales()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting sale:', error)
      toast.error('Error al eliminar venta')
      setDeleteLoading(false)
    }
  }

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const saleDate = new Date(sale.sale_date)
      const today = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = saleDate.toDateString() === today.toDateString()
          break
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = saleDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = saleDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Calculate stats
  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0)
  const averageTicket = filteredSales.length > 0 ? totalSales / filteredSales.length : 0
  const todaySales = sales.filter(sale => {
    const today = new Date().toDateString()
    const saleDate = new Date(sale.sale_date).toDateString()
    return today === saleDate
  }).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status || 'Sin estado'}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={loadSales} className="w-full">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
            Ventas
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            Gestiona y analiza las ventas del restaurante
          </p>
        </div>
        <Link href="/sales/new">
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            Nueva Venta
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                <p className="text-2xl font-bold text-primary">€{totalSales.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ganancia Total</p>
                <p className="text-2xl font-bold text-green-600">€{totalProfit.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold text-secondary">€{averageTicket.toFixed(2)}</p>
              </div>
              <Package className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventas Hoy</p>
                <p className="text-2xl font-bold text-accent">{todaySales}</p>
              </div>
              <Calendar className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fechas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Lista de Ventas</CardTitle>
          <CardDescription>
            {filteredSales.length} venta{filteredSales.length !== 1 ? 's' : ''} encontrada{filteredSales.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{sale.customer_name || 'Cliente anónimo'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(sale.sale_date).toLocaleDateString('es-ES')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{sale.itemCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{(sale.total_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">
                          €{(sale.totalProfit || 0).toFixed(2)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {(sale.profitMargin || 0).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sale.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/sales/${sale.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/sales/${sale.id}/edit?from=list`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteModal(sale)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "No se encontraron ventas con los filtros aplicados"
                  : "No hay ventas registradas"}
              </p>
              <Link href="/sales/new">
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primera Venta
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Venta"
        description="¿Estás seguro de que deseas eliminar la venta de"
        itemName={`${deleteModal.item?.customer_name || 'Cliente anónimo'} - €${(deleteModal.item?.total_amount || 0).toFixed(2)}`}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}