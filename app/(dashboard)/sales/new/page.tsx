"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Plus, Trash2, Search, ShoppingCart, Calculator, User, CreditCard } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

const paymentMethods = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "mixed", label: "Mixto" }
]

const statusOptions = [
  { value: "completed", label: "Completado" },
  { value: "pending", label: "Pendiente" },
  { value: "cancelled", label: "Cancelado" }
]

export default function NewSalePage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchRecipe, setSearchRecipe] = useState("")
  
  const [formData, setFormData] = useState({
    customerName: "",
    saleDate: new Date().toISOString().split('T')[0],
    status: "completed",
    notes: "",
    saleItems: [] as any[]
  })

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      
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
      toast.error('Error al cargar recetas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (formData.saleItems.length === 0) {
        toast.error("Debe agregar al menos un producto a la venta")
        return
      }

      const totalAmount = formData.saleItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

      // Create sale
      const { data: saleData, error: saleError } = await DatabaseService.supabase
        .from('sales')
        .insert({
          customer_name: formData.customerName || null,
          sale_date: formData.saleDate,
          total_amount: totalAmount,
          status: formData.status,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Insert sale items
      if (formData.saleItems.length > 0) {
        const itemsToInsert = formData.saleItems.map(item => ({
          sale_id: saleData.id,
          recipe_id: item.recipe.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }))

        const { error: insertError } = await DatabaseService.supabase
          .from('sale_items')
          .insert(itemsToInsert)

        if (insertError) throw insertError
      }

      toast.success("Venta registrada exitosamente")
      router.push(`/sales/${saleData.id}`)
    } catch (error: any) {
      console.error('Error creating sale:', error)
      toast.error("Error al registrar venta")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSaleItem = (recipe: any) => {
    const newItem = {
      id: `temp_${Date.now()}`,
      recipe: recipe,
      quantity: 1,
      unitPrice: recipe.sale_price || 0,
      totalPrice: recipe.sale_price || 0
    }
    setFormData(prev => ({
      ...prev,
      saleItems: [...prev.saleItems, newItem]
    }))
  }

  const removeSaleItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      saleItems: prev.saleItems.filter((_, i) => i !== index)
    }))
  }

  const updateSaleItem = (index: number, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      saleItems: prev.saleItems.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value }
          
          // Recalculate total price
          if (field === 'quantity' || field === 'unitPrice') {
            updated.totalPrice = updated.quantity * updated.unitPrice
          }
          
          return updated
        }
        return item
      })
    }))
  }

  const calculateTotals = () => {
    const totalAmount = formData.saleItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const totalCost = formData.saleItems.reduce((sum, item) => sum + (item.recipe.totalCost * item.quantity), 0)
    const totalProfit = totalAmount - totalCost
    const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0
    
    return { totalAmount, totalCost, totalProfit, profitMargin }
  }

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchRecipe.toLowerCase()) &&
    !formData.saleItems.some(item => item.recipe.id === recipe.id)
  )

  const { totalAmount, totalCost, totalProfit, profitMargin } = calculateTotals()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <BackButton href="/sales" />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nueva Venta
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Registra una nueva venta en el sistema
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="xl:col-span-2 space-y-6">
              {/* Sale Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <User className="h-5 w-5 text-primary" />
                    Información de la Venta
                  </CardTitle>
                  <CardDescription>
                    Detalles básicos de la venta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-medium">
                        Cliente
                      </Label>
                      <Input
                        id="customerName"
                        placeholder="Ej: Mesa 5, Juan Pérez..."
                        value={formData.customerName}
                        onChange={(e) => handleInputChange("customerName", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saleDate" className="text-sm font-medium">
                        Fecha *
                      </Label>
                      <Input
                        id="saleDate"
                        type="date"
                        value={formData.saleDate}
                        onChange={(e) => handleInputChange("saleDate", e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notas
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Notas adicionales sobre la venta..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sale Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Productos
                      </CardTitle>
                      <CardDescription>
                        Gestiona los productos de la venta
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Sale Items */}
                  {formData.saleItems.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Productos en la venta:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.saleItems.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <p>{item.recipe.name}</p>
                                  {item.recipe.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {item.recipe.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateSaleItem(index, "quantity", parseInt(e.target.value) || 1)}
                                  className="w-20 text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateSaleItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                €{item.totalPrice.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSaleItem(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Add New Items */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Agregar productos:</h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar productos..."
                        value={searchRecipe}
                        onChange={(e) => setSearchRecipe(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {loading ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Cargando productos...</p>
                    ) : filteredRecipes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {filteredRecipes.map((recipe) => (
                          <div
                            key={recipe.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => addSaleItem(recipe)}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{recipe.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Precio: €{(recipe.sale_price || 0).toFixed(2)} | Costo: €{recipe.totalCost.toFixed(2)}
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
                        {searchRecipe ? "No se encontraron productos" : "Todos los productos ya están agregados"}
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
                      disabled={saving || formData.saleItems.length === 0}
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Guardando..." : "Registrar Venta"}
                    </Button>
                    <BackButton href="/sales" className="w-full h-12 font-medium" />
                  </CardContent>
                </Card>

                {/* Sale Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calculator className="h-5 w-5 text-primary" />
                      Resumen de Venta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">€{totalAmount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total venta</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">€{totalCost.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Costo total</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">€{totalProfit.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Ganancia</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{profitMargin.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Margen</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{formData.saleItems.length}</p>
                      <p className="text-sm text-muted-foreground">Productos</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Consejos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Verifica las cantidades antes de guardar</p>
                    <p>• Puedes ajustar precios individualmente</p>
                    <p>• El cliente es opcional para ventas rápidas</p>
                    <p>• Revisa el margen de ganancia</p>
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