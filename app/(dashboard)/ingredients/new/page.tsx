"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export default function NewIngredientPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    supplier: "",
    description: "",
    allergens: [] as string[],
    minStock: "",
    currentStock: "",
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

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
    setLoading(true)

    try {
      const ingredientData = {
        name: formData.name,
        category: formData.category || undefined,
        unit: formData.unit,
        cost_per_unit: formData.price ? parseFloat(formData.price) : undefined,
        current_stock: formData.currentStock ? parseFloat(formData.currentStock) : 0,
        min_stock: formData.minStock ? parseFloat(formData.minStock) : 0,
        allergens: formData.allergens.length > 0 ? formData.allergens : undefined,
        supplier_id: formData.supplier || undefined,
      }

      await DatabaseService.createIngredient(ingredientData)
      toast.success("Ingrediente creado exitosamente")
      router.push("/ingredients")
    } catch (error) {
      console.error('Error creating ingredient:', error)
      toast.error("Error al crear ingrediente")
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ingredients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Nuevo Ingrediente
          </h1>
          <p className="text-muted-foreground">Añade un nuevo ingrediente a tu inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-primary">Información Básica</CardTitle>
                <CardDescription className="text-base">Datos principales del ingrediente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                      Nombre del Ingrediente *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ej: Tomate cherry"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-semibold text-foreground">
                      Categoría *
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-sm font-semibold text-foreground">
                      Precio *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="unit" className="text-sm font-semibold text-foreground">
                      Unidad de Medida *
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("unit", value)}>
                      <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
                        <SelectValue placeholder="Selecciona la unidad" />
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

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción adicional del ingrediente..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className="border-2 focus:border-primary transition-colors resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-primary">Información del Proveedor</CardTitle>
                <CardDescription className="text-base">Datos de contacto y suministro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="supplier" className="text-sm font-semibold text-foreground">
                      Proveedor *
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        handleInputChange("supplier", value)
                      }}
                    >
                      <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{supplier.name}</span>
                              <span className="text-xs text-muted-foreground">{supplier.email || supplier.phone}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="currentStock" className="text-sm font-semibold text-foreground">
                      Stock Inicial *
                    </Label>
                    <Input
                      id="currentStock"
                      type="number"
                      placeholder="0"
                      value={formData.currentStock}
                      onChange={(e) => handleInputChange("currentStock", e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="minStock" className="text-sm font-semibold text-foreground">
                      Stock Mínimo
                    </Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="0"
                      value={formData.minStock}
                      onChange={(e) => handleInputChange("minStock", e.target.value)}
                      className="h-12 border-2 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allergens */}
          <div className="space-y-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
                <CardTitle className="text-xl font-semibold text-primary">Alérgenos</CardTitle>
                <CardDescription className="text-base">Selecciona los alérgenos presentes</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {allergenOptions.map((allergen) => (
                    <div
                      key={allergen}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={allergen}
                        checked={formData.allergens.includes(allergen)}
                        onCheckedChange={(checked) => handleAllergenChange(allergen, checked as boolean)}
                        className="border-2"
                      />
                      <Label htmlFor={allergen} className="text-sm font-medium cursor-pointer">
                        {allergen}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
              >
                <Save className="h-5 w-5" />
                {loading ? "Guardando..." : "Guardar Ingrediente"}
              </Button>
              <Link href="/ingredients">
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 hover:bg-muted/50 transition-colors font-medium bg-transparent"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
