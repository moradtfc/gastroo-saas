"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { useRouter, useSearchParams } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

const allergenOptions = [
  "Gluten",
  "Crustáceos",
  "Huevos",
  "Pescado",
  "Cacahuetes",
  "Soja",
  "Lácteos",
  "Frutos secos",
  "Apio",
  "Mostaza",
  "Sésamo",
  "Sulfitos",
  "Altramuces",
  "Moluscos",
]

const unitOptions = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "L", label: "Litros (L)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "unidad", label: "Unidad" },
  { value: "docena", label: "Docena" },
  { value: "bandeja", label: "Bandeja" },
  { value: "paquete", label: "Paquete" },
]

const categoryOptions = [
  "Verduras",
  "Frutas",
  "Carnes",
  "Pescados",
  "Lácteos",
  "Cereales",
  "Legumbres",
  "Aceites",
  "Especias",
  "Condimentos",
  "Bebidas",
  "Otros",
]

interface EditIngredientPageProps {
  params: {
    id: string
  }
}

export default function EditIngredientPage({ params }: EditIngredientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ingredient, setIngredient] = useState<any>(null)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    supplier: "",
    allergens: [] as string[],
    minStock: "",
    currentStock: "",
  })

  // Determine back URL based on where user came from
  const getBackUrl = () => {
    const from = searchParams.get('from')
    if (from === 'list') {
      return '/ingredients'
    }
    return `/ingredients/${params.id}`
  }

  useEffect(() => {
    loadIngredient()
    loadSuppliers()
  }, [params.id])

  const loadIngredient = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('ingredients')
        .select(`
          *,
          suppliers (
            id,
            name
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Ingrediente no encontrado')

      setIngredient(data)
      setFormData({
        name: data.name || "",
        category: data.category || "",
        price: data.cost_per_unit?.toString() || "",
        unit: data.unit || "",
        supplier: data.supplier_id || "",
        allergens: data.allergens || [],
        minStock: data.min_stock?.toString() || "",
        currentStock: data.current_stock?.toString() || "",
      })
    } catch (error: any) {
      console.error('Error loading ingredient:', error)
      setError(error.message || 'Error al cargar ingrediente')
      toast.error('Error al cargar ingrediente')
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await DatabaseService.getSuppliers()
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData = {
        name: formData.name,
        category: formData.category || null,
        unit: formData.unit,
        cost_per_unit: formData.price ? parseFloat(formData.price) : null,
        current_stock: formData.currentStock ? parseFloat(formData.currentStock) : 0,
        min_stock: formData.minStock ? parseFloat(formData.minStock) : 0,
        allergens: formData.allergens.length > 0 ? formData.allergens : null,
        supplier_id: formData.supplier || null,
      }

      const { error } = await DatabaseService.supabase
        .from('ingredients')
        .update(updateData)
        .eq('id', params.id)

      if (error) throw error

      toast.success("Ingrediente actualizado exitosamente")
      router.push(getBackUrl())
    } catch (error: any) {
      console.error('Error updating ingredient:', error)
      toast.error("Error al actualizar ingrediente")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      allergens: checked ? [...prev.allergens, allergen] : prev.allergens.filter((a) => a !== allergen),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !ingredient) {
    return (
      <div className="p-4 sm:p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2">
                <Button onClick={loadIngredient} className="w-full">
                  Reintentar
                </Button>
                <Link href={getBackUrl()}>
                  <Button variant="outline" className="w-full">
                    Volver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <BackButton href={getBackUrl()} />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Editar Ingrediente
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Modifica la información del ingrediente
                </p>
              </div>
            </div>
          </div>

          {/* Form Content - Responsive Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form - Takes 2 columns on XL screens */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Package className="h-5 w-5 text-primary" />
                    Información Básica
                  </CardTitle>
                  <CardDescription>
                    Detalles principales del ingrediente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre del Ingrediente *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ej: Tomate cherry"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">
                        Categoría
                      </Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        Precio por Unidad *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-sm font-medium">
                        Unidad de Medida *
                      </Label>
                      <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-sm font-medium">
                      Proveedor
                    </Label>
                    <Select
                      value={formData.supplier}
                      onValueChange={(value) => handleInputChange("supplier", value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock" className="text-sm font-medium">
                        Stock Actual
                      </Label>
                      <Input
                        id="currentStock"
                        type="number"
                        placeholder="0"
                        value={formData.currentStock}
                        onChange={(e) => handleInputChange("currentStock", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock" className="text-sm font-medium">
                        Stock Mínimo
                      </Label>
                      <Input
                        id="minStock"
                        type="number"
                        placeholder="0"
                        value={formData.minStock}
                        onChange={(e) => handleInputChange("minStock", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Allergens */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Alérgenos</CardTitle>
                  <CardDescription>
                    Selecciona los alérgenos presentes en este ingrediente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allergenOptions.map((allergen) => (
                      <div key={allergen} className="flex items-center space-x-2">
                        <Checkbox
                          id={allergen}
                          checked={formData.allergens.includes(allergen)}
                          onCheckedChange={(checked) => handleAllergenChange(allergen, !!checked)}
                        />
                        <Label
                          htmlFor={allergen}
                          className="text-sm leading-none cursor-pointer"
                        >
                          {allergen}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Panel - Sidebar on XL screens */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Acciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                    <Link href={getBackUrl()}>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 font-medium"
                      >
                        Cancelar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Información Rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creado:</span>
                      <span className="font-medium">
                        {new Date(ingredient.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Actualizado:</span>
                      <span className="font-medium">
                        {new Date(ingredient.updated_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}