"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, Eye, Edit, TrendingUp, Copy, Trash2, Clock, Users, Package, DollarSign } from "lucide-react"
import Link from "next/link"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
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
            articles (id, name)
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
    return recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalRecipes = recipes.length
  const averageMargin = recipes.length > 0 
    ? recipes.reduce((acc, r) => acc + (r.margin || 0), 0) / recipes.length 
    : 0
  const totalCost = recipes.reduce((acc, r) => acc + (r.totalCost || 0), 0)
  const averageTime = recipes.length > 0
    ? Math.round(recipes.reduce((acc, r) => acc + (r.cooking_time || 0), 0) / recipes.length)
    : 0

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
      case 'facil':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'avanzado':
      case 'difícil':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getProfitMarginColor = (margin: number): string => {
    if (margin >= 70) return 'text-green-600'
    if (margin >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Recetas</h1>
          <p className="text-gray-600">Administra y organiza todas tus recetas</p>
        </div>

        {/* Estadísticas con gráficas minimalistas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{totalRecipes}</p>
                <p className="text-xs text-gray-500 mt-1">Total Recetas</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{averageMargin.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">Margen Promedio</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${averageMargin}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{totalCost.toFixed(0)}€</p>
                <p className="text-xs text-gray-500 mt-1">Costo Total</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{averageTime}</p>
                <p className="text-xs text-gray-500 mt-1">Min Promedio</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(averageTime / 120) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>
          
          <button className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all cursor-pointer">
            <Filter size={18} />
            Filtros
          </button>
          
          <Link href="/recipes/new">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <Plus size={20} />
              Nueva Receta
            </button>
          </Link>
        </div>

        {/* Grid de recetas - 4 columnas en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
            >
              {/* Imagen de cabecera */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={recipe.image_url || '/placeholder.jpg'} 
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getDifficultyColor(recipe.difficulty || 'Fácil')}`}>
                    {recipe.difficulty || 'Fácil'}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                    {recipe.name}
                  </h3>
                  
                  {recipe.category && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                        {recipe.category}
                      </span>
                    </div>
                  )}
                  
                  {recipe.description && (
                    <p className="text-gray-600 text-xs line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                </div>

                {/* Métricas compactas */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users size={14} className="text-blue-500" />
                    <span>{recipe.servings || 0} rac.</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={14} className="text-blue-500" />
                    <span>{recipe.cooking_time || 0} min</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Package size={14} className="text-blue-500" />
                    <span>{recipe.ingredientCount || 0} ing.</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign size={14} className="text-blue-500" />
                    <span>{(recipe.totalCost || 0).toFixed(2)}€</span>
                  </div>
                </div>

                {/* Información financiera */}
                <div className="space-y-2 mb-3 text-xs border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Costo/ración</span>
                    <span className="font-semibold text-gray-800">{(recipe.costPerServing || 0).toFixed(2)}€</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Margen</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${getProfitMarginColor(recipe.margin || 0)}`}>
                        {(recipe.margin || 0).toFixed(0)}%
                      </span>
                      <span className={`font-semibold ${getProfitMarginColor(recipe.margin || 0)}`}>
                        ({((recipe.costPerServing || 0) * (recipe.margin || 0) / 100).toFixed(2)}€)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 mt-auto">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="flex-1 px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Ver"
                  >
                    <Eye size={14} />
                  </Link>
                  
                  <Link
                    href={`/recipes/${recipe.id}/edit?from=list`}
                    className="flex-1 px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </Link>
                  
                  <Link
                    href={`/recipes/${recipe.id}/scale`}
                    className="flex-1 px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Escalar"
                  >
                    <TrendingUp size={14} />
                  </Link>
                  
                  <button
                    className="px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  
                  <button
                    onClick={() => openDeleteModal(recipe)}
                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRecipes.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No se encontraron recetas con ese término de búsqueda"
                : "No hay recetas registradas"}
            </p>
            <Link href="/recipes/new">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all mx-auto cursor-pointer">
                <Plus size={20} />
                Crear Primera Receta
              </button>
            </Link>
          </div>
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
    </div>
  )
}