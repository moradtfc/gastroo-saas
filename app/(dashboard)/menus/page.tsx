"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Eye, Edit, Trash2, TrendingUp, Users, DollarSign, ChefHat, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('menus')
        .select(`
          *,
          menu_recipes (
            id,
            position,
            recipes (
              id,
              name,
              sale_price,
              recipe_ingredients (
                cost
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculate stats for each menu
      const menusWithStats = (data || []).map(menu => {
        const recipes = menu.menu_recipes || []
        const totalCost = recipes.reduce((sum: number, mr: any) => {
          const recipeCost = mr.recipes?.recipe_ingredients?.reduce((recipeSum: number, ri: any) => recipeSum + (ri.cost || 0), 0) || 0
          return sum + recipeCost
        }, 0)
        const totalPrice = recipes.reduce((sum: number, mr: any) => sum + (mr.recipes?.sale_price || 0), 0)
        const margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0
        const recipeCount = recipes.length

        return {
          ...menu,
          totalCost,
          totalPrice,
          margin,
          recipeCount
        }
      })

      setMenus(menusWithStats)
    } catch (error: any) {
      console.error('Error loading menus:', error)
      setError(error.message || 'Error al cargar menús')
      toast.error('Error al cargar menús')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      // First, delete related records
      // Delete menu_recipes references
      await DatabaseService.supabase
        .from('menu_recipes')
        .delete()
        .eq('menu_id', deleteModal.item.id)

      // Finally, delete the menu
      const { error } = await DatabaseService.supabase
        .from('menus')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Menú eliminado correctamente')
      loadMenus()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast.error('Error al eliminar menú')
      setDeleteLoading(false)
    }
  }

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || menu.status === statusFilter
    const matchesCategory = categoryFilter === "all" || menu.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Borrador</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>
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
              <Button onClick={loadMenus} className="w-full">
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
            Menús
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona y organiza tus menús del restaurante
          </p>
        </div>
        <Link href="/menus/new">
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            Crear Menú
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Menús</p>
                <p className="text-2xl font-bold text-primary">{menus.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Menús Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {menus.filter(m => m.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl font-bold text-secondary">
                  €{menus.length > 0 ? (menus.reduce((sum, m) => sum + m.totalPrice, 0) / menus.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margen Promedio</p>
                <p className="text-2xl font-bold text-accent">
                  {menus.length > 0 ? (menus.reduce((sum, m) => sum + (m.margin || 0), 0) / menus.length).toFixed(1) : '0.0'}%
                </p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar menús..."
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
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="Diario">Diario</SelectItem>
                <SelectItem value="Especial">Especial</SelectItem>
                <SelectItem value="Estacional">Estacional</SelectItem>
                <SelectItem value="Degustación">Degustación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMenus.map((menu) => (
          <Card
            key={menu.id}
            className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <Link href={`/menus/${menu.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {menu.name}
                  </CardTitle>
                  {getStatusBadge(menu.status)}
                </div>
                {menu.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {menu.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Link>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <ChefHat className="h-3 w-3" />
                      <span className="text-xs">{menu.recipeCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Platos</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs">€{menu.totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Precio</p>
                  </div>
                </div>

                {/* Costs */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Costo:</span>
                    <span className="font-semibold text-primary">€{menu.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Margen:</span>
                    <span className="font-semibold text-green-600">{menu.margin.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Category */}
                {menu.category && (
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {menu.category}
                    </Badge>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-1">
                    <Link href={`/menus/${menu.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/menus/${menu.id}/edit?from=list`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteModal(menu)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(menu.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMenus.length === 0 && !loading && (
        <Card className="text-center py-12 border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent>
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "No se encontraron menús con los filtros aplicados"
                : "No hay menús registrados"}
            </p>
            <Link href="/menus/new">
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Menú
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Menú"
        description="¿Estás seguro de que deseas eliminar el menú"
        itemName={deleteModal.item?.name || ''}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}