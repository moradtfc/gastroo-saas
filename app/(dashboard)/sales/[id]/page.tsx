"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Printer, Download, TrendingUp, DollarSign, User, Calendar, Clock, Package, AlertTriangle, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

interface SaleDetailPageProps {
  params: {
    id: string
  }
}

export default function SaleDetailPage({ params }: SaleDetailPageProps) {
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSale()
  }, [params.id])

  const loadSale = async () => {
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
              description,
              recipe_ingredients (
                cost
              )
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Venta no encontrada')

      // Calculate costs and stats
      const items = data.sale_items || []
      const totalCost = items.reduce((sum: number, item: any) => {
        const recipeCost = item.recipes?.recipe_ingredients?.reduce((recipeSum: number, ri: any) => recipeSum + (ri.cost || 0), 0) || 0
        return sum + (recipeCost * item.quantity)
      }, 0)
      const totalProfit = (data.total_amount || 0) - totalCost
      const profitMargin = data.total_amount > 0 ? (totalProfit / data.total_amount) * 100 : 0

      setSale({
        ...data,
        totalCost,
        totalProfit,
        profitMargin,
        itemCount: items.length
      })
    } catch (error: any) {
      console.error('Error loading sale:', error)
      setError(error.message || 'Error al cargar venta')
      toast.error('Error al cargar venta')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // Create a simple export functionality
    const exportData = {
      sale: sale,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `venta-${sale.id}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Venta exportada correctamente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !sale) {
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
              <div className="space-y-2">
                <Button onClick={loadSale} className="w-full">
                  Reintentar
                </Button>
                <BackButton href="/sales" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-start gap-4">
          <BackButton href="/sales" />
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
                Detalle de Venta
              </h1>
              {getStatusBadge(sale.status)}
            </div>
            <p className="text-muted-foreground text-base lg:text-lg">
              Detalle completo de la venta
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint} className="bg-transparent">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleExport} className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Link href={`/sales/${params.id}/edit`}>
            <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Sale Overview */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <User className="h-6 w-6 text-primary" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                    <p className="text-base font-semibold">{sale.customer_name || 'Cliente anónimo'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                    <p className="text-base font-semibold">
                      {new Date(sale.sale_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Productos</p>
                    <p className="text-base font-semibold">{sale.itemCount} artículos</p>
                  </div>
                </div>
              </div>
              {sale.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notas</p>
                  <p className="text-base text-muted-foreground">{sale.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sale Items */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Productos Vendidos
              </CardTitle>
              <CardDescription>
                Desglose detallado de productos y costos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sale.sale_items && sale.sale_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Ganancia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sale.sale_items.map((item: any) => {
                          const recipeCost = item.recipes?.recipe_ingredients?.reduce((sum: number, ri: any) => sum + (ri.cost || 0), 0) || 0
                          const totalCost = recipeCost * item.quantity
                          const profit = item.total_price - totalCost
                          const itemMargin = item.total_price > 0 ? (profit / item.total_price) * 100 : 0

                          return (
                            <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-sm">
                              <TableCell className="font-medium">
                                <div>
                                  <p className="font-semibold">{item.recipes?.name || 'Producto desconocido'}</p>
                                  {item.recipes?.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {item.recipes.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{(item.unit_price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{recipeCost.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{(item.total_price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                      <div>
                                <span className="font-medium text-green-600">
                                  €{profit.toFixed(2)}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {itemMargin.toFixed(1)}%
                      </div>
                    </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="font-medium bg-muted/50">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right">€{(sale.total_amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600">
                          €{(sale.totalProfit || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay productos en esta venta</p>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">€{(sale.total_amount || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total venta</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                <Package className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-secondary">€{(sale.totalCost || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Costo total</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">€{(sale.totalProfit || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Ganancia</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{(sale.profitMargin || 0).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Margen de beneficio</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Productos únicos:</span>
                <span className="font-medium">{sale.itemCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cantidad total:</span>
                <span className="font-medium">
                  {sale.sale_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Precio promedio:</span>
                <span className="font-medium">
                  €{sale.itemCount > 0 ? ((sale.total_amount || 0) / sale.itemCount).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <span className="font-medium">{getStatusBadge(sale.status)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registrada:</span>
                <span className="font-medium">
                  {new Date(sale.created_at).toLocaleDateString('es-ES')}
                </span>
                      </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actualizada:</span>
                <span className="font-medium">
                  {new Date(sale.updated_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
