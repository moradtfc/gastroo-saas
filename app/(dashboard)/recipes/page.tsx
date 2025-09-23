"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Filter, Copy, Eye, Edit, BarChart3, Scale, AlertTriangle, ChefHat, Clock, Users, Trash2 } from "lucide-react"
import Link from "next/link"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

const categories = ["Todos", "Entrantes", "Principales", "Postres", "Bebidas", "Aperitivos", "Sopas", "Ensaladas", "Otros"]
const difficulties = ["Todos", "Fácil", "Intermedio", "Avanzado"]

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Todos")
  const [difficultyFilter, setDifficultyFilter] = useState("Todos")
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            cost,
            ingredients (id, name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculate costs and stats for each recipe
      const recipesWithStats = (data || []).map(recipe => {
        const totalCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => sum + (ri.cost || 0), 0) || 0
        const costPerServing = recipe.servings ? totalCost / recipe.servings : 0
        const margin = recipe.sale_price && totalCost ? ((recipe.sale_price - totalCost) / recipe.sale_price) * 100 : 0
        const ingredientCount = recipe.recipe_ingredients?.length || 0

        return {
          ...recipe,
          totalCost,
          costPerServing,
          margin,
          ingredientCount
        }
      })

      setRecipes(recipesWithStats)
    } catch (error: any) {
      console.error('Error loading recipes:', error)
      setError(error.message || 'Error al cargar recetas')
      toast.error('Error al cargar recetas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      // First, delete related records
      // Delete recipe_ingredients references
      await DatabaseService.supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', deleteModal.item.id)

      // Delete menu_recipes references
      await DatabaseService.supabase
        .from('menu_recipes')
        .delete()
        .eq('recipe_id', deleteModal.item.id)

      // Delete sale_items references
      await DatabaseService.supabase
        .from('sale_items')
        .delete()
        .eq('recipe_id', deleteModal.item.id)

      // Finally, delete the recipe
      const { error } = await DatabaseService.supabase
        .from('recipes')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Receta eliminada correctamente')
      loadRecipes()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting recipe:', error)
      toast.error('Error al eliminar receta')
      setDeleteLoading(false)
    }
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "Todos" || recipe.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "Todos" || recipe.difficulty === difficultyFilter
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
      case 'facil':
        return <Badge variant="default" className="bg-green-100 text-green-800">Fácil</Badge>
      case 'intermedio':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Intermedio</Badge>
      case 'avanzado':
        return <Badge variant="default" className="bg-red-100 text-red-800">Avanzado</Badge>
      default:
        return <Badge variant="outline">{difficulty || 'No especificado'}</Badge>
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
              <Button onClick={loadRecipes} className="w-full">
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
            Escandallos
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona tus recetas y análisis de costos
          </p>
        </div>
        <Link href="/recipes/new">
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Escandallo
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recetas</p>
                <p className="text-2xl font-bold text-primary">{recipes.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Costo Promedio</p>
                <p className="text-2xl font-bold text-secondary">
                  €{recipes.length > 0 ? (recipes.reduce((sum, r) => sum + r.totalCost, 0) / recipes.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margen Promedio</p>
                <p className="text-2xl font-bold text-accent">
                  {recipes.length > 0 ? (recipes.reduce((sum, r) => sum + (r.margin || 0), 0) / recipes.length).toFixed(1) : '0.0'}%
                </p>
              </div>
              <Scale className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingredientes Únicos</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(recipes.flatMap(r => r.recipe_ingredients?.map((ri: any) => ri.ingredients?.id) || [])).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
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
                  placeholder="Buscar recetas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <Link href={`/recipes/${recipe.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {recipe.name}
                  </CardTitle>
                  {recipe.category && (
                    <Badge variant="secondary" className="text-xs">
                      {recipe.category}
                    </Badge>
                  )}
                </div>
                {recipe.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Link>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{recipe.servings || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Raciones</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{recipe.cooking_time || 0}m</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tiempo</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <ChefHat className="h-3 w-3" />
                      <span className="text-xs">{recipe.ingredientCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ingredientes</p>
                  </div>
                </div>

                {/* Costs */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Costo total:</span>
                    <span className="font-semibold text-primary">€{recipe.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Por ración:</span>
                    <span className="font-semibold">€{recipe.costPerServing.toFixed(2)}</span>
                  </div>
                  {recipe.sale_price && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margen:</span>
                      <span className="font-semibold text-green-600">{recipe.margin.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Difficulty and Tags */}
                <div className="flex justify-between items-center">
                  <div>
                    {recipe.difficulty && getDifficultyBadge(recipe.difficulty)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-1">
                    <Link href={`/recipes/${recipe.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/recipes/${recipe.id}/edit?from=list`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Link href={`/recipes/${recipe.id}/scale`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <Scale className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteModal(recipe)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(recipe.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && !loading && (
        <Card className="text-center py-12 border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent>
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "Todos" || difficultyFilter !== "Todos"
                ? "No se encontraron recetas con los filtros aplicados"
                : "No hay recetas registradas"}
            </p>
            <Link href="/recipes/new">
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Receta
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
        title="Eliminar Receta"
        description="¿Estás seguro de que deseas eliminar la receta"
        itemName={deleteModal.item?.name || ''}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}