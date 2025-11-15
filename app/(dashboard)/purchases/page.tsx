"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Edit, Trash2, Calendar, Building, Package, AlertTriangle, Sparkles } from "lucide-react"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DatabaseService.getPurchases()
      setPurchases(data || [])
    } catch (error) {
      console.error('Error loading purchases:', error)
      setError('Error al cargar compras')
      toast.error('Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      const { error } = await DatabaseService.supabase
        .from('purchases')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Compra eliminada correctamente')
      loadPurchases()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting purchase:', error)
      toast.error('Error al eliminar compra')
      setDeleteLoading(false)
    }
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = (purchase.suppliers?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = supplierFilter === "all" || (purchase.suppliers?.name === supplierFilter)
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    return matchesSearch && matchesSupplier && matchesStatus
  })

  const suppliers = Array.from(new Set(purchases.map((purchase) => purchase.suppliers?.name).filter(Boolean)))
  const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0)
  const completedPurchases = purchases.filter((purchase) => purchase.status === "completed").length
  const pendingPurchases = purchases.filter((purchase) => purchase.status === "pending").length

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
              <CardTitle className="text-red-600">Error de Conexión</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={loadPurchases} className="w-full">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completada</Badge>
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
            Gestión de Compras
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra tus compras y pedidos a proveedores
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/purchases/process-invoice">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Sparkles className="h-5 w-5 mr-2" />
              Procesar Factura (OCR)
            </Button>
          </Link>
          <Link href="/purchases/create">
            <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-5 w-5 mr-2" />
              Nueva Compra Manual
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Total Compras</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{purchases.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-secondary/10 hover:border-secondary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Gasto Total</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">€{totalSpent.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-green-500/10 hover:border-green-500/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Completadas</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{completedPurchases}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-yellow-500/10 hover:border-yellow-500/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Pendientes</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{pendingPurchases}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
                />
              </div>
            </div>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Lista de Compras</CardTitle>
          <CardDescription className="text-base">
            {filteredPurchases.length} compra(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No hay compras</h3>
              <p className="text-muted-foreground mb-4">Comienza registrando tu primera compra</p>
              <Link href="/purchases/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Compra
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(purchase.purchase_date).toLocaleDateString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {purchase.suppliers?.name || 'Sin proveedor'}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        €{(purchase.total_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(purchase.status)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {purchase.notes || 'Sin notas'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/purchases/${purchase.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/purchases/${purchase.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteModal(purchase)}
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
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Compra"
        description="¿Estás seguro de que deseas eliminar la compra del"
        itemName={`${new Date(deleteModal.item?.purchase_date || '').toLocaleDateString('es-ES')} - ${deleteModal.item?.suppliers?.name || 'Sin proveedor'}`}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}