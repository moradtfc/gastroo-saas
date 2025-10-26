"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Plus, Edit, TrendingUp, Copy, Trash2, Clock, Users, Package, DollarSign, X, AlertCircle, CheckCircle, ArrowUpDown, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function RecipesPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()
  
  // Estado para modal de escalado
  const [showScaleModal, setShowScaleModal] = useState(false)
  const [scaleStep, setScaleStep] = useState(1)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [newServings, setNewServings] = useState<number>(0)
  const [newServingsInput, setNewServingsInput] = useState<string>("")
  const [scaledIngredients, setScaledIngredients] = useState<any[]>([])
  const [isScaling, setIsScaling] = useState(false)
  const [showServingsError, setShowServingsError] = useState(false)

  // Estado para filtros y paginación
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const recipesPerPage = 12
  
  // Estado para ordenamiento
  const [sortBy, setSortBy] = useState<"margin" | "price" | "cost" | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [openSortMenu, setOpenSortMenu] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  // Estado para duplicar receta
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [recipeToDuplicate, setRecipeToDuplicate] = useState<any>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)

  useEffect(() => {
    loadRecipes()
    loadCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setOpenSortMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('recipe_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

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
          ),
          recipe_additional_costs (
            id,
            name,
            amount
          ),
          recipe_categories!recipe_category_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculate costs and stats for each recipe
      const recipesWithStats = (data || []).map((recipe, index) => {
        // Costo de ingredientes - validar que no haya costos duplicados o nulos
        const ingredientsCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => {
          const cost = parseFloat(ri.cost) || 0
          return sum + cost
        }, 0) || 0
        
        // Costos adicionales (Mano de Obra, Servicios, etc.) - validar que no haya duplicados
        const additionalCosts = recipe.recipe_additional_costs?.reduce((sum: number, ac: any) => {
          const amount = parseFloat(ac.amount) || 0
          return sum + amount
        }, 0) || 0
        
        // Costo total (ingredientes + gastos adicionales)
        const totalCost = ingredientsCost + additionalCosts
        
        // Validar y convertir a números para evitar problemas de tipos
        const salePriceNum = parseFloat(recipe.sale_price) || 0
        const servingsNum = parseInt(recipe.servings) || 0
        
        // Costo por ración - asegurar que sea un número válido
        const costPerServing = servingsNum > 0 && totalCost > 0 ? totalCost / servingsNum : 0
        
        // Precio por ración - según el formulario "Precio de venta por ración", 
        // sale_price ya es el precio por ración, no necesitamos dividirlo
        const pricePerServing = salePriceNum > 0 ? salePriceNum : 0
        
        
        // Margen de ganancia por ración - validaciones adicionales
        let margin = 0
        if (salePriceNum > 0 && servingsNum > 0 && pricePerServing > 0 && Number.isFinite(totalCost)) {
          // Asegurar que todos los valores sean números válidos
          const precioValido = Number.isFinite(pricePerServing) && pricePerServing > 0
          const costoValido = Number.isFinite(costPerServing) && costPerServing >= 0
          
          if (precioValido && costoValido) {
            // Fórmula: (precio - costo) / precio * 100
            const diferencia = pricePerServing - costPerServing
            
            margin = (diferencia / pricePerServing) * 100
            
            // Validar que el margen sea un número finito y razonable
            if (!Number.isFinite(margin) || Math.abs(margin) > 1000) {
              margin = 0
            }
          }
        }
        
        const ingredientCount = recipe.recipe_ingredients?.length || 0
        
        // Obtener el nombre de la categoría desde la relación
        const categoryName = recipe.recipe_categories?.name || recipe.category || ''

        return {
          ...recipe,
          category: categoryName, // Guardar el nombre de la categoría en el campo 'category'
          ingredientsCost,
          additionalCosts,
          totalCost,
          costPerServing,
          pricePerServing, // Agregar para evitar recalcular en el render
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

  const openScaleModal = async (recipe: any) => {
    setSelectedRecipe(recipe)
    setScaleStep(1)
    setNewServings(0)
    setNewServingsInput("")
    setScaledIngredients([])
    setShowServingsError(false)
    setShowScaleModal(true)
  }

  const closeScaleModal = () => {
    setShowScaleModal(false)
    setScaleStep(1)
    setSelectedRecipe(null)
    setNewServings(0)
    setNewServingsInput("")
    setScaledIngredients([])
    setShowServingsError(false)
  }

  const goToStep2 = () => {
    setScaleStep(2)
    setNewServingsInput("")
    setShowServingsError(false)
  }

  const handleServingsInputChange = (value: string) => {
    // Solo permitir números positivos
    const sanitized = value.replace(/[^0-9]/g, '')
    setNewServingsInput(sanitized)
    
    if (sanitized === '') {
      setNewServings(0)
      setShowServingsError(false)
      setScaledIngredients([])
      return
    }
    
    const numValue = parseInt(sanitized)
    setNewServings(numValue)
    
    // Validar en tiempo real
    if (numValue === selectedRecipe?.servings) {
      setShowServingsError(true)
      setScaledIngredients([])
    } else if (numValue > 0) {
      setShowServingsError(false)
      // Calcular ingredientes escalados automáticamente
      calculateScaledIngredientsForValue(numValue)
    }
  }

  const calculateScaledIngredientsForValue = async (servings: number) => {
    if (!selectedRecipe || servings <= 0 || servings === selectedRecipe.servings) {
      return
    }

    try {
      // Obtener los ingredientes de la receta con toda su información
      const { data: recipeData, error } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            quantity,
            unit,
            unit_id,
            cost,
            article_id,
            articles (
              id,
              name,
              cost_per_unit,
              unit_id,
              unit_info:unit_id(
                id,
                name,
                symbol,
                category_id,
                conversion_factor,
                base_unit
              )
            ),
            unit_info:units!recipe_ingredients_unit_id_fkey (
              id,
              name,
              symbol,
              category_id,
              conversion_factor,
              base_unit
            )
          )
        `)
        .eq('id', selectedRecipe.id)
        .single()

      if (error) throw error

      const scaleFactor = servings / selectedRecipe.servings
      
      const scaled = recipeData.recipe_ingredients.map((ing: any) => ({
        ...ing,
        original_quantity: ing.quantity,
        scaled_quantity: parseFloat((ing.quantity * scaleFactor).toFixed(3)),
        scaled_cost: parseFloat((ing.cost * scaleFactor).toFixed(2))
      }))

      setScaledIngredients(scaled)
    } catch (error) {
      console.error('Error calculating scaled ingredients:', error)
    }
  }

  const calculateScaledIngredients = async () => {
    if (!selectedRecipe || newServings <= 0 || newServings === selectedRecipe.servings) {
      return
    }

    try {
      // Obtener los ingredientes de la receta con toda su información
      const { data: recipeData, error } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            quantity,
            unit,
            unit_id,
            cost,
            article_id,
            articles (
              id,
              name,
              cost_per_unit,
              unit_id,
              unit_info:unit_id(
                id,
                name,
                symbol,
                category_id,
                conversion_factor,
                base_unit
              )
            ),
            unit_info:units!recipe_ingredients_unit_id_fkey (
              id,
              name,
              symbol,
              category_id,
              conversion_factor,
              base_unit
            )
          )
        `)
        .eq('id', selectedRecipe.id)
        .single()

      if (error) throw error

      const scaleFactor = newServings / selectedRecipe.servings
      
      const scaled = recipeData.recipe_ingredients.map((ing: any) => ({
        ...ing,
        original_quantity: ing.quantity,
        scaled_quantity: parseFloat((ing.quantity * scaleFactor).toFixed(3)),
        scaled_cost: parseFloat((ing.cost * scaleFactor).toFixed(2))
      }))

      setScaledIngredients(scaled)
    } catch (error) {
      console.error('Error calculating scaled ingredients:', error)
      toast.error('Error al calcular ingredientes escalados')
    }
  }

  const handleConfirmScale = async () => {
    if (!selectedRecipe || scaledIngredients.length === 0) return

    try {
      setIsScaling(true)

      // Obtener todos los datos de la receta original con la estructura completa
      const { data: originalRecipe, error: fetchError } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_additional_costs (
            name,
            amount
          )
        `)
        .eq('id', selectedRecipe.id)
        .single()

      if (fetchError) throw fetchError

      const scaleFactor = newServings / selectedRecipe.servings

      // Crear nueva receta escalada con todos los campos necesarios
      const scaledRecipeData: any = {
        name: originalRecipe.name, // Sin añadir "(Escalada)" al nombre
        description: originalRecipe.description,
        recipe_category_id: originalRecipe.recipe_category_id, // Usar recipe_category_id en lugar de category
        servings: newServings,
        cooking_time: originalRecipe.cooking_time, // Mantener el mismo tiempo de preparación
        difficulty: originalRecipe.difficulty,
        sale_price: originalRecipe.sale_price, // Mantener el mismo precio de venta que la receta original
        instructions: originalRecipe.instructions,
        image_url: originalRecipe.image_url,
        color: originalRecipe.color,
        is_scaled: true,
        original_recipe_id: originalRecipe.id
      }

      const { data: newRecipe, error: createError } = await DatabaseService.supabase
        .from('recipes')
        .insert(scaledRecipeData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating recipe:', createError)
        throw createError
      }

      // Insertar ingredientes escalados con toda la información necesaria
      const ingredientsToInsert = scaledIngredients.map((ing: any) => ({
        recipe_id: newRecipe.id,
        article_id: ing.article_id,
        quantity: ing.scaled_quantity,
        unit: ing.unit || ing.unit_info?.symbol || 'g',
        unit_id: ing.unit_id,
        cost: ing.scaled_cost
      }))

      const { error: ingredientsError } = await DatabaseService.supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingredientsError) {
        console.error('Error inserting ingredients:', ingredientsError)
        throw ingredientsError
      }

      // Copiar costos adicionales sin escalar (el usuario los ajustará manualmente si es necesario)
      if (originalRecipe.recipe_additional_costs && originalRecipe.recipe_additional_costs.length > 0) {
        const additionalCostsToInsert = originalRecipe.recipe_additional_costs.map((cost: any) => {
          // Mantener todos los costos sin escalar
          // Los tiempos de producción son variables y dependen de muchos factores
          // El usuario puede modificarlos manualmente después
          
          return {
            recipe_id: newRecipe.id,
            name: cost.name,
            amount: cost.amount // Sin escalar
          }
        })

        const { error: costsError } = await DatabaseService.supabase
          .from('recipe_additional_costs')
          .insert(additionalCostsToInsert)

        if (costsError) {
          console.error('Error inserting additional costs:', costsError)
          // No lanzar error aquí, los costos adicionales son opcionales
        }
      }

      toast.success('Receta escalada creada correctamente')
      closeScaleModal()
      loadRecipes()
      
      // Navegar a la receta escalada recién creada
      router.push(`/recipes/${newRecipe.id}/edit?from=list`)
    } catch (error) {
      console.error('Error creating scaled recipe:', error)
      toast.error('Error al crear receta escalada')
    } finally {
      setIsScaling(false)
    }
  }

  // Funciones de filtros y ordenamiento
  const handleCategoryToggle = (categoryId: string) => {
    setTempSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSaveCategories = () => {
    setSelectedCategories(tempSelectedCategories)
    setIsCategoryModalOpen(false)
  }

  const handleClearCategories = () => {
    setTempSelectedCategories([])
    setSelectedCategories([])
  }

  const handleSortSelection = (sortType: "margin" | "price" | "cost") => {
    if (sortBy === sortType) {
      // Cambiar orden si ya está seleccionado
      setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      // Nuevo tipo de orden, usar descendente por defecto
      setSortBy(sortType)
      setSortOrder("desc")
    }
    setOpenSortMenu(false)
  }

  const handleClearSort = () => {
    setSortBy(null)
    setSortOrder("desc")
    setOpenSortMenu(false)
  }

  const getSortLabel = () => {
    if (!sortBy) return "Ordenar por"
    const labels = {
      margin: "Margen",
      price: "Precio de Venta",
      cost: "Costo/ración"
    }
    const arrow = sortOrder === "asc" ? "↑" : "↓"
    return `${labels[sortBy]} ${arrow}`
  }

  const openDuplicateModal = (recipe: any) => {
    setRecipeToDuplicate(recipe)
    setShowDuplicateModal(true)
  }

  const closeDuplicateModal = () => {
    setShowDuplicateModal(false)
    setRecipeToDuplicate(null)
  }

  const handleDuplicateRecipe = async () => {
    if (!recipeToDuplicate) return

    try {
      setIsDuplicating(true)

      // Obtener todos los datos de la receta original con relaciones
      const { data: originalRecipe, error: fetchError } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            article_id,
            quantity,
            unit,
            unit_id,
            cost
          ),
          recipe_additional_costs (
            name,
            amount
          )
        `)
        .eq('id', recipeToDuplicate.id)
        .single()

      if (fetchError) throw fetchError

      // Crear nueva receta duplicada
      const duplicatedRecipeData: any = {
        name: `${originalRecipe.name} (Copia)`,
        description: originalRecipe.description,
        recipe_category_id: originalRecipe.recipe_category_id,
        servings: originalRecipe.servings,
        cooking_time: originalRecipe.cooking_time,
        difficulty: originalRecipe.difficulty,
        sale_price: originalRecipe.sale_price,
        instructions: originalRecipe.instructions,
        image_url: originalRecipe.image_url,
        color: originalRecipe.color,
        is_scaled: false,
        original_recipe_id: null
      }

      const { data: newRecipe, error: createError } = await DatabaseService.supabase
        .from('recipes')
        .insert(duplicatedRecipeData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating duplicated recipe:', createError)
        throw createError
      }

      // Duplicar ingredientes
      if (originalRecipe.recipe_ingredients && originalRecipe.recipe_ingredients.length > 0) {
        const ingredientsToInsert = originalRecipe.recipe_ingredients.map((ing: any) => ({
          recipe_id: newRecipe.id,
          article_id: ing.article_id,
          quantity: ing.quantity,
          unit: ing.unit,
          unit_id: ing.unit_id,
          cost: ing.cost
        }))

        const { error: ingredientsError } = await DatabaseService.supabase
          .from('recipe_ingredients')
          .insert(ingredientsToInsert)

        if (ingredientsError) {
          console.error('Error inserting duplicated ingredients:', ingredientsError)
          throw ingredientsError
        }
      }

      // Duplicar costos adicionales
      if (originalRecipe.recipe_additional_costs && originalRecipe.recipe_additional_costs.length > 0) {
        const additionalCostsToInsert = originalRecipe.recipe_additional_costs.map((cost: any) => ({
          recipe_id: newRecipe.id,
          name: cost.name,
          amount: cost.amount
        }))

        const { error: costsError } = await DatabaseService.supabase
          .from('recipe_additional_costs')
          .insert(additionalCostsToInsert)

        if (costsError) {
          console.error('Error inserting duplicated additional costs:', costsError)
          // No lanzar error aquí, los costos adicionales son opcionales
        }
      }

      toast.success('Receta duplicada exitosamente')
      closeDuplicateModal()
      loadRecipes()
    } catch (error) {
      console.error('Error duplicating recipe:', error)
      toast.error('Error al duplicar la receta')
    } finally {
      setIsDuplicating(false)
    }
  }

  // Filtrado de recetas
  let filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(recipe.recipe_category_id)
    return matchesSearch && matchesCategory
  })

  // Ordenamiento
  if (sortBy) {
    filteredRecipes = [...filteredRecipes].sort((a, b) => {
      let valueA = 0
      let valueB = 0

      if (sortBy === "margin") {
        valueA = a.margin || 0
        valueB = b.margin || 0
      } else if (sortBy === "price") {
        valueA = a.pricePerServing || 0
        valueB = b.pricePerServing || 0
      } else if (sortBy === "cost") {
        valueA = a.costPerServing || 0
        valueB = b.costPerServing || 0
      }

      return sortOrder === "asc" ? valueA - valueB : valueB - valueA
    })
  }

  // Paginación
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage)
  const startIndex = (currentPage - 1) * recipesPerPage
  const endIndex = startIndex + recipesPerPage
  const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategories, sortBy, sortOrder])

  // Sincronizar categorías temporales al abrir la modal
  useEffect(() => {
    if (isCategoryModalOpen) {
      setTempSelectedCategories(selectedCategories)
    }
  }, [isCategoryModalOpen, selectedCategories])

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
    if (margin < 0) return 'text-red-600' // Márgenes negativos en rojo
    if (margin >= 70) return 'text-green-600'
    if (margin >= 50) return 'text-yellow-600'
    if (margin >= 20) return 'text-orange-600' // Márgenes bajos en naranja
    return 'text-red-600' // Márgenes muy bajos o negativos en rojo
  }

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return 'R'
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase()
  }

  const getRecipeColor = (recipe: any): string => {
    return recipe.color || '#FF9D3D'
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
          
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className={cn(
              "px-4 py-3 border rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer",
              selectedCategories.length > 0 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
            )}
          >
            <Filter size={18} />
            Filtros
            {selectedCategories.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                {selectedCategories.length}
              </span>
            )}
          </button>

          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setOpenSortMenu(!openSortMenu)}
              className={cn(
                "px-4 py-3 border rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer",
                sortBy ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
              )}
            >
              <ArrowUpDown size={18} />
              {getSortLabel()}
              <ChevronDown size={18} />
            </button>

            {openSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => handleSortSelection("margin")}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    sortBy === "margin" && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  Margen {sortBy === "margin" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                <button
                  onClick={() => handleSortSelection("price")}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    sortBy === "price" && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  Precio de Venta {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                <button
                  onClick={() => handleSortSelection("cost")}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    sortBy === "cost" && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  Costo/ración {sortBy === "cost" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                {sortBy && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleClearSort}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600 text-sm transition-colors cursor-pointer font-medium"
                    >
                      Limpiar orden
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <Link href="/recipes/new">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <Plus size={20} />
              Nueva Receta
            </button>
          </Link>
        </div>

        {/* Grid de recetas - 4 columnas en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
            >
              {/* Imagen de cabecera */}
              <div 
                className="relative h-48 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/recipes/${recipe.id}/edit?from=list`)}
              >
                {recipe.image_url ? (
                  <img 
                    src={recipe.image_url} 
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: getRecipeColor(recipe) }}
                  >
                    <span className="text-white text-6xl font-bold">
                      {getInitials(recipe.name)}
                    </span>
                  </div>
                )}
                
                {/* Etiqueta de Escalada */}
                {recipe.is_scaled && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-lg border border-purple-400">
                      Escalada
                    </span>
                  </div>
                )}
                
                {/* Etiqueta de Dificultad */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getDifficultyColor(recipe.difficulty || 'Fácil')}`}>
                    {recipe.difficulty || 'Fácil'}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 flex-1 flex flex-col">
                <div 
                  className="mb-3 cursor-pointer"
                  onClick={() => router.push(`/recipes/${recipe.id}/edit?from=list`)}
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2 break-words">
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
                <div 
                  className="grid grid-cols-2 gap-2 mb-3 text-xs cursor-pointer"
                  onClick={() => router.push(`/recipes/${recipe.id}/edit?from=list`)}
                >
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
                <div 
                  className="space-y-2 mb-3 text-xs border-t border-gray-100 pt-3 cursor-pointer"
                  onClick={() => router.push(`/recipes/${recipe.id}/edit?from=list`)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Costo/ración</span>
                    <span className="font-semibold text-gray-800">{(recipe.costPerServing || 0).toFixed(2)}€</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Precio de Venta</span>
                    <span className="font-semibold text-gray-800">
                      {recipe.pricePerServing.toFixed(2)}€
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Margen</span>
                      <span className={`font-bold ${getProfitMarginColor(recipe.margin || 0)}`}>
                      {(recipe.margin || 0).toFixed(0)}% ({(recipe.pricePerServing - (recipe.costPerServing || 0)).toFixed(2)}€)
                      </span>
                  </div>
                </div>

                {/* Acciones */}
                <div 
                  className="flex items-center justify-center gap-3 pt-3 border-t border-gray-100 mt-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      router.push(`/recipes/${recipe.id}/edit?from=list`)
                    }}
                    className="px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  
                  {/* Solo mostrar botón de escalar si la receta NO fue escalada */}
                  {!recipe.is_scaled && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openScaleModal(recipe)
                      }}
                      className="px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Escalar"
                  >
                    <TrendingUp size={14} />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openDuplicateModal(recipe)
                    }}
                    className="px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openDeleteModal(recipe)
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center text-xs font-medium cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Mostrar solo páginas cercanas a la actual
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                }
                // Mostrar puntos suspensivos
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>
                }
                return null
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              Siguiente
            </button>
          </div>
        )}

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

        {/* Modal de Duplicar Receta */}
        <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">
                Duplicar Receta
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-gray-700">
                ¿Deseas duplicar la receta <span className="font-semibold text-gray-900">"{recipeToDuplicate?.name}"</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Se creará una copia exacta con todos sus ingredientes, instrucciones y costos adicionales.
              </p>
            </div>

            <DialogFooter className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeDuplicateModal}
                disabled={isDuplicating}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDuplicateRecipe}
                disabled={isDuplicating}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {isDuplicating ? 'Duplicando...' : 'Duplicar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Filtros por Categoría */}
        <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl">Filtrar por Categorías</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-4">🏷️</div>
                  <p className="text-gray-600">No hay categorías disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => {
                    const isSelected = tempSelectedCategories.includes(category.id)
                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50",
                          isSelected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200"
                        )}
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{category.name}</span>
                          </div>
                          {isSelected && (
                            <span className="text-blue-600 text-xl">✓</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4 mt-4 flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleClearCategories}
                className="cursor-pointer"
              >
                Limpiar todo
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  onClick={handleSaveCategories}
                >
                  Aplicar ({tempSelectedCategories.length})
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scale Recipe Modal */}
        <Dialog open={showScaleModal} onOpenChange={setShowScaleModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {scaleStep === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Escalar Receta
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-shrink-0 mt-1">
                      <AlertCircle className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">¿Qué significa escalar una receta?</h3>
                      <p className="text-sm text-blue-800">
                        Escalar una receta te permite ajustar las cantidades de ingredientes proporcionalmente 
                        para un número diferente de raciones, manteniendo las proporciones originales de la receta.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Beneficios de escalar</h3>
                      <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                        <li>Calcula automáticamente las nuevas cantidades de ingredientes</li>
                        <li>Mantiene las proporciones exactas de la receta original</li>
                        <li>Ajusta los costos proporcionalmente</li>
                        <li>Ideal para eventos, catering o producción en lote</li>
                        <li>Guarda la receta escalada como una nueva receta independiente</li>
                      </ul>
                    </div>
                  </div>

                  {selectedRecipe && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Receta seleccionada:</p>
                      <p className="font-semibold text-gray-900">{selectedRecipe.name}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Raciones actuales: <span className="font-semibold">{selectedRecipe.servings}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={closeScaleModal}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={goToStep2}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Escalar Receta - Paso 2
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  {selectedRecipe && (
                    <>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900 mb-2">{selectedRecipe.name}</p>
                        <p className="text-sm text-gray-600">
                          Raciones originales: <span className="font-semibold">{selectedRecipe.servings}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva cantidad de raciones *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={newServingsInput}
                          onChange={(e) => handleServingsInputChange(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder={`Debe ser diferente de ${selectedRecipe.servings}`}
                        />
                        {showServingsError && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <span className="text-base">⚠️</span>
                            El número de porciones debe ser diferente al original ({selectedRecipe.servings})
                          </p>
                        )}
                      </div>

                      {scaledIngredients.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b">
                            <h3 className="font-semibold text-gray-900">Resumen del Escalado</h3>
                            <p className="text-xs text-gray-600 mt-1">
                              Factor de escalado: {(newServings / selectedRecipe.servings).toFixed(2)}x
                            </p>
                          </div>
                          
                          <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ingrediente</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Original</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Escalado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {scaledIngredients.map((ing: any, index: number) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {ing.articles?.name || 'Ingrediente'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                      {ing.original_quantity.toFixed(2)} {ing.unit_info?.symbol || ''}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">
                                      {ing.scaled_quantity.toFixed(2)} {ing.unit_info?.symbol || ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={closeScaleModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmScale}
                    disabled={scaledIngredients.length === 0 || isScaling}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isScaling ? 'Creando...' : 'Confirmar'}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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