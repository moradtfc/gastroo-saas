"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Building, Phone, Globe, MapPin, Package, AlertTriangle, Truck, TrendingUp } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

interface SupplierDetailPageProps {
  params: {
    id: string
  }
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const [supplier, setSupplier] = useState<any>(null)
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSupplier()
    loadRecentPurchases()
  }, [params.id])

  const loadSupplier = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('suppliers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Proveedor no encontrado')

      setSupplier(data)
    } catch (error: any) {
      console.error('Error loading supplier:', error)
      setError(error.message || 'Error al cargar proveedor')
      toast.error('Error al cargar proveedor')
    } finally {
      setLoading(false)
    }
  }

  const loadRecentPurchases = async () => {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('purchases')
        .select(`
          id,
          purchase_date,
          total_amount,
          status,
          purchase_items (
            id
          )
        `)
        .eq('supplier_id', params.id)
        .order('purchase_date', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentPurchases(data || [])
    } catch (error) {
      console.error('Error loading recent purchases:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !supplier) {
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
                <Button onClick={loadSupplier} className="w-full">
                  Reintentar
                </Button>
                <BackButton href="/suppliers" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalSpent = recentPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0)
  const totalOrders = recentPurchases.length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPurchaseStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <BackButton href="/suppliers" />
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
              {supplier.name}
            </h1>
            <p className="text-muted-foreground text-lg">
              Información detallada del proveedor
            </p>
          </div>
        </div>

        <Link href={`/suppliers/${supplier.id}/edit`}>
          <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
            <Edit className="h-5 w-5 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building className="h-6 w-6 text-primary" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                      <p className="text-base">{supplier.address || 'No especificada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p className="text-base">{supplier.phone || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sitio Web</p>
                      <p className="text-base">{supplier.website || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base">{supplier.email || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Persona de Contacto</p>
                    <p className="text-base">{supplier.contact_person || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                    <p className="text-base">{supplier.category || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              {supplier.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notas</p>
                  <p className="text-base text-muted-foreground">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-6 w-6 text-primary" />
                Compras Recientes
              </CardTitle>
              <CardDescription>
                Últimas transacciones con este proveedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPurchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Artículos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {new Date(purchase.purchase_date).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          {purchase.purchase_items?.length || 0} artículos
                        </TableCell>
                        <TableCell className="font-medium">
                          €{(purchase.total_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getPurchaseStatusBadge(purchase.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay compras registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">€{totalSpent.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total gastado</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                <Package className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-secondary">{totalOrders}</p>
                <p className="text-sm text-muted-foreground">Órdenes totales</p>
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
                <span className="text-muted-foreground">Creado:</span>
                <span className="font-medium">
                  {new Date(supplier.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actualizado:</span>
                <span className="font-medium">
                  {new Date(supplier.updated_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
