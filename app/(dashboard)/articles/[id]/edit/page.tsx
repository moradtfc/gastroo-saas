"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Search, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DatabaseService, type Supplier, type Unit, type FoodCategory, type Allergen } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EditArticlePageProps {
  params: {
    id: string
  }
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([])
  const [allergens, setAllergens] = useState<Allergen[]>([])
  
  const [selectedColor, setSelectedColor] = useState("#FF9D3D")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [categorySearch, setCategorySearch] = useState("")
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [unitSearch, setUnitSearch] = useState("")
  const [showAllUnits, setShowAllUnits] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isLowStockAlertEnabled, setIsLowStockAlertEnabled] = useState(false)
  const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false)
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    costPerUnit: "",
    unitId: "",
    supplierId: "",
    notes: "",
    sku: "",
    allergens: [] as string[],
    minStock: "",
    currentStock: "",
  })

  const titleRef = useRef<HTMLHeadingElement>(null)

  const COLOR_PALETTE = [
    "#999999", "#991B4F", "#E31E24", "#F26649", "#FF9D3D",
    "#FFD500", "#A67C52", "#5C4A3C", "#2D7A3E", "#00C853",
    "#00BFA5", "#2979FF", "#448AFF", "#7C4DFF", "#E91E63"
  ]

  const ALLERGEN_TAG_COLORS = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-yellow-100 text-yellow-700 border-yellow-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-pink-100 text-pink-700 border-pink-200"
  ]

  // Agregar estilos globales para el z-index del modal
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = `
        [data-slot="dialog-overlay"] {
          z-index: 99998 !important;
        }
        [data-slot="dialog-content"] {
          z-index: 99999 !important;
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [])

  useEffect(() => {
    void loadData()
    void loadArticle()

    // Scroll listener para mostrar título en header
    const handleScroll = () => {
      if (titleRef.current) {
        const titlePosition = titleRef.current.getBoundingClientRect()
        setScrolled(titlePosition.bottom < 80)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [params.id])

  const loadData = async () => {
    try {
      const [suppliersData, unitsData, categoriesData, allergensData] = await Promise.all([
        DatabaseService.getSuppliers(),
        DatabaseService.getUnits(),
        DatabaseService.getFoodCategories(),
        DatabaseService.getAllergens(),
      ])

      setSuppliers(suppliersData || [])
      setUnits(unitsData || [])
      setFoodCategories(categoriesData || [])
      setAllergens(allergensData || [])
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast.error("Error al cargar datos")
    }
  }

  const loadArticle = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await DatabaseService.supabase
        .from('articles')
        .select(`
          *,
          suppliers (
            id,
            name,
            category,
            phone,
            email
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Artículo no encontrado')

      // Cargar los alérgenos del artículo
      const { data: articleAllergens } = await DatabaseService.supabase
        .from('article_allergens')
        .select('allergen_id, allergens(id, name, description, severity_level)')
        .eq('article_id', params.id)

      const loadedAllergens = articleAllergens?.map((aa: any) => aa.allergens).filter(Boolean) || []

      setFormData({
        name: data.name || "",
        description: data.description || "",
        categoryId: data.food_category_id || "",
        costPerUnit: data.cost_per_unit?.toString() || "",
        unitId: data.unit_id || "",
        supplierId: data.supplier_id || "",
        notes: data.notes || "",
        sku: data.sku || "",
        allergens: loadedAllergens.map((a: any) => a.id),
        minStock: data.min_stock?.toString() || "",
        currentStock: data.current_stock?.toString() || "",
      })

      setSelectedAllergens(loadedAllergens)
      setIsLowStockAlertEnabled(!!data.min_stock && data.min_stock > 0)
      
      if (data.suppliers) {
        setSelectedSupplier(data.suppliers)
      }

      if (data.image_url) {
        setUploadedImage(data.image_url)
      }
    } catch (error: any) {
      console.error('Error loading article:', error)
      toast.error('Error al cargar artículo')
      router.push('/articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!formData.unitId || !formData.categoryId) {
        toast.error("Selecciona la unidad y la categoría del artículo")
        setSaving(false)
        return
      }

      const selectedUnitInfo = units.find((unit) => unit.id === formData.unitId)
      if (!selectedUnitInfo) {
        toast.error("No se encontró la unidad seleccionada")
        setSaving(false)
        return
      }

      const baseUnitForCategory = units.find(
        (unit) =>
          unit.category_id === selectedUnitInfo.category_id &&
          unit.base_unit === true
      )

      const selectedCategory = foodCategories.find((c) => c.id === formData.categoryId)
      const articleData: any = {
        name: formData.name,
        description: formData.description || null,
        food_category_id: formData.categoryId,
        unit_id: formData.unitId,
        default_unit_id: baseUnitForCategory?.id || formData.unitId,
        cost_per_unit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
        current_stock: formData.currentStock ? parseFloat(formData.currentStock) : 0,
        min_stock: isLowStockAlertEnabled && formData.minStock ? parseFloat(formData.minStock) : null,
        sku: formData.sku || null,
        supplier_id: formData.supplierId || null,
        category: selectedCategory?.name || null,
        unit: selectedUnitInfo.symbol || selectedUnitInfo.name,
        notes: formData.notes || null,
      }

      // Actualizar el artículo
      const { error: updateError } = await DatabaseService.supabase
        .from('articles')
        .update(articleData)
        .eq('id', params.id)

      if (updateError) throw updateError

      // Actualizar alérgenos
      if (formData.allergens.length > 0 || selectedAllergens.length > 0) {
        try {
          // Primero eliminar los alérgenos existentes
          await DatabaseService.supabase
            .from('article_allergens')
            .delete()
            .eq('article_id', params.id)

          // Luego insertar los nuevos
          if (formData.allergens.length > 0) {
            const allergenRecords = formData.allergens.map(allergenId => ({
              article_id: params.id,
              allergen_id: allergenId
            }))

            await DatabaseService.supabase
              .from('article_allergens')
              .insert(allergenRecords)
          }
        } catch (allergenError) {
          console.error("Error actualizando alérgenos:", allergenError)
        }
      }

      toast.success("Artículo actualizado exitosamente")
      router.push("/articles")
    } catch (error: any) {
      console.error("Error actualizando artículo:", error)
      toast.error(`Error al actualizar artículo: ${error?.message || 'desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCostChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '')
    const parts = sanitized.split('.')
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized
    handleInputChange('costPerUnit', finalValue)
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData(prev => ({ ...prev, supplierId: supplier.id }))
    setIsSupplierModalOpen(false)
  }

  const handleCategorySelect = (categoryId: string) => {
    handleInputChange("categoryId", categoryId)
    setCategorySearch("")
    setShowAllCategories(false)
  }

  const handleUnitSelect = (unitId: string) => {
    handleInputChange("unitId", unitId)
    setUnitSearch("")
    setShowAllUnits(false)
  }

  const handleAllergenToggle = (allergen: Allergen) => {
    setSelectedAllergens(prev => {
      const exists = prev.find(a => a.id === allergen.id)
      if (exists) {
        return prev.filter(a => a.id !== allergen.id)
      } else {
        return [...prev, allergen]
      }
    })
  }

  const handleSaveAllergens = () => {
    setFormData(prev => ({ ...prev, allergens: selectedAllergens.map(a => a.id) }))
    setIsAllergenModalOpen(false)
  }

  const removeAllergen = (allergenId: string) => {
    setSelectedAllergens(prev => prev.filter(a => a.id !== allergenId))
    setFormData(prev => ({ ...prev, allergens: prev.allergens.filter(id => id !== allergenId) }))
  }

  const getAllergenColor = (index: number) => {
    return ALLERGEN_TAG_COLORS[index % ALLERGEN_TAG_COLORS.length]
  }

  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return ''
    const trimmed = name.trim()
    return trimmed.substring(0, 2).toUpperCase()
  }

  const filteredCategories = foodCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const displayedCategories = categorySearch || showAllCategories ? filteredCategories : filteredCategories.slice(0, 4)

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(unitSearch.toLowerCase())
  )

  const displayedUnits = unitSearch || showAllUnits ? filteredUnits : filteredUnits.slice(0, 6)

  const selectedUnit = units.find(u => u.id === formData.unitId)
  const selectedCategory = foodCategories.find(c => c.id === formData.categoryId)

  const initials = getInitials(formData.name)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Modal de selección de alérgenos */}
      <Dialog open={isAllergenModalOpen} onOpenChange={setIsAllergenModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Seleccionar Alérgenos</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {allergens.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-4">🌾</div>
                <p className="text-gray-600">No hay alérgenos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {allergens.map((allergen) => {
                  const isSelected = selectedAllergens.some(a => a.id === allergen.id)
    return (
                    <div
                      key={allergen.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50",
                        isSelected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-200"
                      )}
                      onClick={() => handleAllergenToggle(allergen)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌾</span>
                          <span className="font-medium text-gray-900">{allergen.name}</span>
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

          <DialogFooter className="border-t pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAllergenModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveAllergens}
            >
              Guardar ({selectedAllergens.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de selección de proveedor */}
      <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Seleccionar Proveedor</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {suppliers.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-gray-600 mb-2">
                  Registra tus proveedores para empezar a asociarlos a tus artículos
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSupplierModalOpen(false)
                  }}
                  className="mt-4"
                >
                  Ir a Proveedores
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50",
                      selectedSupplier?.id === supplier.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    )}
                    onClick={() => handleSupplierSelect(supplier)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{supplier.name}</p>
                        {supplier.category && (
                          <p className="text-sm text-gray-600 mt-1">{supplier.category}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          {supplier.phone && <span>📞 {supplier.phone}</span>}
                          {supplier.email && <span>✉️ {supplier.email}</span>}
                        </div>
                      </div>
                      {selectedSupplier?.id === supplier.id && (
                        <div className="ml-2">
                          <span className="text-blue-600 text-xl">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsSupplierModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de imagen/color */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ zIndex: 99999 }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Editar imagen del artículo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Imagen */}
            <div>
              <h4 className="font-semibold mb-4">Imagen</h4>
              <label htmlFor="image-upload" className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-blue-500 hover:bg-gray-50 cursor-pointer transition-all">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
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
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {uploadedImage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadedImage(null)}
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
                {COLOR_PALETTE.map((color) => (
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

            {/* Preview */}
            <div>
              <h4 className="font-semibold mb-4">Vista previa</h4>
              <div className="bg-gray-100 rounded-xl p-6 text-center">
                <div
                  className="w-full max-w-[300px] h-[200px] mx-auto mb-4 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ background: uploadedImage ? 'transparent' : selectedColor }}
                >
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-white text-5xl font-semibold">{initials}</span>
                  )}
                </div>
                <div className="text-blue-600 font-semibold text-sm">Listo</div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-5 mt-6">
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsImageModalOpen(false)}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay full-screen que cubre todo incluyendo el sidebar */}
      <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">

        {/* Contenedor principal */}
        <div className="max-w-[900px] mx-auto bg-white min-h-screen">
          {/* Header sticky */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex-1">
                <Link href="/articles">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    ✕
                  </Button>
                </Link>
              </div>
              <div className="flex-1 text-center">
                <h2
                  className={cn(
                    "text-lg font-semibold text-gray-900 transition-opacity duration-300",
                    scrolled ? "opacity-100" : "opacity-0"
                  )}
                >
                  Editar artículo
                </h2>
        </div>
              <div className="flex-1 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-6">
            <h1 ref={titleRef} className="text-3xl font-semibold mb-6">
              Editar artículo
            </h1>

            {/* Banner informativo */}
            <div className="bg-blue-50 rounded-lg px-4 py-4 flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xl">📝</span>
                <span className="text-sm text-blue-900">Estás editando un artículo existente</span>
              </div>
              <Link href="/articles" className="text-sm text-blue-600 font-semibold hover:underline">
                Cancelar
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Sección Información */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Información</h2>

                {/* Nombre y descripción con imagen */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 space-y-4">
                      <Input
                      placeholder="Nombre"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-12 text-base border border-gray-300 rounded-lg"
                        required
                    />
                    <Textarea
                      placeholder="Descripción"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="min-h-[120px] text-base resize-none border border-gray-300 rounded-lg"
                    />
                  </div>

                  {/* Imagen placeholder */}
                  <div className="w-40">
                    <div
                      className="w-40 h-[120px] rounded-lg flex items-center justify-center text-white text-4xl font-semibold mb-2 cursor-pointer hover:opacity-80 transition-all overflow-hidden"
                      style={{ background: uploadedImage ? 'transparent' : selectedColor }}
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      {uploadedImage ? (
                        <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div
                      className="text-blue-600 font-semibold text-sm text-center cursor-pointer hover:underline"
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      Editar
                    </div>
                  </div>
                </div>

                {/* Área de subida de imágenes */}
                <label htmlFor="main-image-upload" className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-all">
                    {uploadedImage ? (
                      <div className="relative">
                        <img src={uploadedImage} alt="Vista previa" className="max-h-32 mx-auto rounded-lg" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            setUploadedImage(null)
                          }}
                          className="mt-3"
                        >
                          Eliminar imagen
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                        <div className="text-sm text-gray-600">
                          Arrastra y suelta las imágenes aquí,{" "}
                          <span className="text-blue-600 font-semibold hover:underline">
                            súbelas haciendo clic
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </label>
                <input
                  id="main-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </section>

              <hr className="border-gray-200" />

              {/* Sección Categorización */}
              <section>
                <h2 className="text-xl font-semibold mb-2">Categorización</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Agrupa los artículos para organizar mejor tu inventario y facilitar la búsqueda de productos.
                </p>

                <div className="space-y-0 border-t border-gray-200">
                  <div className="py-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">📁</span>
                      <span className="text-base font-medium">Categorías</span>
                    </div>

                    {/* Categoría seleccionada */}
                    {selectedCategory && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedCategory.icon}</span>
                            <div>
                              <p className="font-semibold text-blue-900">{selectedCategory.name}</p>
                              {selectedCategory.description && (
                                <p className="text-xs text-blue-700">{selectedCategory.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInputChange("categoryId", "")}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Cambiar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Campo de búsqueda */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Buscar categoría..."
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value)
                          if (e.target.value) setShowAllCategories(true)
                        }}
                        className="pl-10 h-12 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Lista de categorías */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {displayedCategories.map((category) => (
                        <div
                          key={category.id}
                          className={cn(
                            "p-3 border rounded-lg cursor-pointer transition-all",
                            formData.categoryId === category.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{category.icon}</span>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          {category.description && (
                            <p className="text-xs text-gray-500 mt-1 ml-7">{category.description}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {!categorySearch && !showAllCategories && filteredCategories.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCategories(true)}
                        className="mt-2 text-blue-600 font-semibold text-sm hover:underline"
                      >
                        Ver todas las categorías ({filteredCategories.length})
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Sección Unidad del Artículo */}
              <section>
                <h2 className="text-xl font-semibold mb-2">Unidad del Artículo</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Selecciona la unidad de medida para este artículo.
                </p>

                <div className="space-y-0 border-t border-gray-200">
                  <div className="py-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">📏</span>
                      <span className="text-base font-medium">Unidades de medida</span>
                    </div>

                    {/* Unidad seleccionada */}
                    {selectedUnit && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold text-blue-900">{selectedUnit.name}</p>
                              <p className="text-xs text-blue-700">Símbolo: {selectedUnit.symbol}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInputChange("unitId", "")}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Cambiar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Campo de búsqueda */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Buscar unidad..."
                        value={unitSearch}
                        onChange={(e) => {
                          setUnitSearch(e.target.value)
                          if (e.target.value) setShowAllUnits(true)
                        }}
                        className="pl-10 h-12 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Lista de unidades */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {displayedUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className={cn(
                            "p-3 border rounded-lg cursor-pointer transition-all",
                            formData.unitId === unit.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          )}
                          onClick={() => handleUnitSelect(unit.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{unit.name}</span>
                              <span className="text-sm text-gray-500">({unit.symbol})</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!unitSearch && !showAllUnits && filteredUnits.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setShowAllUnits(true)}
                        className="mt-2 text-blue-600 font-semibold text-sm hover:underline"
                      >
                        Ver todas las unidades ({filteredUnits.length})
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Sección Costos */}
              <section>
                <h2 className="text-xl font-semibold mb-2">Costos</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Define el costo y otros datos del artículo.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      {selectedUnit ? `Costo por ${selectedUnit.symbol}` : 'Costo por unidad'}
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formData.costPerUnit}
                      onChange={(e) => handleCostChange(e.target.value)}
                      className="h-12 border border-gray-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">SKU</label>
                    <Input
                      type="text"
                      placeholder="Código de producto"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className="h-12 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Sección Stock */}
              <section>
                <h2 className="text-xl font-semibold mb-2">Stock</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Añade el Stock que tienes actualmente del artículo
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Stock actual</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={formData.currentStock}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^0-9.]/g, '')
                          const parts = sanitized.split('.')
                          const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized
                          handleInputChange("currentStock", finalValue)
                        }}
                        className="flex-1 h-12 border border-gray-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium min-w-[80px] text-center">
                        {selectedUnit ? selectedUnit.symbol : 'unidad'}
                      </div>
                    </div>
                  </div>

                  {/* Switch de alerta por stock bajo */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isLowStockAlertEnabled ? "bg-blue-100" : "bg-gray-200"
                      )}>
                        <span className="text-lg">{isLowStockAlertEnabled ? "🔔" : "🔕"}</span>
                      </div>
                      <div>
                        <label htmlFor="low-stock-alert" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                          Configurar alerta por Stock bajo
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">Recibe notificaciones cuando el stock sea insuficiente</p>
                      </div>
                    </div>
                    <Switch
                      id="low-stock-alert"
                      checked={isLowStockAlertEnabled}
                      onCheckedChange={setIsLowStockAlertEnabled}
                    />
                  </div>

                  {/* Campo de stock mínimo cuando el switch está activado */}
                  {isLowStockAlertEnabled && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <label className="text-sm font-semibold text-blue-900">Stock mínimo configurable</label>
                      </div>
                      <p className="text-xs text-blue-700">Define el nivel mínimo de stock antes de recibir una alerta</p>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={formData.minStock}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/[^0-9.]/g, '')
                            const parts = sanitized.split('.')
                            const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized
                            handleInputChange("minStock", finalValue)
                          }}
                          className="flex-1 h-12 border border-blue-200 rounded-lg bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 font-semibold min-w-[80px] text-center">
                          {selectedUnit ? selectedUnit.symbol : 'unidad'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Sección Alérgenos */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">Alérgenos</h2>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    onClick={() => setIsAllergenModalOpen(true)}
                  >
                    Añadir
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Si el artículo es un alimento, puedes añadir los alérgenos en este apartado
                </p>

                {/* Lista de alérgenos seleccionados */}
                {selectedAllergens.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAllergens.map((allergen, index) => (
                      <div
                        key={allergen.id}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2",
                          getAllergenColor(index)
                        )}
                      >
                        <span>{allergen.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAllergen(allergen.id)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                    No hay alérgenos añadidos
            </div>
                )}
              </section>

              <hr className="border-gray-200" />

              {/* Sección Proveedores */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">Proveedores</h2>
                    <Button
                    type="button" 
                    variant="outline" 
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    onClick={() => setIsSupplierModalOpen(true)}
                  >
                    Añadir
                    </Button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Añade tu proveedor principal para este artículo
                </p>

                {/* Proveedor seleccionado */}
                {selectedSupplier && (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{selectedSupplier.name}</p>
                        {selectedSupplier.category && (
                          <p className="text-sm text-gray-600 mt-1">{selectedSupplier.category}</p>
                        )}
                        <div className="flex flex-col gap-1 mt-2 text-sm text-gray-500">
                          {selectedSupplier.phone && <span>📞 {selectedSupplier.phone}</span>}
                          {selectedSupplier.email && <span>✉️ {selectedSupplier.email}</span>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSupplier(null)
                          setFormData(prev => ({ ...prev, supplierId: "" }))
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Quitar
                      </Button>
                    </div>
                    </div>
                )}

                {!selectedSupplier && (
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                    No hay proveedor seleccionado
              </div>
                )}
              </section>

            </form>
          </div>
        </div>
      </div>
    </>
  )
}
