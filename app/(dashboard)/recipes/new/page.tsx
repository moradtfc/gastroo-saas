"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Trash2, Search, X, Upload, ChevronDown, DollarSign, Percent, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Ingredient {
  id: number
  article_id: string
  name: string
  quantity: number
  unit: string
  unit_id: string
  cost: number
  available_units?: any[]
  article_cost_per_unit?: number
  article_unit_conversion_factor?: number
}

interface AdditionalCost {
  id: number
  name: string
  amount: number
}

interface Instruction {
  id: number
  step: number
  description: string
}

export default function CreateRecipeForm() {
  const router = useRouter()
  const [recipeName, setRecipeName] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [servings, setServings] = useState<number>(0)
  const [preparationHours, setPreparationHours] = useState<number>(0)
  const [preparationMinutes, setPreparationMinutes] = useState<number>(0)
  const [difficulty, setDifficulty] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('#FF9D3D')
  const [showImageModal, setShowImageModal] = useState<boolean>(false)
  const [headerScrolled, setHeaderScrolled] = useState<boolean>(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([
    { id: 1, name: 'Mano de Obra', amount: 0 },
    { id: 2, name: 'Servicios', amount: 0 }
  ])
  const [sellingPrice, setSellingPrice] = useState<number>(0)
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [showExitConfirmation, setShowExitConfirmation] = useState<boolean>(false)
  const [availableArticles, setAvailableArticles] = useState<any[]>([])
  const [recipeCategories, setRecipeCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [showIngredientModal, setShowIngredientModal] = useState(false)
  const [searchIngredient, setSearchIngredient] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false)
  const [openUnitSelect, setOpenUnitSelect] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const difficultyRef = useRef<HTMLDivElement>(null)

  const [newIngredient, setNewIngredient] = useState({
    article_id: '',
    name: '',
    quantity: 0,
    unit: 'g',
    cost: 0
  })

  const colors = [
    '#999999', '#991B4F', '#E31E24', '#F26649', '#FF9D3D', '#FFD500',
    '#A67C52', '#5C4A3C', '#2D7A3E', '#00C853', '#00BFA5', '#2979FF',
    '#448AFF', '#7C4DFF', '#E91E63'
  ]

  useEffect(() => {
    loadArticles()
    loadRecipeCategories()
    loadUnits()
  }, [])

  useEffect(() => {
    const handleScroll = (): void => {
      if (titleRef.current) {
        const titlePosition = titleRef.current.getBoundingClientRect()
        setHeaderScrolled(titlePosition.bottom < 80)
      }
    }

    handleScroll() // Check inicial
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (difficultyRef.current && !difficultyRef.current.contains(event.target as Node)) {
        setIsDifficultyOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadArticles = async () => {
    try {
      // Cargar artículos con información de unidades
      const { data: articles, error } = await DatabaseService.supabase
        .from('articles')
        .select(`
          *,
          unit_info:unit_id(id, name, symbol, category_id, conversion_factor, base_unit),
          default_unit_info:default_unit_id(id, name, symbol, category_id, conversion_factor, base_unit)
        `)
        .order('name')
      
      if (error) throw error
      
      console.log('✅ Artículos cargados:', articles?.length || 0)
      if (articles && articles.length > 0) {
        console.log('Primer artículo:', articles[0].name)
        console.log('unit_info del primer artículo:', articles[0].unit_info)
      }
      
      setAvailableArticles(articles || [])
    } catch (error) {
      console.error('Error cargando artículos:', error)
      toast.error('Error al cargar los artículos')
    }
  }

  const loadUnits = async () => {
    try {
      const units = await DatabaseService.getUnits()
      console.log('✅ Unidades cargadas:', units?.length || 0)
      if (units && units.length > 0) {
        console.log('Primera unidad:', units[0])
        console.log('Categorías únicas:', [...new Set(units.map(u => u.category_id))])
      }
      setAllUnits(units || [])
    } catch (error) {
      console.error('Error cargando unidades:', error)
    }
  }

  const loadRecipeCategories = async () => {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('recipe_categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setRecipeCategories(data || [])
    } catch (error) {
      console.error('Error cargando categorías:', error)
      toast.error('Error al cargar las categorías')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('El nombre de la categoría es obligatorio')
      return
    }

    try {
      setIsAddingCategory(true)
      const { data, error } = await DatabaseService.supabase
        .from('recipe_categories')
        .insert([{ name: newCategoryName.trim() }])
        .select()
        .single()

      if (error) throw error

      toast.success('Categoría añadida exitosamente')
      setRecipeCategories([...recipeCategories, data])
      setCategory(data.id)
      setNewCategoryName('')
      setShowCategoryModal(false)
    } catch (error: any) {
      console.error('Error añadiendo categoría:', error)
      if (error.code === '23505') {
        toast.error('Esta categoría ya existe')
      } else {
        toast.error('Error al añadir la categoría')
      }
    } finally {
      setIsAddingCategory(false)
    }
  }

  const addIngredientFromModal = (article: any) => {
    // Verificar si el ingrediente ya está en la lista de ingredientes de la receta
    const alreadyInRecipe = ingredients.some(ing => ing.article_id === article.id)
    if (alreadyInRecipe) {
      toast.error('Este ingrediente ya está en la receta')
      return
    }
    
    // Verificar si el ingrediente ya está seleccionado en esta sesión
    const isDuplicate = selectedIngredients.some(ing => ing.id === article.id)
    if (isDuplicate) {
      toast.error('Este ingrediente ya ha sido añadido')
      return
    }
    
    setSelectedIngredients([...selectedIngredients, article])
  }

  const removeSelectedIngredient = (articleId: string) => {
    setSelectedIngredients(selectedIngredients.filter(ing => ing.id !== articleId))
  }

  // Función para obtener unidades compatibles
  const getCompatibleUnits = (article: any) => {
    console.log('getCompatibleUnits called for:', article.name)
    console.log('article.unit_info:', article.unit_info)
    console.log('allUnits length:', allUnits.length)
    
    if (!article.unit_info?.category_id) {
      console.log('No category_id found, returning empty array')
      return []
    }
    
    // Obtener todas las unidades de la misma categoría
    const compatibleUnits = allUnits.filter(
      unit => unit.category_id === article.unit_info.category_id
    )
    
    console.log('Compatible units found:', compatibleUnits.length)
    console.log('Compatible units:', compatibleUnits.map(u => u.name))
    
    return compatibleUnits
  }

  // Función para calcular el costo basado en la conversión de unidades
  const calculateIngredientCost = (
    quantity: number,
    selectedUnitId: string,
    article: any
  ): number => {
    if (!quantity || !selectedUnitId || !article.cost_per_unit || !article.unit_info) {
      return 0
    }

    // Encontrar la unidad seleccionada
    const selectedUnit = allUnits.find(u => u.id === selectedUnitId)
    if (!selectedUnit) return 0

    // Convertir la cantidad a la unidad base del artículo
    // Paso 1: Convertir la cantidad ingresada a unidad base
    const quantityInBaseUnit = quantity * selectedUnit.conversion_factor

    // Paso 2: Convertir de unidad base a la unidad del precio del artículo
    const quantityInArticleUnit = quantityInBaseUnit / article.unit_info.conversion_factor

    // Paso 3: Calcular el costo
    const cost = quantityInArticleUnit * article.cost_per_unit

    return cost
  }

  const saveSelectedIngredients = () => {
    const newIngredients = selectedIngredients.map(article => {
      const compatibleUnits = getCompatibleUnits(article)
      // La unidad base debe ser la unidad en la que se registró el artículo (unit_id)
      const defaultUnit = article.unit_info
      
      console.log('Article:', article.name)
      console.log('Compatible units:', compatibleUnits)
      console.log('Default unit (registered unit):', defaultUnit)
      
      return {
        id: Date.now() + Math.random(),
        article_id: article.id,
        name: article.name,
      quantity: 0,
        unit: defaultUnit?.symbol || 'unidad',
        unit_id: defaultUnit?.id || '',
      cost: 0,
        available_units: compatibleUnits.length > 0 ? compatibleUnits : [defaultUnit],
        article_cost_per_unit: article.cost_per_unit,
        article_unit_conversion_factor: article.unit_info?.conversion_factor || 1
      }
    })
    
    setIngredients([...ingredients, ...newIngredients])
    setSelectedIngredients([])
    setShowIngredientModal(false)
    setSearchIngredient('')
    toast.success(`${newIngredients.length} ingrediente(s) añadido(s)`)
  }

  const updateIngredientQuantity = (id: number, quantity: number) => {
    setIngredients(ingredients.map(ing => {
        if (ing.id === id) {
        const article = availableArticles.find(a => a.id === ing.article_id)
        const cost = calculateIngredientCost(quantity, ing.unit_id, article)
        return { ...ing, quantity, cost }
      }
      return ing
    }))
  }

  const updateIngredientUnit = (id: number, unitId: string) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        const selectedUnit = allUnits.find(u => u.id === unitId)
        const article = availableArticles.find(a => a.id === ing.article_id)
        const cost = calculateIngredientCost(ing.quantity, unitId, article)
        return {
          ...ing,
          unit_id: unitId,
          unit: selectedUnit?.symbol || ing.unit,
          cost
        }
        }
        return ing
    }))
  }

  const addNewAdditionalCost = () => {
    const newCost: AdditionalCost = {
      id: Date.now(),
      name: '',
      amount: 0
    }
    setAdditionalCosts([...additionalCosts, newCost])
  }

  const updateAdditionalCostName = (id: number, name: string) => {
    setAdditionalCosts(additionalCosts.map(cost => 
      cost.id === id ? { ...cost, name } : cost
    ))
  }

  const removeAdditionalCost = (id: number) => {
    setAdditionalCosts(additionalCosts.filter(cost => cost.id !== id))
  }

  const filteredArticles = availableArticles.filter(article =>
    article.name.toLowerCase().includes(searchIngredient.toLowerCase())
  )

  const filteredCategories = recipeCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return ''
    const trimmed = name.trim()
    return trimmed.substring(0, 2).toUpperCase()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addIngredient = (): void => {
    if (newIngredient.article_id && newIngredient.quantity > 0) {
      const article = availableArticles.find(a => a.id === newIngredient.article_id)
      if (!article) return

      const compatibleUnits = getCompatibleUnits(article)
      const defaultUnit = article.unit_info || compatibleUnits[0]

      const ingredient: Ingredient = {
        id: Date.now(),
        article_id: newIngredient.article_id,
        name: article.name,
        quantity: newIngredient.quantity,
        unit: defaultUnit?.symbol || 'unidad',
        unit_id: defaultUnit?.id || '',
        cost: newIngredient.cost,
        available_units: compatibleUnits,
        article_cost_per_unit: article.cost_per_unit,
        article_unit_conversion_factor: article.unit_info?.conversion_factor || 1
      }
      setIngredients([...ingredients, ingredient])
      setNewIngredient({ article_id: '', name: '', quantity: 0, unit: 'g', cost: 0 })
    }
  }

  const removeIngredient = (id: number): void => {
    setIngredients(ingredients.filter(ing => ing.id !== id))
  }

  const updateAdditionalCost = (id: number, amount: number): void => {
    setAdditionalCosts(additionalCosts.map(cost => 
      cost.id === id ? { ...cost, amount } : cost
    ))
  }

  const addInstruction = (): void => {
    const newInstruction: Instruction = {
      id: Date.now(),
      step: instructions.length + 1,
      description: ''
    }
    setInstructions([...instructions, newInstruction])
  }

  const updateInstruction = (id: number, description: string): void => {
    setInstructions(instructions.map(inst =>
      inst.id === id ? { ...inst, description } : inst
    ))
  }

  const removeInstruction = (id: number): void => {
    const filtered = instructions.filter(inst => inst.id !== id)
    const reordered = filtered.map((inst, index) => ({
      ...inst,
      step: index + 1
    }))
    setInstructions(reordered)
  }

  const ingredientsCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0)
  const additionalCostTotal = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const totalCost = ingredientsCost + additionalCostTotal
  const costPerServing = servings > 0 ? totalCost / servings : 0
  const profit = sellingPrice - costPerServing
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0
  const totalPreparationTime = (preparationHours * 60) + preparationMinutes

  const handleSubmit = async (): Promise<void> => {
    if (!recipeName.trim()) {
      toast.error('El nombre de la receta es obligatorio')
      return
    }

    if (ingredients.length === 0) {
      toast.error('Debes añadir al menos un ingrediente')
      return
    }

    try {
      setLoading(true)

      // Obtener el nombre de la categoría seleccionada
      const selectedCategoryName = category 
        ? recipeCategories.find(cat => cat.id === category)?.name 
        : undefined

      // Crear la receta
      const recipeData = {
        name: recipeName,
        recipe_category_id: category || undefined,
        category: selectedCategoryName, // Guardar el nombre de la categoría
        servings: servings,
        cooking_time: totalPreparationTime,
        difficulty: difficulty || undefined,
        description: description || undefined,
        instructions: instructions.map(i => i.description).join('\n') || undefined,
        sale_price: sellingPrice > 0 ? sellingPrice : undefined,
        image_url: imagePreview || undefined,
        cost_per_serving: costPerServing,
        profit_per_serving: profit,
        profit_margin_percentage: profitMargin,
        total_profit: profit * servings,
        total_cost: totalCost,
        ingredients_cost: ingredientsCost,
        additional_costs_total: additionalCostTotal
      }

      const recipe = await DatabaseService.createRecipe(recipeData)

      if (!recipe?.id) {
        throw new Error('No se pudo crear la receta')
      }

      // Añadir ingredientes con unit_id
      const ingredientsToInsert = ingredients.map(ing => ({
        recipe_id: recipe.id,
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
        console.error('Error añadiendo ingredientes:', ingredientsError)
        throw ingredientsError
      }

      // Añadir costos adicionales
      if (additionalCosts.length > 0) {
        const costsToInsert = additionalCosts
          .filter(cost => cost.name && cost.amount > 0)
          .map(cost => ({
            recipe_id: recipe.id,
            name: cost.name,
            amount: cost.amount
          }))

        if (costsToInsert.length > 0) {
          const { error: costsError } = await DatabaseService.supabase
            .from('recipe_additional_costs')
            .insert(costsToInsert)

          if (costsError) {
            console.error('Error añadiendo costos adicionales:', costsError)
          }
        }
      }

      toast.success('Receta creada exitosamente')
      router.push('/recipes')
    } catch (error) {
      console.error('Error creando receta:', error)
      toast.error('Error al crear la receta')
    } finally {
      setLoading(false)
    }
  }

  const openImageModal = (): void => {
    setShowImageModal(true)
  }

  const closeImageModal = (): void => {
    setShowImageModal(false)
  }

  const saveImageChanges = (): void => {
    setShowImageModal(false)
    toast.success('Imagen actualizada')
  }

  // Verificar si hay cambios en el formulario
  const hasChanges = (): boolean => {
    return !!(
      recipeName.trim() ||
      category ||
      servings > 0 ||
      preparationHours > 0 ||
      preparationMinutes > 0 ||
      difficulty ||
      description.trim() ||
      imagePreview ||
      ingredients.length > 0 ||
      additionalCosts.some(c => c.amount > 0) ||
      sellingPrice > 0 ||
      instructions.length > 0
    )
  }

  const handleExit = (): void => {
    if (hasChanges()) {
      setShowExitConfirmation(true)
    } else {
      router.push('/recipes')
    }
  }

  const confirmExit = (): void => {
    setShowExitConfirmation(false)
    router.push('/recipes')
  }

  // Validar si se puede guardar
  const canSave = (): boolean => {
    return !!(
      recipeName.trim() &&
      ingredients.length > 0
    )
  }

  const handleArticleSelect = (articleId: string) => {
    const article = availableArticles.find(a => a.id === articleId)
    if (article) {
      setNewIngredient(prev => ({
        ...prev,
        article_id: articleId,
        name: article.name,
        unit: article.unit || 'unidad',
        cost: 0
      }))
    }
  }


  return (
    <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
      {/* Modal de búsqueda de ingredientes */}
      <Dialog open={showIngredientModal} onOpenChange={(open) => {
        setShowIngredientModal(open)
        if (!open) {
          setSelectedIngredients([])
          setSearchIngredient('')
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Añadir Ingredientes</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Busca y añade artículos de tu inventario</p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {/* Tags de ingredientes seleccionados */}
            {selectedIngredients.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedIngredients.map((article) => (
                  <div
                    key={article.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm"
                  >
                    <span className="font-medium">{article.name}</span>
                    <button
                      onClick={() => removeSelectedIngredient(article.id)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
        </div>
                ))}
      </div>
            )}
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artículo..."
                value={searchIngredient}
                onChange={(e) => setSearchIngredient(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => {
                  const isSelected = selectedIngredients.some(ing => ing.id === article.id)
                  const isInRecipe = ingredients.some(ing => ing.article_id === article.id)
                  const isDisabled = isSelected || isInRecipe
                  
                  return (
                    <div
                      key={article.id}
                      onClick={() => !isDisabled && addIngredientFromModal(article)}
                      className={cn(
                        "p-4 border rounded-lg transition-all",
                        isDisabled
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:bg-blue-50 hover:border-blue-500 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{article.name}</p>
                          <p className="text-sm text-gray-600">
                            {article.unit} • Costo: €{(article.cost_per_unit || 0).toFixed(2)}
                          </p>
                        </div>
                        {isDisabled ? (
                          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                            {isInRecipe ? 'En receta ✓' : 'Añadido ✓'}
                          </span>
                        ) : (
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Añadir
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No se encontraron artículos</p>
                  <p className="text-sm">Intenta con otro término de búsqueda</p>
                </div>
              )}
                  </div>
                </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              onClick={saveSelectedIngredients}
              disabled={selectedIngredients.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Guardar ({selectedIngredients.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para añadir categoría */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Añadir Nueva Categoría</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Nombre de la Categoría</label>
              <input
                type="text"
                placeholder="Ej: Parrilladas"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                  </div>
                  </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false)
                setNewCategoryName('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={isAddingCategory || !newCategoryName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAddingCategory ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ zIndex: 99999 }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Editar imagen de la receta</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Imagen */}
            <div>
              <h4 className="font-semibold mb-4">Imagen</h4>
              <label htmlFor="recipe-image-upload" className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-blue-500 hover:bg-gray-50 cursor-pointer transition-all">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        Arrastra y suelta las imágenes aquí,<br />
                        <span className="text-blue-600 font-semibold hover:underline">haz clic para subir</span>
                  </div>
                    </>
                  )}
                </div>
              </label>
              <input
                id="recipe-image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImagePreview('')
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="mt-2 w-full"
                >
                  Eliminar imagen
                </Button>
              )}
                </div>

            {/* Color */}
            <div>
              <h4 className="font-semibold mb-4">Color</h4>
              <div className="grid grid-cols-5 gap-3 max-w-md">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "aspect-square rounded-lg border-[3px] transition-all hover:scale-105 flex items-center justify-center",
                      selectedColor === color ? "border-gray-900" : "border-transparent"
                    )}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <span className="text-white text-3xl font-bold drop-shadow-md">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview - Color seleccionado */}
            <div>
              <h4 className="font-semibold mb-4">Vista previa</h4>
              <div className="bg-gray-100 rounded-xl p-6 text-center">
                <div
                  className="w-full max-w-[300px] h-[200px] mx-auto mb-4 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ background: imagePreview ? 'transparent' : selectedColor }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-white text-5xl font-semibold">{getInitials(recipeName)}</span>
                  )}
                </div>
                <div className="text-blue-600 font-semibold text-sm">Listo</div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-5 mt-6">
            <Button variant="outline" onClick={() => setShowImageModal(false)}>
              Cancelar
                  </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowImageModal(false)}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sticky top-0 bg-white border-b border-gray-200 z-[9999] transition-all">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex-1">
            <button 
              onClick={handleExit}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors text-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 text-center">
            <h2 className={`text-lg font-semibold transition-opacity duration-300 ${headerScrolled ? 'opacity-100' : 'opacity-0'}`}>
              {recipeName || 'Crea una receta'}
            </h2>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || !canSave()}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-colors",
                canSave() && !loading
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
                </div>

      {/* Modal de confirmación de salida */}
      <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">¿Descartar cambios?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Tienes cambios sin guardar. Si sales ahora, perderás todos los datos ingresados.
            </p>
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirmation(false)}
            >
              Quedarme aquí
            </Button>
            <Button
              onClick={confirmExit}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Descartar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto bg-white" ref={contentRef}>
        <div className="p-6">
          <h1 className="text-3xl font-semibold mb-6" id="main-title">Crea una receta</h1>

          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-xl">📢</span>
              <span className="text-sm">Crea recetas detalladas con costos precisos y márgenes de ganancia</span>
            </div>
            <a href="#" className="text-blue-600 font-semibold text-sm hover:underline">Más información</a>
                  </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Información</h2>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-base"
                  placeholder="Nombre"
                />
                              </div>
          </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-base resize-none"
                  rows={5}
                  placeholder="Descripción"
                />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Raciones</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={servings || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setServings(value ? Number(value) : 0)
                      }}
                      placeholder="0"
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Tiempo de preparación</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={preparationHours || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            const num = value ? Number(value) : 0
                            if (num <= 24) setPreparationHours(num)
                          }}
                          className="w-full h-10 px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">h</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={preparationMinutes || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            const num = value ? Number(value) : 0
                            if (num <= 59) setPreparationMinutes(num)
                          }}
                          className="w-full h-10 px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Dificultad</label>
                    <div ref={difficultyRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
                        className="w-full h-10 px-4 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <span className={difficulty ? 'text-gray-900 text-sm' : 'text-gray-400 text-sm'}>
                          {difficulty || 'Seleccionar dificultad'}
                        </span>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform ${isDifficultyOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isDifficultyOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                            {['Fácil', 'Intermedio', 'Difícil'].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => {
                                  setDifficulty(level)
                                  setIsDifficultyOpen(false)
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                  difficulty === level
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                                  </div>
                                )}
                              </div>
                  </div>
                </div>
              </div>

              <div className="w-40">
                <div 
                  onClick={openImageModal}
                  className="w-40 h-32 rounded-lg flex items-center justify-center text-5xl font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: imagePreview ? 'transparent' : selectedColor }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Recipe" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span>{getInitials(recipeName)}</span>
                                )}
                              </div>
                <div 
                  onClick={openImageModal}
                  className="text-blue-600 font-semibold text-sm text-center mt-2 cursor-pointer hover:underline"
                >
                  Editar
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase">Categoría</label>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  + Añadir categoría
                </button>
              </div>
              
              {/* Categoría seleccionada */}
              {category && recipeCategories.find(cat => cat.id === category) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {recipeCategories.find(cat => cat.id === category)?.icon && (
                        <span className="text-xl">{recipeCategories.find(cat => cat.id === category)?.icon}</span>
                      )}
                      <div>
                        <p className="font-semibold text-blue-900">{recipeCategories.find(cat => cat.id === category)?.name}</p>
                      </div>
                    </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                      onClick={() => {
                        setCategory('')
                        setCategorySearch('')
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Cambiar
                              </Button>
                  </div>
                  </div>
                )}
              
              {/* Buscador de categorías */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar categoría..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
          </div>

              {/* Lista de categorías */}
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id)
                        setCategorySearch('')
                      }}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all",
                        category === cat.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {cat.icon && <span className="text-xl">{cat.icon}</span>}
                        <span className="font-medium">{cat.name}</span>
                        {category === cat.id && (
                          <span className="ml-auto text-blue-600">✓</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No se encontraron categorías</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Ingredientes</h2>
                <p className="text-sm text-gray-600 mt-1">Añade los ingredientes necesarios con sus cantidades y costos</p>
              </div>
              <button
                onClick={() => setShowIngredientModal(true)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Añadir ingredientes
              </button>
            </div>

            {/* Banner informativo sobre conversión de unidades */}
            {ingredients.length === 0 && (
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Agrega los ingredientes de tu receta, se calcularán automáticamente los costos de acuerdo a la cantidad y a la unidad en la que elijas añadirlo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Estadísticas de ingredientes */}
            {ingredients.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Ingredientes</p>
                  <p className="text-2xl font-bold text-blue-900">{ingredients.length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-xs text-green-600 font-semibold mb-1">Costo Total</p>
                  <p className="text-2xl font-bold text-green-900">€{ingredientsCost.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Costo/Ración</p>
                  <p className="text-2xl font-bold text-purple-900">€{costPerServing.toFixed(2)}</p>
                </div>
              </div>
            )}

            {ingredients.length > 0 && (
                <div className="space-y-3">
                {ingredients.map((ingredient) => {
                  const article = availableArticles.find(a => a.id === ingredient.article_id)
                  const articleUnit = article?.unit_info
                  
                  return (
                    <div
                      key={ingredient.id}
                      className="p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900 block">{ingredient.name}</span>
                          {article && articleUnit && (
                            <span className="text-xs text-gray-500">
                              Precio en inventario: €{article.cost_per_unit?.toFixed(2)} por {articleUnit.symbol}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeIngredient(ingredient.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                  </div>

                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Cantidad */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={ingredient.quantity || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '')
                              const parts = value.split('.')
                              const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value
                              updateIngredientQuantity(ingredient.id, sanitized ? Number(sanitized) : 0)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                            placeholder="0"
                        />
                      </div>

                        {/* Unidad */}
                        <div className="col-span-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenUnitSelect(openUnitSelect === ingredient.id ? null : ingredient.id)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            >
                              <span className={ingredient.unit_id ? 'text-gray-900' : 'text-gray-400'}>
                                {ingredient.unit_id 
                                  ? `${ingredient.unit} - ${ingredient.available_units?.find((u: any) => u.id === ingredient.unit_id)?.name || ''}` 
                                  : 'Seleccionar unidad'}
                              </span>
                              <ChevronDown 
                                className={`w-4 h-4 text-gray-400 transition-transform ${openUnitSelect === ingredient.id ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {openUnitSelect === ingredient.id && ingredient.available_units && ingredient.available_units.length > 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                <div className="max-h-60 overflow-y-auto">
                                  {ingredient.available_units
                                    .sort((a: any, b: any) => {
                                      if (a.base_unit) return -1
                                      if (b.base_unit) return 1
                                      return a.conversion_factor - b.conversion_factor
                                    })
                                    .map((unit: any) => (
                                      <button
                                        key={unit.id}
                                        type="button"
                                        onClick={() => {
                                          updateIngredientUnit(ingredient.id, unit.id)
                                          setOpenUnitSelect(null)
                                        }}
                                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                                          ingredient.unit_id === unit.id
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>
                                            <span className="font-semibold">{unit.symbol}</span> - {unit.name}
                                          </span>
                                          {unit.base_unit && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                              Base
                                            </span>
                                          )}
                      </div>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Costo calculado */}
                        <div className="col-span-5">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Costo Total
                            {ingredient.quantity > 0 && ingredient.cost > 0 && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </label>
                      <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={ingredient.cost.toFixed(2)}
                                readOnly
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-sm text-right font-bold text-blue-900 cursor-not-allowed"
                              />
                              {ingredient.quantity > 0 && ingredient.cost > 0 && (
                                <div className="absolute -top-6 right-0 text-[10px] text-green-600 font-semibold">
                                  Auto-calculado
                      </div>
                              )}
                    </div>
                            <span className="text-sm text-gray-600 font-medium">€</span>
                  </div>
                    </div>
                    </div>
                  </div>
                  )
                })}
                </div>
            )}
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Costos y Análisis</h2>

            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 mb-6">
              <span className="text-xl">💡</span>
              <span className="text-sm">Puedes crear en este apartado los costos adicionales de tu receta</span>
            </div>

            <div className="space-y-3 mb-6">
              {additionalCosts.map((cost) => {
                const isLaborCost = cost.id === 1
                const hasPreparationTime = (preparationHours > 0 || preparationMinutes > 0)
                const isDisabled = isLaborCost && !hasPreparationTime
                
                return (
                  <div key={cost.id} className={cn(
                    "flex items-center justify-between p-4 border border-gray-200 rounded-lg",
                    isDisabled && "bg-gray-50 opacity-60"
                  )}>
                    {cost.id <= 2 ? (
                      <div className="flex-1">
                        <label className="text-sm font-medium block">{cost.name}</label>
                        {isLaborCost && !hasPreparationTime && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Primero ingresa el tiempo de preparación
                          </p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={cost.name}
                        onChange={(e) => updateAdditionalCostName(cost.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm mr-2"
                        placeholder="Nombre del costo"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cost.amount || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          const parts = value.split('.')
                          const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value
                          updateAdditionalCost(cost.id, sanitized ? Number(sanitized) : 0)
                        }}
                        disabled={isDisabled}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-right disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="0.00"
                      />
                      <span className="text-sm text-gray-600">€</span>
                      {cost.id > 2 && (
                        <button
                          onClick={() => removeAdditionalCost(cost.id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              <button
                onClick={addNewAdditionalCost}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer text-sm font-medium"
              >
                + Añadir costo personalizado
              </button>
                </div>

            <div className="space-y-3 pt-4 border-t border-gray-200">
              {/* Desglose de ingredientes */}
              {ingredients.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Desglose por Ingrediente</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {ingredients.map((ing) => (
                      <div key={ing.id} className="flex justify-between items-center text-xs py-1 px-2 hover:bg-gray-50 rounded">
                        <span className="text-gray-700">{ing.name} ({ing.quantity} {ing.unit})</span>
                        <span className="font-semibold text-gray-900">€{ing.cost.toFixed(2)}</span>
                    </div>
                    ))}
                    </div>
                  </div>
              )}

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600 flex items-center gap-1">
                  <span>Costo de ingredientes</span>
                  {ingredients.length > 0 && (
                    <span className="text-xs text-blue-600">({ingredients.length})</span>
                  )}
                      </span>
                <span className="font-semibold">{ingredientsCost.toFixed(2)} €</span>
                    </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Costos adicionales</span>
                <span className="font-semibold">{additionalCostTotal.toFixed(2)} €</span>
                  </div>
              <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                <span>Costo Total</span>
                <span className="text-blue-600">{totalCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                <span className="font-medium">Costo por Ración</span>
                <span className="font-bold text-blue-600">{costPerServing.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-6">Precio y Margen de Ganancia</h2>

            {/* Input de precio de venta */}
            <div className="max-w-sm mx-auto mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de venta por ración
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                  €
                      </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sellingPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    const parts = value.split('.')
                    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value
                    setSellingPrice(sanitized ? Number(sanitized) : 0)
                  }}
                  disabled={servings === 0}
                  className="w-full pl-10 pr-4 py-3 text-2xl font-bold text-gray-800 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={servings === 0 ? "0.00" : "0.00"}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Costo por ración: €{costPerServing.toFixed(2)}
              </p>
              {servings === 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Primero ingresa la cantidad de porciones
                </p>
              )}
            </div>

            {/* Gráfica circular simple con CSS */}
            {sellingPrice > 0 && costPerServing > 0 && (
              <div className="mb-8">
                <div className="relative w-64 h-64 mx-auto">
                  {/* Círculo de fondo (Costo) */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                        #ef4444 0deg ${(costPerServing / sellingPrice) * 360}deg,
                        #10b981 ${(costPerServing / sellingPrice) * 360}deg 360deg
                      )`
                    }}
                  />
                  {/* Círculo interior blanco para efecto dona */}
                  <div className="absolute inset-[25%] bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">{profitMargin.toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">Margen</p>
                    </div>
                  </div>
                </div>
                
                {/* Leyenda */}
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-600">Costo: €{costPerServing.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">Ganancia: €{profit.toFixed(2)}</span>
                  </div>
                    </div>
                  </div>
                )}

            {/* Métricas principales */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-700">
                  €{profit.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">Por ración</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
                  <Percent className="w-5 h-5 text-blue-600" />
            </div>
                <p className="text-2xl font-bold text-blue-700">
                  {profitMargin.toFixed(0)}%
                </p>
                <p className="text-xs text-blue-600 mt-1">Margen</p>
          </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
        </div>
                <p className="text-2xl font-bold text-purple-700">
                  €{(profit * servings).toFixed(2)}
                </p>
                <p className="text-xs text-purple-600 mt-1">Ganancia total</p>
              </div>
            </div>

            {/* Nota informativa */}
            {servings > 0 && sellingPrice > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Estimación:</span> Basado en {servings} raciones. 
                  Tu margen de {profitMargin.toFixed(0)}% {profitMargin >= 30 ? 'está dentro del rango recomendado' : 'podría mejorarse'} para este tipo de producto.
                </p>
              </div>
            )}
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Instrucciones de Preparación</h2>
                <p className="text-sm text-gray-600 mt-1">Añade los pasos detallados para preparar esta receta</p>
            </div>
              <button
                onClick={addInstruction}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Añadir
              </button>
          </div>

            <div className="space-y-3">
              {instructions.map((instruction) => (
                <div key={instruction.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {instruction.step}
        </div>
                  <textarea
                    value={instruction.description}
                    onChange={(e) => updateInstruction(instruction.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 resize-none"
                    rows={2}
                    placeholder={`Paso ${instruction.step}: Describe la instrucción...`}
                  />
                  <button
                    onClick={() => removeInstruction(instruction.id)}
                    className="flex-shrink-0 text-red-600 hover:text-red-700 p-2 cursor-pointer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
