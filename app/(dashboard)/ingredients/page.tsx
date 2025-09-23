"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Search, Plus, Filter, TrendingUp, Edit, Eye, AlertTriangle, Package, Trash2 } from "lucide-react"
import Link from "next/link"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    ingredient: any | null
    isLoading: boolean
  }>({
    isOpen: false,
    ingredient: null,
    isLoading: false
  })

  useEffect(() => {
    loadIngredients()
  }, [])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading ingredients from Supabase...')
      const data = await DatabaseService.getIngredients()
      console.log('Ingredients loaded:', data)
      setIngredients(data || [])
    } catch (error) {
      console.error('Error loading ingredients:', error)
      setError('Error al conectar con la base de datos. Verifica que Supabase esté ejecutándose.')
      toast.error('Error al cargar ingredientes')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (ingredient: any) => {
    setDeleteModal({
      isOpen: true,
      ingredient,
      isLoading: false
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      ingredient: null,
      isLoading: false
    })
  }

  const handleDelete = async () => {
    if (!deleteModal.ingredient) return

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }))
      
      // First, delete related records
      // Delete recipe_ingredients references
      await DatabaseService.supabase
        .from('recipe_ingredients')
        .delete()
        .eq('ingredient_id', deleteModal.ingredient.id)

      // Delete purchase_items references
      await DatabaseService.supabase
        .from('purchase_items')
        .delete()
        .eq('ingredient_id', deleteModal.ingredient.id)

      // Finally, delete the ingredient
      const { error } = await DatabaseService.supabase
        .from('ingredients')
        .delete()
        .eq('id', deleteModal.ingredient.id)

      if (error) throw error

      toast.success('Ingrediente eliminado correctamente')
      loadIngredients()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      toast.error('Error al eliminar ingrediente')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || ingredient.category === categoryFilter
    const matchesSupplier = supplierFilter === "all" || (ingredient.suppliers && ingredient.suppliers.name === supplierFilter)
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && (ingredient.current_stock || 0) <= (ingredient.min_stock || 0)) ||
      (stockFilter === "normal" && (ingredient.current_stock || 0) > (ingredient.min_stock || 0))
    return matchesSearch && matchesCategory && matchesSupplier && matchesStock
  })

  const categories = Array.from(new Set(ingredients.map((ingredient) => ingredient.category).filter(Boolean)))
  const suppliers = Array.from(new Set(ingredients.map((ingredient) => ingredient.suppliers?.name).filter(Boolean)))

  const getStockStatus = (current: number, min: number, max: number = 100) => {
    const percentage = Math.min((current / max) * 100, 100)
    const isLow = current <= min
    return { percentage, isLow }
  }

  const lowStockCount = ingredients.filter((ing) => (ing.current_stock || 0) <= (ing.min_stock || 0)).length

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
              <div className="space-y-2">
                <Button onClick={loadIngredients} className="w-full">
                  Reintentar
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>Verifica que Supabase esté ejecutándose:</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs">npx supabase start</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
            Gestión de Ingredientes
          </h1>
          <p className="text-muted-foreground text-lg">
            Administra tu inventario de ingredientes y controla los precios
          </p>
        </div>
        <Link href="/ingredients/new">
          <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Ingrediente
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Total Ingredientes</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{ingredients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-secondary/10 hover:border-secondary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Precio Promedio</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">
              €{ingredients.length > 0 ? (ingredients.reduce((acc, ing) => acc + (ing.cost_per_unit || 0), 0) / ingredients.length).toFixed(2) : '0.00'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-destructive/10 hover:border-destructive/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Stock Bajo</CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive flex items-center gap-2">
              {lowStockCount}
              {lowStockCount > 0 && <AlertTriangle className="h-6 w-6" />}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-accent/20 hover:border-accent/30 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Proveedores</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{suppliers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Categorías</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar ingredientes..."
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
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el stock</SelectItem>
                <SelectItem value="low">Stock bajo</SelectItem>
                <SelectItem value="normal">Stock normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Lista de Ingredientes</CardTitle>
          <CardDescription className="text-base">
            {filteredIngredients.length} ingrediente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIngredients.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No hay ingredientes</h3>
              <p className="text-muted-foreground mb-4">Comienza agregando tu primer ingrediente</p>
              <Link href="/ingredients/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ingrediente
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
                  <TableHead>Precio</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Alérgenos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((ingredient) => {
                    const currentStock = ingredient.current_stock || 0
                    const minStock = ingredient.min_stock || 0
                    const maxStock = Math.max(minStock * 3, 100) // Estimación del stock máximo
                    const stockStatus = getStockStatus(currentStock, minStock, maxStock)
                    
                  return (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {ingredient.name}
                          {stockStatus.isLow && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                          {ingredient.category ? (
                        <Badge variant="secondary">{ingredient.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin categoría</span>
                          )}
                      </TableCell>
                      <TableCell>
                          €{(ingredient.cost_per_unit || 0).toFixed(2)}/{ingredient.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ingredient.suppliers?.name || 'Sin proveedor'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-32">
                          <div className="flex items-center justify-between text-sm">
                            <span className={stockStatus.isLow ? "text-red-600 font-medium" : "text-foreground"}>
                                {currentStock} {ingredient.unit}
                            </span>
                              <span className="text-muted-foreground text-xs">/{maxStock}</span>
                          </div>
                          <Progress value={stockStatus.percentage} className="h-2" />
                          {stockStatus.isLow && (
                            <div className="text-xs text-red-600 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Stock bajo
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                            {ingredient.allergens && ingredient.allergens.length > 0 ? (
                              ingredient.allergens.map((allergen: string) => (
                              <Badge key={allergen} variant="destructive" className="text-xs">
                                {allergen}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Ninguno</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/ingredients/${ingredient.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/ingredients/${ingredient.id}/edit?from=list`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDeleteModal(ingredient)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Ingrediente"
        description="¿Estás seguro de que deseas eliminar el ingrediente"
        itemName={deleteModal.ingredient?.name || ''}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}