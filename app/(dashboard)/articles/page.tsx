"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, Filter, ChevronDown, Plus, MoreVertical, ArrowUpDown, Download, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DatabaseService, type FoodCategory, type Unit } from "@/lib/database"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'

interface Article {
  id: string
  name: string
  category: string | null
  cost_per_unit: number
  current_stock: number
  unit: string
  image_url?: string | null
  color?: string | null
  sku?: string | null
  suppliers?: {
    name: string
  } | null
}

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [openActionsMenu, setOpenActionsMenu] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [sortBy, setSortBy] = useState<"price" | "name" | "stock" | null>(null)
  const [openSortMenu, setOpenSortMenu] = useState(false)
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false)
  const [quickCreateData, setQuickCreateData] = useState({
    name: "",
    categoryId: "",
    unitId: "",
    costPerUnit: "",
    currentStock: ""
  })
  const [categorySearch, setCategorySearch] = useState("")
  const [unitSearch, setUnitSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const articlesPerPage = 12
  const menuRef = useRef<HTMLDivElement>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadArticles()
    loadCategories()
    loadUnits()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setOpenActionsMenu(false)
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setOpenSortMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const data = await DatabaseService.getArticles()
      setArticles(data || [])
    } catch (error) {
      console.error("Error loading articles:", error)
      toast.error("Error al cargar artículos")
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await DatabaseService.getFoodCategories()
      setFoodCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadUnits = async () => {
    try {
      const data = await DatabaseService.getUnits()
      setUnits(data || [])
    } catch (error) {
      console.error("Error loading units:", error)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleSaveCategories = () => {
    setIsCategoryModalOpen(false)
  }

  const handleClearCategories = () => {
    setSelectedCategories([])
    setIsCategoryModalOpen(false)
  }

  const toggleSortOrder = (type: "price" | "name" | "stock") => {
    if (sortBy === type) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else if (sortOrder === "desc") {
        setSortBy(null)
        setSortOrder(null)
      }
    } else {
      setSortBy(type)
      setSortOrder("asc")
    }
  }

  const handleQuickCreate = async () => {
    if (!quickCreateData.name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!quickCreateData.categoryId) {
      toast.error("La categoría es obligatoria")
      return
    }
    if (!quickCreateData.unitId) {
      toast.error("La unidad es obligatoria")
      return
    }
    if (!quickCreateData.costPerUnit || parseFloat(quickCreateData.costPerUnit) <= 0) {
      toast.error("El precio es obligatorio y debe ser mayor a 0")
      return
    }
    if (!quickCreateData.currentStock || parseFloat(quickCreateData.currentStock) < 0) {
      toast.error("El stock es obligatorio y no puede ser negativo")
      return
    }

    try {
      const selectedCategory = foodCategories.find(c => c.id === quickCreateData.categoryId)
      const selectedUnit = units.find(u => u.id === quickCreateData.unitId)

      const articleData: any = {
        name: quickCreateData.name,
        food_category_id: quickCreateData.categoryId,
        unit_id: quickCreateData.unitId,
        default_unit_id: quickCreateData.unitId,
        cost_per_unit: parseFloat(quickCreateData.costPerUnit),
        current_stock: parseFloat(quickCreateData.currentStock),
        category: selectedCategory?.name || undefined,
        unit: selectedUnit?.symbol || selectedUnit?.name || undefined
      }

      await DatabaseService.createIngredient(articleData)
      toast.success("Artículo creado exitosamente")
      setIsQuickCreateModalOpen(false)
      setQuickCreateData({ name: "", categoryId: "", unitId: "", costPerUnit: "", currentStock: "" })
      setCategorySearch("")
      setUnitSearch("")
      loadArticles()
    } catch (error) {
      console.error("Error creando artículo:", error)
      toast.error("Error al crear artículo")
    }
  }

  const handleSortSelection = (type: "price" | "name" | "stock") => {
    if (sortBy === type) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else if (sortOrder === "desc") {
        setSortBy(null)
        setSortOrder(null)
      }
    } else {
      setSortBy(type)
      setSortOrder("asc")
    }
    setOpenSortMenu(false)
  }

  // Función para exportar colección
  const handleExportCollection = async () => {
    try {
      setIsProcessing(true)

      if (articles.length === 0) {
        toast.error("No hay artículos para exportar")
        return
      }

      // Preparar datos para exportar con todos los campos de la tabla articles
      const exportData = articles.map(article => ({
        'ID': article.id,
        'Nombre': article.name,
        'Categoría': article.category || '',
        'SKU': article.sku || '',
        'Costo por unidad': article.cost_per_unit || 0,
        'Stock actual': article.current_stock || 0,
        'Unidad': article.unit || '',
        'Proveedor': article.suppliers?.name || '',
        'Color': article.color || '',
        'URL de imagen': article.image_url || ''
      }))

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Artículos')

      // Generar archivo y descargar
      const fileName = `inventario_${new Date().toISOString().split('T')[0]}.${exportFormat}`

      if (exportFormat === 'csv') {
        XLSX.writeFile(wb, fileName, { bookType: 'csv' })
      } else {
        XLSX.writeFile(wb, fileName, { bookType: 'xlsx' })
      }

      toast.success(`Inventario exportado exitosamente (${articles.length} artículos)`)
      setIsExportModalOpen(false)
    } catch (error) {
      console.error('Error exportando colección:', error)
      toast.error('Error al exportar colección')
    } finally {
      setIsProcessing(false)
    }
  }

  // Función para descargar plantilla
  const handleDownloadTemplate = () => {
    try {
      // Crear instrucciones
      const instructions = [
        ['INSTRUCCIONES PARA IMPORTAR TU INVENTARIO'],
        [''],
        ['1. CATEGORÍAS DISPONIBLES:'],
        ...foodCategories.map(cat => [`   ${cat.icon || '📁'} ${cat.name}`]),
        [''],
        ['2. UNIDADES DISPONIBLES:'],
        ...units.map(unit => [`   ${unit.symbol} - ${unit.name}`]),
        [''],
        ['3. REGLAS IMPORTANTES:'],
        ['   - El nombre del artículo es OBLIGATORIO'],
        ['   - La categoría debe ser exactamente una de las listadas arriba'],
        ['   - La unidad debe ser el SÍMBOLO exacto de una de las listadas arriba'],
        ['   - El costo debe ser un número mayor a 0'],
        ['   - El stock debe ser un número mayor o igual a 0'],
        ['   - SKU es opcional'],
        [''],
        ['4. Completa la tabla de abajo con tus artículos:'],
        [''],
      ]

      // Crear datos de ejemplo
      const exampleData = [
        {
          'Nombre': 'Ejemplo: Tomate Cherry',
          'Categoría': foodCategories[0]?.name || 'Verduras',
          'SKU': 'TOM-001',
          'Costo por unidad': '2.50',
          'Stock actual': '100',
          'Unidad': units[0]?.symbol || 'kg'
        }
      ]

      // Crear libro de trabajo
      const wb = XLSX.utils.book_new()

      // Crear hoja de instrucciones
      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions)
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'LEER PRIMERO')

      // Crear hoja de datos
      const wsData = XLSX.utils.json_to_sheet(exampleData)
      XLSX.utils.book_append_sheet(wb, wsData, 'Artículos')

      // Descargar archivo
      XLSX.writeFile(wb, 'plantilla_importar_inventario.xlsx')
      toast.success('Plantilla descargada exitosamente')
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      toast.error('Error al descargar plantilla')
    }
  }

  // Función para manejar la selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea un archivo .xlsx
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Por favor selecciona un archivo Excel (.xlsx)')
        return
      }
      setImportFile(file)
    }
  }

  // Función para procesar e importar el archivo
  const handleImportCollection = async () => {
    if (!importFile) {
      toast.error('Por favor selecciona un archivo')
      return
    }

    try {
      setIsProcessing(true)

      // Leer archivo
      const data = await importFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })

      // Obtener la hoja de Artículos
      const sheetName = workbook.SheetNames.find(name => name === 'Artículos') || workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      if (jsonData.length === 0) {
        toast.error('El archivo no contiene datos')
        return
      }

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Procesar cada fila
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const rowNumber = i + 2 // +2 porque empieza en 1 y tiene header

        try {
          // Validar nombre (obligatorio)
          if (!row['Nombre'] || row['Nombre'].toString().trim() === '') {
            throw new Error(`Fila ${rowNumber}: El nombre es obligatorio`)
          }

          // Validar categoría (obligatoria)
          if (!row['Categoría'] || row['Categoría'].toString().trim() === '') {
            throw new Error(`Fila ${rowNumber}: La categoría es obligatoria`)
          }

          // Buscar categoría
          const category = foodCategories.find(
            c => c.name.toLowerCase() === row['Categoría'].toString().toLowerCase()
          )
          if (!category) {
            throw new Error(`Fila ${rowNumber}: Categoría "${row['Categoría']}" no encontrada`)
          }

          // Validar unidad (obligatoria)
          if (!row['Unidad'] || row['Unidad'].toString().trim() === '') {
            throw new Error(`Fila ${rowNumber}: La unidad es obligatoria`)
          }

          // Buscar unidad
          const unit = units.find(
            u => u.symbol.toLowerCase() === row['Unidad'].toString().toLowerCase()
          )
          if (!unit) {
            throw new Error(`Fila ${rowNumber}: Unidad "${row['Unidad']}" no encontrada`)
          }

          // Validar costo (obligatorio y debe ser > 0)
          const cost = parseFloat(row['Costo por unidad']?.toString() || '0')
          if (!row['Costo por unidad'] || isNaN(cost) || cost <= 0) {
            throw new Error(`Fila ${rowNumber}: El costo debe ser un número mayor a 0`)
          }

          // Validar stock (obligatorio y debe ser >= 0)
          const stock = parseFloat(row['Stock actual']?.toString() || '0')
          if (row['Stock actual'] === undefined || row['Stock actual'] === null || isNaN(stock) || stock < 0) {
            throw new Error(`Fila ${rowNumber}: El stock debe ser un número mayor o igual a 0`)
          }

          // Buscar unidad base para la categoría de la unidad
          const baseUnitForCategory = units.find(
            u => u.category_id === unit.category_id && u.base_unit === true
          )

          // Crear artículo
          const articleData: any = {
            name: row['Nombre'].toString().trim(),
            food_category_id: category.id,
            unit_id: unit.id,
            default_unit_id: baseUnitForCategory?.id || unit.id,
            cost_per_unit: cost,
            current_stock: stock,
            sku: row['SKU']?.toString().trim() || undefined,
            category: category.name,
            unit: unit.symbol
          }

          await DatabaseService.createIngredient(articleData)
          successCount++
        } catch (error: any) {
          errorCount++
          errors.push(error.message)
          console.error(`Error en fila ${rowNumber}:`, error)
        }
      }

      // Mostrar resultados
      if (successCount > 0) {
        toast.success(`${successCount} artículo(s) importado(s) exitosamente`)
        loadArticles() // Recargar lista
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} artículo(s) con errores. Revisa la consola para más detalles.`)
        console.error('Errores de importación:', errors)
      }

      // Cerrar modal y limpiar
      setIsImportModalOpen(false)
      setImportFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error importando colección:', error)
      toast.error('Error al importar colección')
    } finally {
      setIsProcessing(false)
    }
  }

  const getSortLabel = () => {
    if (!sortBy) return "Ordenar por"
    
    if (sortBy === "price") {
      return sortOrder === "asc" ? "Precio: Menor a Mayor" : "Precio: Mayor a Menor"
    } else if (sortBy === "name") {
      return sortOrder === "asc" ? "A-Z" : "Z-A"
    } else if (sortBy === "stock") {
      return sortOrder === "asc" ? "Stock: Menor a Mayor" : "Stock: Mayor a Menor"
    }
    return "Ordenar por"
  }

  const filteredCategoriesForQuickCreate = foodCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredUnitsForQuickCreate = units.filter(unit =>
    unit.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(unitSearch.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredArticles.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredArticles.map((a) => a.id))
    }
  }

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleEdit = (article: Article) => {
    router.push(`/articles/${article.id}/edit`)
    setOpenMenuId(null)
  }

  const handleView = (article: Article) => {
    router.push(`/articles/${article.id}`)
    setOpenMenuId(null)
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este artículo?")) {
      return
    }

    try {
      setDeletingId(articleId)
      
      // Eliminar referencias relacionadas
      await DatabaseService.supabase
        .from('recipe_ingredients')
        .delete()
        .eq('article_id', articleId)

      await DatabaseService.supabase
        .from('purchase_items')
        .delete()
        .eq('article_id', articleId)

      await DatabaseService.supabase
        .from('article_allergens')
        .delete()
        .eq('article_id', articleId)

      // Eliminar el artículo
      const { error } = await DatabaseService.supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      toast.success("Artículo eliminado correctamente")
      loadArticles()
      setOpenMenuId(null)
    } catch (error) {
      console.error("Error eliminando artículo:", error)
      toast.error("Error al eliminar artículo")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedItems.length} artículo(s)?`)) {
      return
    }

    try {
      for (const articleId of selectedItems) {
        // Eliminar referencias relacionadas
        await DatabaseService.supabase
          .from('recipe_ingredients')
          .delete()
          .eq('article_id', articleId)

        await DatabaseService.supabase
          .from('purchase_items')
          .delete()
          .eq('article_id', articleId)

        await DatabaseService.supabase
          .from('article_allergens')
          .delete()
          .eq('article_id', articleId)

        // Eliminar el artículo
        await DatabaseService.supabase
          .from('articles')
          .delete()
          .eq('id', articleId)
      }

      toast.success(`${selectedItems.length} artículo(s) eliminado(s) correctamente`)
      setSelectedItems([])
      loadArticles()
    } catch (error) {
      console.error("Error eliminando artículos:", error)
      toast.error("Error al eliminar artículos")
    }
  }

  const handleEditMultiple = () => {
    toast.info("Función de edición múltiple en desarrollo")
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    const words = name.trim().split(" ")
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getColorFromName = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-red-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getArticleDisplayStyle = (article: Article) => {
    // Si hay imagen, no mostrar color de fondo (la imagen tiene prioridad)
    if (article.image_url) {
      return {
        backgroundImage: `url(${article.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'transparent'
      }
    }
    
    // Si hay color guardado, usarlo
    if (article.color) {
      return {
        backgroundColor: article.color
      }
    }
    
    // Fallback al color generado por nombre
    return {}
  }

  const getArticleDisplayClass = (article: Article) => {
    // Si hay imagen, no usar clases de color
    if (article.image_url) {
      return "w-10 h-10 rounded flex items-center justify-center text-white text-sm font-semibold"
    }
    
    // Si hay color guardado, usar clase genérica
    if (article.color) {
      return "w-10 h-10 rounded flex items-center justify-center text-white text-sm font-semibold"
    }
    
    // Fallback al color generado por nombre
    return `w-10 h-10 rounded flex items-center justify-center text-white text-sm font-semibold ${getColorFromName(article.name)}`
  }

  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtrar por categorías si hay alguna seleccionada
      if (selectedCategories.length > 0) {
        const selectedCategoryNames = foodCategories
          .filter(cat => selectedCategories.includes(cat.id))
          .map(cat => cat.name)
        
        const matchesCategory = article.category && selectedCategoryNames.includes(article.category)
        return matchesSearch && matchesCategory
      }
      
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortOrder === null || sortBy === null) return 0
      
      if (sortBy === "price") {
        const priceA = a.cost_per_unit || 0
        const priceB = b.cost_per_unit || 0
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA
      } else if (sortBy === "name") {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        return sortOrder === "asc" 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      } else if (sortBy === "stock") {
        const stockA = a.current_stock || 0
        const stockB = b.current_stock || 0
        return sortOrder === "asc" ? stockA - stockB : stockB - stockA
      }
      
      return 0
    })

  // Lógica de paginación
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage)
  const startIndex = (currentPage - 1) * articlesPerPage
  const endIndex = startIndex + articlesPerPage
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategories, sortBy, sortOrder])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
    {/* Modal de Exportar Colección */}
    <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Exportar Colección
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Podrás descargar todo tu inventario actualizado en formato .xlsx o .csv
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de exportación
            </label>
            <Select
              value={exportFormat}
              onValueChange={(value: "xlsx" | "csv") => setExportFormat(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Total de artículos:</strong> {articles.length}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExportCollection}
            disabled={isProcessing || articles.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Importar Colección */}
    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Importar Colección
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 font-medium mb-2">
              📋 Descarga nuestra plantilla para importar tu inventario
            </p>
            <p className="text-sm text-yellow-800">
              Lee las instrucciones detenidamente para que tu inventario se importe correctamente.
            </p>
          </div>

          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </Button>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subir Inventario
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Solo se aceptan archivos .xlsx con la estructura de la plantilla
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />

            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              {importFile ? (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Haz clic para seleccionar un archivo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo archivos .xlsx
                  </p>
                </div>
              )}
            </label>

            {importFile && (
              <button
                onClick={() => {
                  setImportFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Quitar archivo
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsImportModalOpen(false)
              setImportFile(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImportCollection}
            disabled={!importFile || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? "Importando..." : "Subir Inventario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de creación rápida */}
    <Dialog open={isQuickCreateModalOpen} onOpenChange={setIsQuickCreateModalOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Crear artículo rápidamente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del artículo <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ej: Tomate cherry"
              value={quickCreateData.name}
              onChange={(e) => setQuickCreateData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Buscar categoría..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {categorySearch === "" || filteredCategoriesForQuickCreate.length > 0 ? (
                (categorySearch === "" ? foodCategories : filteredCategoriesForQuickCreate).map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setQuickCreateData(prev => ({ ...prev, categoryId: cat.id }))
                      setCategorySearch("")
                    }}
                    className={cn(
                      "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2",
                      quickCreateData.categoryId === cat.id && "bg-blue-50 border-l-4 border-blue-600"
                    )}
                  >
                    <span>{cat.icon || "📁"}</span>
                    <span className="text-gray-900">{cat.name}</span>
                    {quickCreateData.categoryId === cat.id && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">No se encontraron categorías</div>
              )}
        </div>
      </div>

          {/* Unidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Buscar unidad..."
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {unitSearch === "" || filteredUnitsForQuickCreate.length > 0 ? (
                (unitSearch === "" ? units : filteredUnitsForQuickCreate).map((unit) => (
                  <div
                    key={unit.id}
                    onClick={() => {
                      setQuickCreateData(prev => ({ ...prev, unitId: unit.id }))
                      setUnitSearch("")
                    }}
                    className={cn(
                      "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                      quickCreateData.unitId === unit.id && "bg-blue-50 border-l-4 border-blue-600"
                    )}
                  >
                    <span className="text-gray-900">{unit.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({unit.symbol})</span>
                    {quickCreateData.unitId === unit.id && (
                      <span className="ml-2 text-blue-600">✓</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">No se encontraron unidades</div>
              )}
            </div>
      </div>

          {/* Precio y Stock en una fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio (€) <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={quickCreateData.costPerUnit}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^0-9.]/g, '')
                  setQuickCreateData(prev => ({ ...prev, costPerUnit: sanitized }))
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={quickCreateData.unitId 
                    ? `Ej: 10 ${units.find(u => u.id === quickCreateData.unitId)?.symbol || ''}`
                    : "0"
                  }
                  value={quickCreateData.currentStock}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9.]/g, '')
                    setQuickCreateData(prev => ({ ...prev, currentStock: sanitized }))
                  }}
                />
                {quickCreateData.unitId && quickCreateData.currentStock && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {units.find(u => u.id === quickCreateData.unitId)?.symbol}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsQuickCreateModalOpen(false)
              setQuickCreateData({ name: "", categoryId: "", unitId: "", costPerUnit: "", currentStock: "" })
              setCategorySearch("")
              setUnitSearch("")
            }}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleQuickCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            Crear artículo
                </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de selección de categorías */}
    <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Filtrar por Categorías</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {foodCategories.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-600">No hay categorías disponibles</p>
            </div>
          ) : (
              <div className="grid grid-cols-2 gap-3">
                {foodCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id)
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
                          <span className="text-xl">{category.icon || "📁"}</span>
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
                Aplicar ({selectedCategories.length})
                            </Button>
                        </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Banner de información */}
        {showBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                i
              </div>
              <span className="text-gray-700">
                <strong>¿Ya tienes artículos?</strong> Sube un catálogo para empezar.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors cursor-pointer"
              >
                Importar colección
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          )}

        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className={cn(
              "px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors",
              selectedCategories.length > 0 && "border-blue-500 bg-blue-50"
            )}
          >
            Categoría
            {selectedCategories.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {selectedCategories.length}
              </span>
            )}
          </button>

          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setOpenSortMenu(!openSortMenu)}
              className={cn(
                "px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer",
                sortBy && "border-blue-500 bg-blue-50"
              )}
            >
              <ArrowUpDown size={18} />
              {getSortLabel()}
              <ChevronDown size={18} />
            </button>

            {openSortMenu && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => handleSortSelection("price")}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    sortBy === "price" && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Precio {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                <button
                  onClick={() => handleSortSelection("name")}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    sortBy === "name" && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Alfabéticamente {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                <button
                  onClick={() => handleSortSelection("stock")}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    sortBy === "stock" && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Stock {sortBy === "stock" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                {sortBy && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setSortBy(null)
                        setSortOrder(null)
                        setOpenSortMenu(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600 text-sm transition-colors cursor-pointer"
                    >
                      Limpiar orden
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={actionsMenuRef}>
            <button 
              onClick={() => setOpenActionsMenu(!openActionsMenu)}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              Acciones
              <ChevronDown size={18} />
            </button>

            {openActionsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setOpenActionsMenu(false)
                    setIsImportModalOpen(true)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer"
                >
                  Importar colección
                </button>
                <button
                  onClick={() => {
                    setOpenActionsMenu(false)
                    setIsExportModalOpen(true)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer"
                >
                  Exportar colección
                </button>
              </div>
            )}
          </div>

          <Link href="/articles/new">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm cursor-pointer">
              Crear artículo
            </button>
          </Link>
        </div>

        {/* Tabla de artículos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Enlace para crear artículo rápidamente */}
          <div className="border-b border-gray-200 p-4">
            <button 
              onClick={() => setIsQuickCreateModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium transition-colors cursor-pointer"
            >
              <Plus size={18} />
              Crear artículo rápidamente
            </button>
          </div>

          {/* Encabezados de tabla */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={
                  filteredArticles.length > 0 &&
                  selectedItems.length === filteredArticles.length
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="col-span-4">Nombre</div>
            <div className="col-span-3">Categoría</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Stock</div>
          </div>

          {/* Filas de artículos */}
          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay artículos</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "No se encontraron artículos con ese nombre"
                  : "Comienza creando tu primer artículo"}
              </p>
              <Link href="/articles/new">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  <Plus className="inline-block mr-2" size={18} />
                  Crear artículo
                </button>
              </Link>
            </div>
          ) : (
            paginatedArticles.map((article) => (
              <div
                key={article.id}
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 items-center transition-colors"
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(article.id)}
                    onChange={() => toggleSelectItem(article.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
    </div>

                <div className="col-span-4 flex items-center gap-3">
                  <div
                    className={getArticleDisplayClass(article)}
                    style={getArticleDisplayStyle(article)}
                  >
                    {!article.image_url && getInitials(article.name)}
                  </div>
                  <Link href={`/articles/${article.id}`}>
                    <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                      {article.name}
                    </span>
                  </Link>
                </div>

                <div className="col-span-3 text-gray-700">
                  {article.category || (
                    <span className="text-gray-400 italic">Sin categoría</span>
                  )}
                </div>

                <div className="col-span-2 text-gray-700">
                  €{(article.cost_per_unit || 0).toFixed(2)}/{article.unit || "ud"}
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-gray-700">
                    {typeof article.current_stock === "number"
                      ? `${article.current_stock.toLocaleString()} ${article.unit || "ud"}`
                      : "Sin stock"}
                  </span>
                  <div
                    className="relative"
                    ref={openMenuId === article.id ? menuRef : null}
                  >
                    <button
                      onClick={() => toggleMenu(article.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {openMenuId === article.id && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <button
                          onClick={() => handleView(article)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer"
                        >
                          Ver detalles
                        </button>
                        <button
                          onClick={() => handleEdit(article)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          disabled={deletingId === article.id}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {deletingId === article.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Controles de paginación */}
          {filteredArticles.length > articlesPerPage && (
            <div className="mt-6 mb-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Anterior
              </button>
              
              {/* Números de página */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Información de resultados */}
        {filteredArticles.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredArticles.length)} de {filteredArticles.length} artículo(s)
          </div>
        )}

        {/* Barra inferior de selección múltiple */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">
                  {selectedItems.length} seleccionado{selectedItems.length > 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  Desmarcar todo
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteMultiple}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm cursor-pointer"
                >
                  Eliminar artículos
                </button>
                <button
                  onClick={handleEditMultiple}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm cursor-pointer"
                >
                  Editar artículos
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}
