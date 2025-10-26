"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Trash2, Search, X, Upload, ChevronDown, DollarSign, Percent, Package } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface CreateRecipeFormProps {
  params?: {
    id?: string
  }
}

export default function CreateRecipeForm({ params }: CreateRecipeFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recipeName, setRecipeName] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [recipeId, setRecipeId] = useState<string | null>(null)
  const [originalData, setOriginalData] = useState<any>(null)
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
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
    // Detectar si es modo edición
    const editId = params?.id || searchParams.get('edit')
    if (editId) {
      setIsEditMode(true)
      setRecipeId(editId)
      // Resetear estado inicial para modo edición
      setInitialDataLoaded(false)
    } else {
      setIsEditMode(false)
      setRecipeId(null)
      setInitialDataLoaded(true) // En modo creación, marcar como cargado
    }
    
    loadArticles()
    loadRecipeCategories()
    loadUnits()
  }, [params?.id, searchParams])

  // Efecto separado para cargar datos de receta después de cargar unidades
  useEffect(() => {
    if (isEditMode && recipeId && allUnits.length > 0) {
      loadRecipeData(recipeId)
    }
  }, [isEditMode, recipeId, allUnits])


  // Detectar cambios en cualquier campo del formulario
  useEffect(() => {
    // Solo detectar cambios en modo edición y después de que se carguen los datos iniciales
    if (!isEditMode || !initialDataLoaded || !originalData) {
      setHasUnsavedChanges(false)
      return
    }

    // Verificar si hay cambios usando la función hasChanges
    const changesDetected = hasChanges()
    setHasUnsavedChanges(changesDetected)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Detectando cambios:', changesDetected)
    }
  }, [
    isEditMode,
    initialDataLoaded,
    originalData,
    recipeName,
    category,
    servings,
    preparationHours,
    preparationMinutes,
    difficulty,
    description,
    imagePreview,
    selectedColor,
    sellingPrice,
    ingredients,
    instructions,
    additionalCosts
  ])

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

  const loadRecipeData = async (recipeId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            article_id,
            quantity,
            unit,
            unit_id,
            cost,
            articles (
              id,
              name,
              cost_per_unit,
              unit_info:unit_id(id, name, symbol, category_id, conversion_factor, base_unit)
            )
          ),
          recipe_additional_costs (
            id,
            name,
            amount
          )
        `)
        .eq('id', recipeId)
        .single()

      if (error) throw error
      if (!data) throw new Error('Receta no encontrada')

      // Cargar datos básicos
      setRecipeName(data.name || '')
      setCategory(data.recipe_category_id || '')
      setServings(data.servings || 0)
      setPreparationHours(Math.floor((data.cooking_time || 0) / 60))
      setPreparationMinutes((data.cooking_time || 0) % 60)
      setDifficulty(data.difficulty || '')
      setDescription(data.description || '')
      
      // Cargar imagen con debugging
      console.log('🖼️ Cargando imagen de la receta:', {
        image_url: data.image_url,
        hasImage: !!data.image_url,
        imageLength: data.image_url?.length || 0
      })
      setImagePreview(data.image_url || '')
      setSelectedColor(data.color || '#FF9D3D')
      setSellingPrice(data.sale_price || 0)

      // Cargar ingredientes
      if (data.recipe_ingredients && data.recipe_ingredients.length > 0) {
        const formattedIngredients = data.recipe_ingredients.map((ri: any) => {
          // Obtener unidades compatibles para este artículo
          const compatibleUnits = ri.articles?.unit_info?.category_id 
            ? allUnits.filter(unit => unit.category_id === ri.articles.unit_info.category_id)
            : [ri.articles?.unit_info].filter(Boolean)
          
          return {
            id: ri.id,
            article_id: ri.article_id,
            name: ri.articles?.name || '',
            quantity: ri.quantity,
            unit: ri.unit,
            unit_id: ri.unit_id,
            cost: ri.cost,
            available_units: compatibleUnits.length > 0 ? compatibleUnits : [ri.articles?.unit_info].filter(Boolean),
            article_cost_per_unit: ri.articles?.cost_per_unit,
            article_unit_conversion_factor: ri.articles?.unit_info?.conversion_factor || 1
          }
        })
        setIngredients(formattedIngredients)
      }

      // Cargar instrucciones si existen
      if (data.instructions) {
        const instructionLines = data.instructions.split('\n').filter((line: string) => line.trim())
        const formattedInstructions = instructionLines.map((line: string, index: number) => ({
          id: index + 1,
          step: index + 1,
          description: line.trim()
        }))
        setInstructions(formattedInstructions)
      }

      // Cargar costos adicionales, asegurando que siempre existan Mano de Obra y Servicios
      const defaultCosts = [
        { id: 1, name: 'Mano de Obra', amount: 0 },
        { id: 2, name: 'Servicios', amount: 0 }
      ]
      
      if (data.recipe_additional_costs && data.recipe_additional_costs.length > 0) {
        const formattedCosts = data.recipe_additional_costs.map((cost: any, index: number) => ({
          id: cost.id || (Date.now() + index),
          name: cost.name,
          amount: cost.amount
        }))
        
        // Combinar costos de BD con los por defecto
        const mergedCosts = [...defaultCosts]
        formattedCosts.forEach((cost: AdditionalCost) => {
          const existingIndex = mergedCosts.findIndex(c => c.name === cost.name)
          if (existingIndex !== -1) {
            mergedCosts[existingIndex] = cost
          } else {
            mergedCosts.push(cost)
          }
        })
        setAdditionalCosts(mergedCosts)
      } else {
        setAdditionalCosts(defaultCosts)
      }

      // Preparar ingredientes originales con la misma estructura que los actuales
      const originalIngredients = data.recipe_ingredients ? data.recipe_ingredients.map((ri: any) => {
        const compatibleUnits = ri.articles?.unit_info?.category_id 
          ? allUnits.filter(unit => unit.category_id === ri.articles.unit_info.category_id)
          : [ri.articles?.unit_info].filter(Boolean)
        
        return {
          id: ri.id,
          article_id: ri.article_id,
          name: ri.articles?.name || '',
          quantity: ri.quantity,
          unit: ri.unit,
          unit_id: ri.unit_id,
          cost: ri.cost,
          available_units: compatibleUnits.length > 0 ? compatibleUnits : [ri.articles?.unit_info].filter(Boolean),
          article_cost_per_unit: ri.articles?.cost_per_unit,
          article_unit_conversion_factor: ri.articles?.unit_info?.conversion_factor || 1
        }
      }) : []

      // Preparar costos adicionales originales con la misma estructura que los actuales
      const originalCosts = [...defaultCosts]
      if (data.recipe_additional_costs && data.recipe_additional_costs.length > 0) {
        data.recipe_additional_costs.forEach((cost: any) => {
          const existingIndex = originalCosts.findIndex(c => c.name === cost.name)
          if (existingIndex !== -1) {
            originalCosts[existingIndex] = {
              id: cost.id || originalCosts[existingIndex].id,
              name: cost.name,
              amount: cost.amount
            }
          } else {
            originalCosts.push({
              id: cost.id || (Date.now() + Math.random()),
              name: cost.name,
              amount: cost.amount
            })
          }
        })
      }

      // Guardar datos originales para comparación
      setOriginalData({
        name: data.name || '',
        category: data.recipe_category_id || '',
        servings: data.servings || 0,
        preparationHours: Math.floor((data.cooking_time || 0) / 60),
        preparationMinutes: (data.cooking_time || 0) % 60,
        difficulty: data.difficulty || '',
        description: data.description || '',
        imagePreview: data.image_url || '',
        selectedColor: data.color || '#FF9D3D',
        sellingPrice: data.sale_price || 0,
        ingredients: originalIngredients, // Usar la estructura correcta
        instructions: data.instructions || '',
        additionalCosts: originalCosts // Usar la estructura correcta con costos por defecto
      })

      // Marcar que los datos iniciales han sido cargados y resetear cambios
      setInitialDataLoaded(true)
      setHasUnsavedChanges(false)

    } catch (error) {
      console.error('Error cargando receta:', error)
      toast.error('Error al cargar la receta')
    } finally {
      setLoading(false)
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
      console.log('📤 Archivo seleccionado:', {
        nombre: file.name,
        tamaño: `${(file.size / 1024).toFixed(2)} KB`,
        tipo: file.type
      })
      
      // Verificar el tamaño del archivo original (5MB límite)
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        toast.error(`La imagen es demasiado grande (${sizeMB} MB). Por favor, selecciona una imagen menor a 5MB.`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        
        console.log('📊 Imagen leída, iniciando compresión...')
        
        // Comprimir la imagen para reducir el tamaño base64
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            console.warn('⚠️ No se pudo obtener contexto del canvas, usando imagen original')
            setImagePreview(result)
            return
          }

          // Calcular nuevo tamaño manteniendo aspect ratio
          let { width, height } = img
          const maxSize = 800 // máximo 800px en cualquier dimensión
          
          console.log('🖼️ Dimensiones originales:', { width, height })
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width
              width = maxSize
            } else {
              width = (width * maxSize) / height
              height = maxSize
            }
            console.log('📐 Redimensionando a:', { width: Math.round(width), height: Math.round(height) })
          }

          canvas.width = width
          canvas.height = height

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height)
          
          // Obtener base64 comprimido con mejor calidad
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85) // 85% calidad para mejor resultado
          
          // Verificar tamaño del resultado comprimido
          const sizeInBytes = (compressedBase64.length * 3) / 4
          const sizeInKB = sizeInBytes / 1024
          const sizeInMB = sizeInBytes / (1024 * 1024)
          
          console.log('✅ Imagen comprimida:', {
            tamañoKB: sizeInKB.toFixed(2),
            tamañoMB: sizeInMB.toFixed(2),
            longitud: compressedBase64.length
          })
          
          // Límite más generoso de 3MB para base64
          if (sizeInBytes > 3 * 1024 * 1024) {
            toast.error(`La imagen comprimida es demasiado grande (${sizeInMB.toFixed(2)} MB). Por favor, selecciona una imagen más pequeña.`)
            return
          }
          
          if (sizeInBytes > 1 * 1024 * 1024) { // Advertencia si es > 1MB
            toast.warning(`La imagen es grande (${sizeInMB.toFixed(2)} MB). Puede tardar en guardarse.`)
          }
          
          console.log('💾 Guardando imagen en imagePreview')
          setImagePreview(compressedBase64)
          toast.success('Imagen cargada correctamente')
        }
        img.onerror = () => {
          // Si falla la compresión, usar la imagen original
          console.error('❌ Error al cargar imagen para compresión, usando original')
          setImagePreview(result)
        }
        img.src = result
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

    // Verificar que al menos un ingrediente tenga cantidad mayor a 0
    const hasValidIngredients = ingredients.some(ing => ing.quantity > 0)
    if (!hasValidIngredients) {
      toast.error('Debes especificar la cantidad de al menos un ingrediente')
      return
    }

    try {
      setLoading(true)

      // Obtener el nombre de la categoría seleccionada
      const selectedCategoryName = category 
        ? recipeCategories.find(cat => cat.id === category)?.name 
        : undefined

      // Preparar datos de la receta - solo campos que definitivamente existen
      const recipeData: any = {
        name: recipeName.trim(),
        updated_at: new Date().toISOString()
      }

      // Solo agregar campos que tienen valores válidos
      if (category) recipeData.recipe_category_id = category
      if (servings && servings > 0) recipeData.servings = servings
      if (totalPreparationTime && totalPreparationTime > 0) recipeData.cooking_time = totalPreparationTime
      if (difficulty && difficulty.trim()) recipeData.difficulty = difficulty.trim()
      if (description && description.trim()) recipeData.description = description.trim()
      
      const instructionsText = instructions.map(i => i.description).join('\n')
      if (instructionsText.trim()) recipeData.instructions = instructionsText.trim()
      
      if (sellingPrice && sellingPrice > 0) recipeData.sale_price = sellingPrice
      
      // Manejar imagen de forma segura
      console.log('🎨 Estado de imagePreview antes de validar:', {
        tieneImagen: !!imagePreview,
        longitud: imagePreview?.length || 0,
        preview: imagePreview ? imagePreview.substring(0, 50) + '...' : 'null'
      })
      
      if (imagePreview && imagePreview.trim()) {
        const cleanImageUrl = imagePreview.trim()
        
        // Para imágenes base64, verificar el tamaño y validar formato
        if (cleanImageUrl.startsWith('data:image/')) {
          // Verificar que sea una imagen válida
          const isValidBase64 = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(cleanImageUrl)
          if (isValidBase64) {
            // Verificar tamaño aproximado
            const sizeInBytes = (cleanImageUrl.length * 3) / 4
            const sizeInMB = sizeInBytes / (1024 * 1024)
            
            console.log('🔍 Validando imagen base64:', {
              longitud: cleanImageUrl.length,
              tamañoMB: sizeInMB.toFixed(2),
              tamañoBytes: sizeInBytes,
              preview: cleanImageUrl.substring(0, 100) + '...'
            })
            
            // PostgreSQL TEXT puede manejar hasta 1GB, pero usemos un límite práctico de 5MB
            if (sizeInBytes > 5 * 1024 * 1024) { // 5MB límite
              console.error('🔴 Imagen demasiado grande para almacenar en base de datos:', sizeInMB.toFixed(2), 'MB')
              toast.error(`La imagen es demasiado grande (${sizeInMB.toFixed(2)} MB). Máximo permitido: 5MB`)
              // No incluir la imagen si es muy grande
            } else {
              console.log('✅ Imagen válida, incluyendo en datos a guardar')
              console.log('📦 Longitud total del base64:', cleanImageUrl.length, 'caracteres')
              recipeData.image_url = cleanImageUrl
            }
          } else {
            console.warn('🔴 Formato de imagen base64 no válido:', cleanImageUrl.substring(0, 50))
          }
        } else if (cleanImageUrl.startsWith('http') || cleanImageUrl.startsWith('/')) {
          // URLs normales
          console.log('✅ URL de imagen válida, incluyendo en datos')
          recipeData.image_url = cleanImageUrl
        } else {
          console.warn('🔴 URL de imagen no válida:', cleanImageUrl.substring(0, 50))
        }
      }
      
      // Siempre incluir el color (campo agregado en la migración 20241015000001)
      if (selectedColor) {
        recipeData.color = selectedColor
      }

      // Log del tamaño de la imagen para debugging
      if (recipeData.image_url) {
        const imageSize = (recipeData.image_url.length * 3) / 4 / 1024 // Tamaño en KB
        console.log('🖼️ Imagen preparada para guardar:', {
          tamaño: `${imageSize.toFixed(2)} KB`,
          longitud: `${recipeData.image_url.length} caracteres`,
          formato: recipeData.image_url.substring(0, 50) + '...',
          esBase64: recipeData.image_url.startsWith('data:image/')
        })
      } else {
        console.log('🖼️ No hay imagen para guardar')
      }
      
      console.log('Datos de receta preparados:', {
        ...recipeData,
        // Mostrar solo los primeros y últimos caracteres de la imagen para no saturar el log
        image_url: recipeData.image_url ? 
          `${recipeData.image_url.substring(0, 100)}...${recipeData.image_url.substring(recipeData.image_url.length - 50)}` : 
          'null'
      })

      let recipe
      if (isEditMode && recipeId) {
        // Actualizar receta existente
        console.log('=== INICIANDO ACTUALIZACIÓN ===')
        console.log('Recipe ID:', recipeId)
        console.log('Datos a actualizar:', JSON.stringify(recipeData, null, 2))
        console.log('Validando recipeId:', typeof recipeId, recipeId)
        
        // Validar que el ID sea válido
        if (!recipeId || recipeId === 'undefined' || recipeId === 'null') {
          throw new Error('ID de receta inválido')
        }

        // Log específico antes de la actualización
        console.log('🔄 Enviando datos a Supabase:', {
          recipeId,
          hasImage: !!recipeData.image_url,
          imageLength: recipeData.image_url?.length || 0,
          imageStart: recipeData.image_url ? recipeData.image_url.substring(0, 30) + '...' : 'null'
        })

        let updateResult = await DatabaseService.supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', recipeId)
          .select()
          .single()

        // Si hay error, intentar diferentes estrategias
        if (updateResult.error) {
          console.error('=== ERROR INICIAL EN UPDATE ===')
          console.error('Error específico:', updateResult.error)
          console.error('Código de error:', updateResult.error.code)
          console.error('Mensaje:', updateResult.error.message)
          console.error('Detalles:', updateResult.error.details)
          console.error('Hint:', updateResult.error.hint)
          
          let retryRecipeData = { ...recipeData }
          
          // Estrategia 1: Si hay problema con el campo color, quitarlo
          const errorMsg = updateResult.error.message.toLowerCase()
          if (errorMsg.includes('color') || errorMsg.includes('column') || updateResult.error.code === '42703') {
            console.warn('🟡 Campo "color" no existe o tiene problemas, reintentando sin él...')
            const { color, ...dataWithoutColor } = retryRecipeData
            retryRecipeData = dataWithoutColor
            
            updateResult = await DatabaseService.supabase
              .from('recipes')
              .update(retryRecipeData)
              .eq('id', recipeId)
              .select()
              .single()
          }
          
          // Estrategia 2: Manejar errores específicos de imagen
          if (updateResult.error && retryRecipeData.image_url) {
            const errorMessage = updateResult.error.message.toLowerCase()
            const isImageError = errorMessage.includes('image') || 
                                errorMessage.includes('too large') || 
                                errorMessage.includes('size') ||
                                errorMessage.includes('text') ||
                                errorMessage.includes('index row requires') || // Error específico del índice
                                errorMessage.includes('maximum size is') || // Error del índice
                                updateResult.error.code === '53400' || // PostgreSQL error code for value too long
                                updateResult.error.code === '54000' // PostgreSQL error code for program limit exceeded
            
            if (isImageError) {
              console.warn('🔴 Error específico de imagen detectado:', updateResult.error.message)
              
              // Explicar el error específico al usuario
              if (errorMessage.includes('index row requires') || errorMessage.includes('maximum size is')) {
                console.error('🚨 Error de índice detectado - el campo image_url tiene un índice que no permite datos grandes')
                toast.error('Error: La base de datos no permite imágenes tan grandes debido a una configuración de índice. Contacta al administrador para solucionarlo.')
              } else {
                console.warn('🔴 Error de imagen general, reintentando sin imagen...')
              }
              
              const { image_url, ...dataWithoutImage } = retryRecipeData
              retryRecipeData = dataWithoutImage
              
              updateResult = await DatabaseService.supabase
                .from('recipes')
                .update(retryRecipeData)
                .eq('id', recipeId)
                .select()
                .single()
              
              // Informar al usuario que la imagen no se pudo guardar
              if (!updateResult.error) {
                if (errorMessage.includes('index row requires') || errorMessage.includes('maximum size is')) {
                  toast.warning('La receta se actualizó, pero la imagen no se pudo guardar debido a un problema técnico en la base de datos.')
                } else {
                  toast.warning('La receta se actualizó, pero la imagen no pudo guardarse. Intenta con una imagen más pequeña.')
                }
              }
            } else {
              console.warn('🟡 Error no relacionado con imagen, manteniendo imagen en el retry')
            }
          }
          
          // Si todavía hay error después de los reintentos
          if (updateResult.error) {
            console.error('=== ERROR FINAL EN UPDATE ===')
            console.error('Error específico:', updateResult.error)
            console.error('Código de error:', updateResult.error.code)
            console.error('Mensaje:', updateResult.error.message)
            console.error('Detalles:', updateResult.error.details)
            console.error('Hint:', updateResult.error.hint)
            console.error('=======================')
            throw new Error(`Error actualizando receta: ${updateResult.error.message}`)
          }
        } else {
          console.log('✅ Actualización exitosa sin errores')
        }
        
        const { data, error } = updateResult
        
        console.log('✅ Receta actualizada exitosamente:', {
          id: data?.id,
          name: data?.name,
          hasImage: !!data?.image_url,
          imageLength: data?.image_url?.length || 0,
          imagePreview: data?.image_url ? data.image_url.substring(0, 100) + '...' : 'null',
          // Comparar con lo que enviamos
          enviamosImagen: !!recipeData.image_url,
          longitudEnviada: recipeData.image_url?.length || 0
        })
        recipe = data
      } else {
        // Crear nueva receta
        recipe = await DatabaseService.createRecipe(recipeData)
      }

      if (!recipe?.id) {
        throw new Error(isEditMode ? 'No se pudo actualizar la receta' : 'No se pudo crear la receta')
      }

      // Manejar ingredientes
      if (isEditMode) {
        // En modo edición, primero eliminar ingredientes existentes
        const { error: deleteError } = await DatabaseService.supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipe.id)

        if (deleteError) {
          console.error('Error eliminando ingredientes existentes:', deleteError)
          throw deleteError
        }
      }

      // Añadir ingredientes con unit_id
      const ingredientsToInsert = ingredients.map(ing => {
        console.log('Procesando ingrediente:', ing)
        
        // Validar campos requeridos
        if (!ing.article_id) {
          throw new Error(`Ingrediente "${ing.name}" no tiene article_id`)
        }
        if (!ing.quantity || ing.quantity <= 0) {
          throw new Error(`Ingrediente "${ing.name}" no tiene cantidad válida`)
        }
        
        return {
          recipe_id: recipe.id,
          article_id: ing.article_id,
          quantity: ing.quantity,
          unit: ing.unit || 'unidad',
          unit_id: ing.unit_id || null,
          cost: ing.cost || 0
        }
      })

      console.log('Ingredientes a insertar:', ingredientsToInsert)

      const { error: ingredientsError } = await DatabaseService.supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingredientsError) {
        console.error('=== ERROR EN INGREDIENTES ===')
        console.error('Error específico:', ingredientsError)
        console.error('Código de error:', ingredientsError.code)
        console.error('Mensaje:', ingredientsError.message)
        console.error('Detalles:', ingredientsError.details)
        console.error('=============================')
        throw new Error(`Error añadiendo ingredientes: ${ingredientsError.message}`)
      }

      // Manejar costos adicionales
      if (isEditMode) {
        // En modo edición, primero eliminar costos adicionales existentes
        const { error: deleteCostsError } = await DatabaseService.supabase
          .from('recipe_additional_costs')
          .delete()
          .eq('recipe_id', recipe.id)

        if (deleteCostsError) {
          console.error('Error eliminando costos adicionales existentes:', deleteCostsError)
          // No lanzar error aquí, solo log
        }
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

      // Verificar que la imagen se guardó correctamente
      if (recipe?.id) {
        try {
          console.log('🔍 Verificando imagen en BD después de guardar...')
          const { data: verifyData, error: verifyError } = await DatabaseService.supabase
            .from('recipes')
            .select('id, name, image_url')
            .eq('id', recipe.id)
            .single()
          
          if (!verifyError && verifyData) {
            const expectedImage = !!recipeData.image_url
            const actualImage = !!verifyData.image_url
            
            console.log('🔍 Verificación final de imagen:', {
              id: verifyData.id,
              name: verifyData.name,
              esperábamosImagen: expectedImage,
              tieneImagenEnBD: actualImage,
              longitudEnBD: verifyData.image_url?.length || 0,
              imagenCoincide: expectedImage === actualImage ? '✅ SÍ' : '❌ NO',
              previewBD: verifyData.image_url ? verifyData.image_url.substring(0, 50) + '...' : 'null'
            })
            
            if (expectedImage && !actualImage) {
              console.error('🚨 PROBLEMA: Se envió imagen pero no se guardó en BD!')
            } else if (expectedImage && actualImage) {
              console.log('✅ ÉXITO: Imagen guardada correctamente en BD')
            }
          } else {
            console.error('Error verificando imagen:', verifyError)
          }
        } catch (verifyErr) {
          console.warn('No se pudo verificar la imagen guardada:', verifyErr)
        }
      }
      
      toast.success(isEditMode ? 'Receta actualizada exitosamente' : 'Receta creada exitosamente')
      
      // Resetear la variable de cambios antes de navegar
      setHasUnsavedChanges(false)
      
      router.push('/recipes')
    } catch (error: any) {
      console.error(isEditMode ? 'Error actualizando receta:' : 'Error creando receta:', error)
      
      // Mostrar mensaje de error más específico si es posible
      let errorMessage = isEditMode ? 'Error al actualizar la receta' : 'Error al crear la receta'
      
      if (error?.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Ya existe una receta con este nombre'
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Error de referencia: verifique que todos los datos seleccionados sean válidos'
        } else if (error.message.includes('not-null')) {
          errorMessage = 'Faltan datos obligatorios. Verifique que todos los campos requeridos estén completos.'
        } else if (error.message.includes('invalid input')) {
          errorMessage = 'Datos inválidos. Verifique que todos los valores sean correctos.'
        }
      }
      
      toast.error(errorMessage)
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

  // Función auxiliar para comparar arrays de objetos
  const compareIngredients = (current: any[], original: any[]): boolean => {
    // Si no hay ingredientes originales, considerar que hay cambios si hay ingredientes actuales
    if (!original || original.length === 0) {
      return current && current.length > 0
    }
    
    // Si no hay ingredientes actuales, pero había originales, hay cambios
    if (!current || current.length === 0) {
      return original.length > 0
    }
    
    // Si las longitudes son diferentes, hay cambios
    if (current.length !== original.length) return true
    
    // Comparar cada ingrediente
    return current.some((currentIng) => {
      if (!currentIng || !currentIng.article_id) return true
      
      // Buscar el ingrediente correspondiente en los originales por article_id
      const originalIng = original.find(orig => orig.article_id === currentIng.article_id)
      
      if (!originalIng) return true // Nuevo ingrediente añadido
      
      // Comparar campos relevantes, manejando diferentes estructuras de datos
      const articleIdMatch = currentIng.article_id === originalIng.article_id
      const quantityMatch = Math.abs((currentIng.quantity || 0) - (originalIng.quantity || 0)) < 0.01
      const unitMatch = (currentIng.unit || '') === (originalIng.unit || '')
      const unitIdMatch = (currentIng.unit_id || '') === (originalIng.unit_id || '')
      const costMatch = Math.abs((currentIng.cost || 0) - (originalIng.cost || 0)) < 0.01
      
      return !(articleIdMatch && quantityMatch && unitMatch && unitIdMatch && costMatch)
    }) || original.some((originalIng) => {
      // Verificar si se eliminó algún ingrediente original
      return !current.find(curr => curr.article_id === originalIng.article_id)
    })
  }

  const compareAdditionalCosts = (current: any[], original: any[]): boolean => {
    // Si no hay costos originales, considerar que hay cambios si hay costos actuales
    if (!original || original.length === 0) {
      return current && current.length > 0 && current.some(cost => cost.amount > 0)
    }
    
    // Si no hay costos actuales, pero había originales, hay cambios
    if (!current || current.length === 0) {
      return original.length > 0
    }
    
    // Si las longitudes son diferentes, hay cambios
    if (current.length !== original.length) return true
    
    return current.some((currentCost, index) => {
      const originalCost = original[index]
      if (!originalCost) return true
      
      return (
        (currentCost.name || '') !== (originalCost.name || '') ||
        Math.abs((currentCost.amount || 0) - (originalCost.amount || 0)) > 0.01
      )
    })
  }

  // Detectar si hay cambios en el formulario
  const hasChanges = (): boolean => {
    if (isEditMode) {
      // En modo edición, si no hay datos originales aún, no hay cambios
      if (!originalData) {
        console.log('Modo edición pero no hay datos originales cargados aún')
        return false
      }

      // Comparaciones básicas - verificar cada campo individualmente
      const nameChanged = recipeName !== originalData.name
      const categoryChanged = category !== originalData.category
      const servingsChanged = servings !== originalData.servings
      const hoursChanged = preparationHours !== originalData.preparationHours
      const minutesChanged = preparationMinutes !== originalData.preparationMinutes
      const difficultyChanged = difficulty !== originalData.difficulty
      const descriptionChanged = description !== originalData.description
      const imageChanged = imagePreview !== originalData.imagePreview
      
      // Debug para imagen
      if (imageChanged || process.env.NODE_ENV === 'development') {
        console.log('🖼️ Comparación de imagen:', {
          currentImage: imagePreview ? imagePreview.substring(0, 50) + '...' : 'null',
          originalImage: originalData.imagePreview ? originalData.imagePreview.substring(0, 50) + '...' : 'null',
          imageChanged,
          currentLength: imagePreview?.length || 0,
          originalLength: originalData.imagePreview?.length || 0
        })
      }
      const colorChanged = selectedColor !== originalData.selectedColor
      const priceChanged = Math.abs(sellingPrice - originalData.sellingPrice) > 0.01
      // Comparar instrucciones normalizando espacios y saltos de línea
      const currentInstructionsText = instructions.map(i => i.description).join('\n').trim()
      const originalInstructionsText = (originalData.instructions || '').trim()
      const instructionsChanged = currentInstructionsText !== originalInstructionsText
      
      const basicChanges = (
        nameChanged ||
        categoryChanged ||
        servingsChanged ||
        hoursChanged ||
        minutesChanged ||
        difficultyChanged ||
        descriptionChanged ||
        imageChanged ||
        colorChanged ||
        priceChanged ||
        instructionsChanged
      )

      // Comparar ingredientes
      const ingredientsChanged = compareIngredients(ingredients, originalData.ingredients)
      
      // Comparar costos adicionales
      const costsChanged = compareAdditionalCosts(additionalCosts, originalData.additionalCosts)

      const hasAnyChanges = basicChanges || ingredientsChanged || costsChanged
      
      // Debug logging detallado
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Detección de cambios ===')
        if (basicChanges) {
          console.log('🔴 Cambios básicos detectados:')
          if (nameChanged) console.log('  - Nombre:', recipeName, '!==', originalData.name)
          if (categoryChanged) console.log('  - Categoría:', category, '!==', originalData.category)
          if (servingsChanged) console.log('  - Raciones:', servings, '!==', originalData.servings)
          if (hoursChanged) console.log('  - Horas:', preparationHours, '!==', originalData.preparationHours)
          if (minutesChanged) console.log('  - Minutos:', preparationMinutes, '!==', originalData.preparationMinutes)
          if (difficultyChanged) console.log('  - Dificultad:', difficulty, '!==', originalData.difficulty)
          if (descriptionChanged) console.log('  - Descripción:', description, '!==', originalData.description)
          if (imageChanged) console.log('  - Imagen:', imagePreview, '!==', originalData.imagePreview)
          if (colorChanged) console.log('  - Color:', selectedColor, '!==', originalData.selectedColor)
          if (priceChanged) console.log('  - Precio:', sellingPrice, '!==', originalData.sellingPrice)
          if (instructionsChanged) {
            console.log('  - Instrucciones cambiadas:')
            console.log('    Actual:', JSON.stringify(currentInstructionsText))
            console.log('    Original:', JSON.stringify(originalInstructionsText))
            console.log('    Longitud actual:', currentInstructionsText.length)
            console.log('    Longitud original:', originalInstructionsText.length)
          }
        } else {
          console.log('✅ Sin cambios básicos')
        }
        console.log('Ingredientes cambiados:', ingredientsChanged)
        console.log('Costos cambiados:', costsChanged)
        console.log('Hay cambios:', hasAnyChanges)
        console.log('========================')
      }

      return hasAnyChanges
    } else {
      // En modo creación, verificar si hay datos ingresados
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
  const canSave = useMemo(() => {
    if (isEditMode) {
      // En modo edición, usar la variable hasUnsavedChanges
      const result = hasUnsavedChanges && initialDataLoaded
      
      if (process.env.NODE_ENV === 'development') {
        console.log('canSave - Modo edición:')
        console.log('  - initialDataLoaded:', initialDataLoaded)
        console.log('  - hasUnsavedChanges:', hasUnsavedChanges)
        console.log('  - resultado canSave:', result)
      }
      
      return result
    }

    // En modo creación, usar validación básica
    const basicValidation = !!(
      recipeName.trim() &&
      ingredients.length > 0 &&
      ingredients.some(ing => ing.quantity > 0)
    )
    
    return basicValidation
  }, [
    isEditMode,
    hasUnsavedChanges,
    initialDataLoaded,
    recipeName,
    ingredients
  ])

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
              {recipeName || (isEditMode ? 'Edita la receta' : 'Crea una receta')}
            </h2>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || !canSave}
              className={cn(
                "px-6 py-3 rounded-lg font-semibold transition-colors",
                canSave && !loading
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
              title={isEditMode && !hasChanges() && originalData ? "No hay cambios para guardar" : ""}
            >
              {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Guardar')}
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
          <h1 className="text-3xl font-semibold mb-6" id="main-title">
            {isEditMode ? 'Edita la receta' : 'Crea una receta'}
          </h1>

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
