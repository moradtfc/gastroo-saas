"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Plus, Trash2, Calculator, AlertTriangle, ChefHat } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

const categoryOptions = [
  "Entrantes",
  "Principales", 
  "Postres",
  "Bebidas",
  "Aperitivos",
  "Sopas",
  "Ensaladas",
  "Otros"
]

const difficultyOptions = [
  "Fácil",
  "Intermedio", 
  "Avanzado"
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

interface EditRecipePageProps {
  params: {
    id: string
  }
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recipe, setRecipe] = useState<any>(null)
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    servings: "",
    cookingTime: "",
    difficulty: "",
    salePrice: "",
    instructions: "",
    recipeIngredients: [] as any[]
  })

  // Determine back URL based on where user came from
  const getBackUrl = () => {
    const from = searchParams.get('from')
    if (from === 'list') {
      return '/recipes'
    }
    return `/recipes/${params.id}`
  }

  useEffect(() => {
    loadRecipe()
    loadIngredients()
  }, [params.id])

  const loadRecipe = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            quantity,
            unit,
            cost,
            article_id,
            articles (
              id,
              name,
              unit,
              cost_per_unit
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Receta no encontrada')

      setRecipe(data)
      setFormData({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "",
        servings: data.servings?.toString() || "",
        cookingTime: data.cooking_time?.toString() || "",
        difficulty: data.difficulty || "",
        salePrice: data.sale_price?.toString() || "",
        instructions: data.instructions || "",
        recipeIngredients: data.recipe_ingredients || []
      })
    } catch (error: any) {
      console.error('Error loading recipe:', error)
      setError(error.message || 'Error al cargar receta')
      toast.error('Error al cargar receta')
    } finally {
      setLoading(false)
    }
  }

  const loadIngredients = async () => {
    try {
      const data = await DatabaseService.getIngredients()
      setIngredients(data || [])
    } catch (error) {
      console.error('Error loading ingredients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update recipe basic info
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        servings: formData.servings ? parseInt(formData.servings) : null,
        cooking_time: formData.cookingTime ? parseInt(formData.cookingTime) : null,
        difficulty: formData.difficulty || null,
        sale_price: formData.salePrice ? parseFloat(formData.salePrice) : null,
        instructions: formData.instructions || null,
      }

      const { error: recipeError } = await DatabaseService.supabase
        .from('recipes')
        .update(updateData)
        .eq('id', params.id)

      if (recipeError) throw recipeError

      // Delete existing recipe ingredients
      const { error: deleteError } = await DatabaseService.supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', params.id)

      if (deleteError) throw deleteError

      // Insert updated recipe ingredients
      if (formData.recipeIngredients.length > 0) {
        const ingredientsToInsert = formData.recipeIngredients.map(ri => ({
          recipe_id: params.id,
          article_id: ri.article_id || ri.articles?.id,
          quantity: ri.quantity,
          unit: ri.unit,
          cost: ri.cost || 0
        }))

        const { error: insertError } = await DatabaseService.supabase
          .from('recipe_ingredients')
          .insert(ingredientsToInsert)

        if (insertError) throw insertError
      }

      toast.success("Receta actualizada exitosamente")
      router.push(getBackUrl())
    } catch (error: any) {
      console.error('Error updating recipe:', error)
      toast.error("Error al actualizar receta")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addIngredient = () => {
    const newIngredient = {
      id: `temp_${Date.now()}`,
      article_id: "",
      quantity: "",
      unit: "g",
      cost: 0,
      articles: null
    }
    setFormData(prev => ({
      ...prev,
      recipeIngredients: [...prev.recipeIngredients, newIngredient]
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipeIngredients: prev.recipeIngredients.filter((_, i) => i !== index)
    }))
  }

  const updateIngredient = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      recipeIngredients: prev.recipeIngredients.map((ing, i) => {
        if (i === index) {
          const updated = { ...ing, [field]: value }
          
          // If ingredient is changed, update cost calculation
          if (field === 'article_id') {
            const selectedIngredient = ingredients.find(ingredient => ingredient.id === value)
            if (selectedIngredient) {
              updated.articles = selectedIngredient
              updated.unit = selectedIngredient.unit
              updated.cost = (parseFloat(updated.quantity) || 0) * (selectedIngredient.cost_per_unit || 0)
            }
          }
          
          // If quantity is changed, recalculate cost
          if (field === 'quantity' && updated.articles?.cost_per_unit) {
            updated.cost = (parseFloat(value.toString()) || 0) * updated.articles.cost_per_unit
          }
          
          return updated
        }
        return ing
      })
    }))
  }

  const totalCost = formData.recipeIngredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)
  const costPerServing = formData.servings ? totalCost / parseInt(formData.servings) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !recipe) {
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
                <Button onClick={loadRecipe} className="w-full">
                  Reintentar
                </Button>
                <BackButton href={getBackUrl()} className="w-full" />
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
          {/* Header */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <BackButton href={getBackUrl()} />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Editar Receta
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Modifica la información de la receta
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <ChefHat className="h-5 w-5 text-primary" />
                    Información Básica
                  </CardTitle>
                  <CardDescription>
                    Detalles principales de la receta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre de la Receta *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ej: Paella Valenciana"
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

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe la receta..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="servings" className="text-sm font-medium">
                        Raciones
                      </Label>
                      <Input
                        id="servings"
                        type="number"
                        placeholder="4"
                        value={formData.servings}
                        onChange={(e) => handleInputChange("servings", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cookingTime" className="text-sm font-medium">
                        Tiempo (min)
                      </Label>
                      <Input
                        id="cookingTime"
                        type="number"
                        placeholder="45"
                        value={formData.cookingTime}
                        onChange={(e) => handleInputChange("cookingTime", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-sm font-medium">
                        Dificultad
                      </Label>
                      <Select value={formData.difficulty} onValueChange={(value) => handleInputChange("difficulty", value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecciona dificultad" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficultyOptions.map((difficulty) => (
                            <SelectItem key={difficulty} value={difficulty}>
                              {difficulty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salePrice" className="text-sm font-medium">
                      Precio de Venta
                    </Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.salePrice}
                      onChange={(e) => handleInputChange("salePrice", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Calculator className="h-5 w-5 text-primary" />
                        Ingredientes
                      </CardTitle>
                      <CardDescription>
                        Gestiona los ingredientes de la receta
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addIngredient} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.recipeIngredients.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.recipeIngredients.map((ingredient, index) => (
                          <TableRow key={ingredient.id || index}>
                            <TableCell>
                              <Select 
                                value={ingredient.article_id || ingredient.articles?.id || ""} 
                                onValueChange={(value) => updateIngredient(index, "article_id", value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar ingrediente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients.map((ing) => (
                                    <SelectItem key={ing.id} value={ing.id}>
                                      {ing.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                value={ingredient.quantity}
                                onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={ingredient.unit} 
                                onValueChange={(value) => updateIngredient(index, "unit", value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {unitOptions.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value}>
                                      {unit.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              €{(ingredient.cost || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIngredient(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No hay ingredientes agregados</p>
                      <Button type="button" onClick={addIngredient}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Primer Ingrediente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Instrucciones</CardTitle>
                  <CardDescription>
                    Pasos detallados para preparar la receta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Escribe las instrucciones paso a paso..."
                    value={formData.instructions}
                    onChange={(e) => handleInputChange("instructions", e.target.value)}
                    rows={8}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Actions */}
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
                    <BackButton href={getBackUrl()} className="w-full h-12 font-medium" />
                  </CardContent>
                </Card>

                {/* Cost Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen de Costos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">€{totalCost.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Costo total</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">€{costPerServing.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Costo por ración</p>
                    </div>
                    {formData.salePrice && (
                      <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">€{parseFloat(formData.salePrice).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Precio de venta</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creado:</span>
                      <span className="font-medium">
                        {new Date(recipe.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Actualizado:</span>
                      <span className="font-medium">
                        {new Date(recipe.updated_at).toLocaleDateString('es-ES')}
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