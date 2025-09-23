"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Plus, Trash2, Search, AlertTriangle, ChefHat, Calculator } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { useRouter, useSearchParams } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

const categoryOptions = [
  "Diario",
  "Especial",
  "Estacional", 
  "Degustación",
  "Ejecutivo",
  "Infantil",
  "Otros"
]

const statusOptions = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" }
]

interface EditMenuPageProps {
  params: {
    id: string
  }
}

export default function EditMenuPage({ params }: EditMenuPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [menu, setMenu] = useState<any>(null)
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchRecipe, setSearchRecipe] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    status: "draft",
    menuRecipes: [] as any[]
  })

  // Determine back URL based on where user came from
  const getBackUrl = () => {
    const from = searchParams.get('from')
    if (from === 'list') {
      return '/menus'
    }
    return `/menus/${params.id}`
  }

  useEffect(() => {
    loadMenu()
    loadRecipes()
  }, [params.id])

  const loadMenu = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('menus')
        .select(`
          *,
          menu_recipes (
            id,
            position,
            recipe_id,
            recipes (
              id,
              name,
              description,
              sale_price,
              recipe_ingredients (
                cost
              )
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Menú no encontrado')

      setMenu(data)
      setFormData({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "",
        status: data.status || "draft",
        menuRecipes: data.menu_recipes || []
      })
    } catch (error: any) {
      console.error('Error loading menu:', error)
      setError(error.message || 'Error al cargar menú')
      toast.error('Error al cargar menú')
    } finally {
      setLoading(false)
    }
  }

  const loadRecipes = async () => {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('recipes')
        .select(`
          id,
          name,
          description,
          sale_price,
          recipe_ingredients (
            cost
          )
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // Calculate cost for each recipe
      const recipesWithCost = (data || []).map(recipe => {
        const totalCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => sum + (ri.cost || 0), 0) || 0
        return {
          ...recipe,
          totalCost
        }
      })

      setRecipes(recipesWithCost)
    } catch (error) {
      console.error('Error loading recipes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update menu basic info
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        status: formData.status,
      }

      const { error: menuError } = await DatabaseService.supabase
        .from('menus')
        .update(updateData)
        .eq('id', params.id)

      if (menuError) throw menuError

      // Delete existing menu recipes
      const { error: deleteError } = await DatabaseService.supabase
        .from('menu_recipes')
        .delete()
        .eq('menu_id', params.id)

      if (deleteError) throw deleteError

      // Insert updated menu recipes
      if (formData.menuRecipes.length > 0) {
        const recipesToInsert = formData.menuRecipes.map((mr, index) => ({
          menu_id: params.id,
          recipe_id: mr.recipe_id || mr.recipes?.id,
          position: index
        }))

        const { error: insertError } = await DatabaseService.supabase
          .from('menu_recipes')
          .insert(recipesToInsert)

        if (insertError) throw insertError
      }

      toast.success("Menú actualizado exitosamente")
      router.push(getBackUrl())
    } catch (error: any) {
      console.error('Error updating menu:', error)
      toast.error("Error al actualizar menú")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addMenuItem = (recipe: any) => {
    const newItem = {
      id: `temp_${Date.now()}`,
      recipe_id: recipe.id,
      recipes: recipe,
      position: formData.menuRecipes.length
    }
    setFormData(prev => ({
      ...prev,
      menuRecipes: [...prev.menuRecipes, newItem]
    }))
  }

  const removeMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menuRecipes: prev.menuRecipes.filter((_, i) => i !== index)
    }))
  }

  const moveMenuItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.menuRecipes.length) return

    setFormData(prev => {
      const newMenuRecipes = [...prev.menuRecipes]
      const [movedItem] = newMenuRecipes.splice(fromIndex, 1)
      newMenuRecipes.splice(toIndex, 0, movedItem)
      return { ...prev, menuRecipes: newMenuRecipes }
    })
  }

  const calculateTotals = () => {
    const totalCost = formData.menuRecipes.reduce((sum, mr) => {
      const recipeCost = mr.recipes?.recipe_ingredients?.reduce((recipeSum: number, ri: any) => recipeSum + (ri.cost || 0), 0) || mr.recipes?.totalCost || 0
      return sum + recipeCost
    }, 0)
    const totalPrice = formData.menuRecipes.reduce((sum, mr) => sum + (mr.recipes?.sale_price || 0), 0)
    const margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0
    return { totalCost, totalPrice, margin }
  }

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchRecipe.toLowerCase()) &&
    !formData.menuRecipes.some(mr => (mr.recipe_id || mr.recipes?.id) === recipe.id)
  )

  const { totalCost, totalPrice, margin } = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !menu) {
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
                <Button onClick={loadMenu} className="w-full">
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
                  Editar Menú
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Modifica la información del menú
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
                    Detalles principales del menú
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre del Menú *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ej: Menú Mediterráneo"
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
                      placeholder="Describe el menú..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Estado
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calculator className="h-5 w-5 text-primary" />
                    Platos del Menú
                  </CardTitle>
                  <CardDescription>
                    Gestiona los platos incluidos en el menú
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Menu Items */}
                  {formData.menuRecipes.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Platos actuales:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plato</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.menuRecipes.map((mr, index) => {
                            const recipe = mr.recipes
                            const recipeCost = recipe?.recipe_ingredients?.reduce((sum: number, ri: any) => sum + (ri.cost || 0), 0) || recipe?.totalCost || 0

                            return (
                              <TableRow key={mr.id || index}>
                                <TableCell className="font-medium">
                                  <div>
                                    <p>{recipe?.name || 'Plato desconocido'}</p>
                                    {recipe?.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {recipe.description}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  €{recipeCost.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  €{(recipe?.sale_price || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveMenuItem(index, index - 1)}
                                      disabled={index === 0}
                                    >
                                      ↑
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveMenuItem(index, index + 1)}
                                      disabled={index === formData.menuRecipes.length - 1}
                                    >
                                      ↓
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeMenuItem(index)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Add New Items */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Agregar platos:</h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar recetas..."
                        value={searchRecipe}
                        onChange={(e) => setSearchRecipe(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {filteredRecipes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {filteredRecipes.map((recipe) => (
                          <div
                            key={recipe.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => addMenuItem(recipe)}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{recipe.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Costo: €{recipe.totalCost.toFixed(2)} | Precio: €{(recipe.sale_price || 0).toFixed(2)}
                              </p>
                            </div>
                            <Button type="button" size="sm" variant="ghost">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchRecipe ? "No se encontraron recetas" : "Todas las recetas ya están agregadas"}
                      </p>
                    )}
                  </div>
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
                      <p className="text-2xl font-bold text-secondary">€{totalPrice.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Precio total</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{margin.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Margen de beneficio</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{formData.menuRecipes.length}</p>
                      <p className="text-sm text-muted-foreground">Platos incluidos</p>
                    </div>
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
                        {new Date(menu.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Actualizado:</span>
                      <span className="font-medium">
                        {new Date(menu.updated_at).toLocaleDateString('es-ES')}
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