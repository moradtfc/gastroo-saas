"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DatabaseService, type Supplier } from "@/lib/database"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface PurchaseItem {
  id: string
  ingredientId: string
  ingredientName: string
  unit: string
  quantity: string
  price: string
  total: number
}

interface Ingredient {
  id: string
  name: string
  unit: string
  category?: string
  current_stock?: number
  cost_per_unit?: number
}

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [purchase, setPurchase] = useState<any>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    date: "",
    supplierId: "",
    status: "completed",
    notes: "",
  })

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [newItem, setNewItem] = useState({
    ingredientId: "",
    unit: "",
    quantity: "",
    price: "",
  })

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [purchaseData, ingredientsData, suppliersData] = await Promise.all([
        DatabaseService.getPurchase(params.id),
        DatabaseService.getIngredients(),
        DatabaseService.getSuppliers()
      ])
      
      setPurchase(purchaseData)
      setIngredients(ingredientsData || [])
      setSuppliers(suppliersData || [])
      
      // Set form data from purchase
      setFormData({
        date: purchaseData.purchase_date,
        supplierId: purchaseData.supplier_id || "",
        status: purchaseData.status || "completed",
        notes: purchaseData.notes || "",
      })
      
      // Set purchase items
      const items = purchaseData.purchase_items?.map((item: any) => ({
        id: item.id,
        ingredientId: item.ingredient_id,
        ingredientName: item.ingredients?.name || 'Ingrediente desconocido',
        unit: item.unit,
        quantity: item.quantity.toString(),
        price: item.unit_cost.toString(),
        total: item.total_cost
      })) || []
      
      setPurchaseItems(items)
      
    } catch (error: any) {
      console.error('Error loading data:', error)
      setError('Error al cargar los datos')
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (itemId: string, field: string, value: string) => {
    setPurchaseItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        const updatedItem = { ...item, [field]: value }
        if (field === "quantity" || field === "price") {
          const quantity = Number.parseFloat(updatedItem.quantity) || 0
          const price = Number.parseFloat(updatedItem.price) || 0
          updatedItem.total = quantity * price
        }
        return updatedItem
      }),
    )
  }

  const addNewItem = () => {
    if (!newItem.ingredientId || !newItem.unit || !newItem.quantity || !newItem.price) {
      toast.error("Por favor completa todos los campos del nuevo artículo")
      return
    }

    const ingredient = ingredients.find((i) => i.id === newItem.ingredientId)
    if (!ingredient) return

    const quantity = Number.parseFloat(newItem.quantity)
    const price = Number.parseFloat(newItem.price)

    const item: PurchaseItem = {
      id: `new-${Date.now()}`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      unit: newItem.unit,
      quantity: newItem.quantity,
      price: newItem.price,
      total: quantity * price,
    }

    setPurchaseItems([...purchaseItems, item])
    setNewItem({ ingredientId: "", unit: "", quantity: "", price: "" })
    toast.success(`${ingredient.name} agregado`)
  }

  const removeItem = (itemId: string) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== itemId))
    toast.success("Artículo eliminado")
  }

  const getTotalAmount = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0)
  }

  const isFormValid = () => {
    return formData.date !== "" && formData.supplierId !== "" && purchaseItems.length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      // For now, we'll show a success message since we don't have update functionality yet
      toast.success("Funcionalidad de edición en desarrollo")
      console.log("Would update purchase with:", {
        id: params.id,
        formData,
        purchaseItems,
        totalAmount: getTotalAmount()
      })
      
      // Uncomment when update functionality is implemented:
      // await DatabaseService.updatePurchase(params.id, {
      //   supplier_id: formData.supplierId,
      //   purchase_date: formData.date,
      //   status: formData.status,
      //   notes: formData.notes,
      //   total_amount: getTotalAmount(),
      //   items: purchaseItems.map(item => ({
      //     ingredient_id: item.ingredientId,
      //     quantity: Number.parseFloat(item.quantity),
      //     unit: item.unit,
      //     unit_cost: Number.parseFloat(item.price),
      //     total_cost: item.total
      //   }))
      // })
      
      // router.push(`/purchases/${params.id}`)
      
    } catch (error: any) {
      console.error('Error updating purchase:', error)
      toast.error('Error al actualizar la compra')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error || 'No se pudo encontrar la compra'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/purchases')} variant="outline" className="flex-1">
                  Volver a Compras
                </Button>
                <Button onClick={loadData} className="flex-1">
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
        <Link href={`/purchases/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Detalle
          </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Compra</h1>
            <p className="text-gray-600 mt-1">Modifica la información de la compra</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Fecha de Compra *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier">Proveedor *</Label>
                    <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{supplier.name}</span>
                              {supplier.phone && (
                                <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Estado *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas adicionales sobre la compra..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Items */}
            <Card>
              <CardHeader>
                <CardTitle>Artículos de la Compra</CardTitle>
                <CardDescription>Modifica las cantidades y precios de los artículos existentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.ingredientName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, "price", e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="font-bold">€{item.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Add New Item */}
            <Card>
              <CardHeader>
                <CardTitle>Agregar Nuevo Artículo</CardTitle>
                <CardDescription>Agrega ingredientes adicionales a esta compra</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="newIngredient">Ingrediente</Label>
                    <Select value={newItem.ingredientId} onValueChange={(value) => setNewItem({ ...newItem, ingredientId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="newUnit">Unidad</Label>
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                        <SelectItem value="g">Gramos (g)</SelectItem>
                        <SelectItem value="L">Litros (L)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="unidad">Unidades</SelectItem>
                        <SelectItem value="docena">Docenas</SelectItem>
                        <SelectItem value="paquete">Paquetes</SelectItem>
                        <SelectItem value="bandeja">Bandejas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="newQuantity">Cantidad</Label>
                    <Input
                      id="newQuantity"
                      type="number"
                      step="0.01"
                      placeholder="0" 
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPrice">Precio Unit.</Label>
                    <Input
                      id="newPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <Button type="button" onClick={addNewItem} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Artículo
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Artículos:</span>
                  <span className="font-semibold">{purchaseItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="text-2xl font-bold text-primary">€{getTotalAmount().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting || !isFormValid()}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
          </div>
        </div>
      </form>
    </div>
  )
}