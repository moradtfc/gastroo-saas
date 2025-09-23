"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Edit, Trash2, Building, Phone, Globe, MapPin, AlertTriangle } from "lucide-react"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DatabaseService.getSuppliers()
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
      setError('Error al cargar proveedores')
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      const { error } = await DatabaseService.supabase
        .from('suppliers')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Proveedor eliminado correctamente')
      loadSuppliers()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Error al eliminar proveedor')
      setDeleteLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(suppliers.map((supplier) => supplier.category).filter(Boolean)))

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
              <Button onClick={loadSuppliers} className="w-full">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
            Gestión de Proveedores
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra tu red de proveedores y sus contactos
          </p>
        </div>
        <Link href="/suppliers/create">
          <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Proveedor
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Total Proveedores</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{suppliers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-secondary/10 hover:border-secondary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Categorías</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-accent/20 hover:border-accent/30 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Proveedores Activos</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{suppliers.length}</CardTitle>
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
                  placeholder="Buscar proveedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Lista de Proveedores</CardTitle>
          <CardDescription className="text-base">
            {filteredSuppliers.length} proveedor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No hay proveedores</h3>
              <p className="text-muted-foreground mb-4">Comienza agregando tu primer proveedor</p>
              <Link href="/suppliers/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Proveedor
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {supplier.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.category ? (
                          <Badge variant="secondary">{supplier.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin categoría</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="text-sm text-muted-foreground">
                              {supplier.email}
                            </div>
                          )}
                          {supplier.website && (
                            <div className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3" />
                              <a 
                                href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {supplier.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {supplier.address || 'Sin dirección'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/suppliers/${supplier.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/suppliers/${supplier.id}/edit?from=list`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteModal(supplier)}
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
        title="Eliminar Proveedor"
        description="¿Estás seguro de que deseas eliminar el proveedor"
        itemName={deleteModal.item?.name || ''}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}