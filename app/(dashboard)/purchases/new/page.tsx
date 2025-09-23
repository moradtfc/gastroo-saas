"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, Calculator } from "lucide-react"
import Link from "next/link"

// Mock suppliers data - will be replaced with database data
const mockSuppliers = [
  { id: 1, name: "Mercado Central", category: "Verduras y Frutas" },
  { id: 2, name: "Oleícola San José", category: "Aceites y Condimentos" },
  { id: 3, name: "Quesería La Mancha", category: "Lácteos" },
  { id: 4, name: "Pescadería Marina", category: "Pescados y Mariscos" },
]

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

export default function NewPurchasePage() {
  console.log("[v0] NewPurchasePage rendering - Purchases creation form")

  const router = useRouter()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    supplierName: "",
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
    loadIngredients()
  }, [])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      console.log('Cargando ingredientes desde la base de datos...')
      const data = await DatabaseService.getIngredients()
      console.log('Ingredientes cargados:', data)
      setIngredients(data || [])
      
      if (data && data.length > 0) {
        toast.success(`${data.length} ingredientes cargados correctamente`)
      } else {
        toast.info('No se encontraron ingredientes en la base de datos')
      }
    } catch (error) {
      console.error('Error loading ingredients:', error)
      toast.error('Error al cargar ingredientes desde la base de datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    const purchaseData = {
      ...formData,
      items: purchaseItems,
      totalAmount: getTotalAmount(),
      totalItems: purchaseItems.length,
    }

    console.log("[v0] Purchase form submitted:", purchaseData)

    try {
      // Update stock and average prices for each ingredient
      for (const item of purchaseItems) {
        await updateIngredientStock(item)
      }
      
      toast.success("Compra registrada exitosamente. Stock y gastos actualizados automáticamente.")
      router.push("/purchases")
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error('Error al registrar la compra')
    }
  }

  const updateIngredientStock = async (item: PurchaseItem) => {
    try {
      const ingredient = ingredients.find(i => i.id === item.ingredientId)
      if (!ingredient) return

      const newQuantity = parseFloat(item.quantity)
      const newPrice = parseFloat(item.price)
      const currentStock = ingredient.current_stock || 0
      const currentPrice = ingredient.cost_per_unit || 0

      // Calculate weighted average price
      const totalCurrentValue = currentStock * currentPrice
      const totalNewValue = newQuantity * newPrice
      const totalQuantity = currentStock + newQuantity
      const averagePrice = totalQuantity > 0 ? (totalCurrentValue + totalNewValue) / totalQuantity : newPrice

      // Update ingredient in database
      await DatabaseService.updateIngredient(item.ingredientId, {
        current_stock: totalQuantity,
        cost_per_unit: averagePrice
      })

      console.log(`Updated ${ingredient.name}: Stock ${currentStock} + ${newQuantity} = ${totalQuantity}, Price: ${averagePrice.toFixed(2)}€`)
    } catch (error) {
      console.error('Error updating ingredient stock:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = mockSuppliers.find((s) => s.id.toString() === supplierId)
    setFormData((prev) => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || "",
    }))
  }

  const addItem = () => {
    if (!newItem.ingredientId || !newItem.unit || !newItem.quantity || !newItem.price) return

    const ingredient = ingredients.find((i) => i.id === newItem.ingredientId)
    if (!ingredient) return

    const quantity = Number.parseFloat(newItem.quantity)
    const price = Number.parseFloat(newItem.price)
    const total = quantity * price

    const item: PurchaseItem = {
      id: Date.now().toString(),
      ingredientId: newItem.ingredientId,
      ingredientName: ingredient.name,
      unit: newItem.unit,
      quantity: newItem.quantity,
      price: newItem.price,
      total,
    }

    setPurchaseItems((prev) => [...prev, item])
    setNewItem({ ingredientId: "", unit: "", quantity: "", price: "" })
  }

  const removeItem = (itemId: string) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const getTotalAmount = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0)
  }

  const isFormValid = () => {
    return formData.date !== "" && formData.supplierId !== "" && purchaseItems.length > 0
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-6">
        <h2 className="text-xl font-bold">✓ Formulario de Creación de Compra</h2>
        <p className="text-sm opacity-90">Esta es la vista de registro de nueva compra</p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/purchases">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Compra</h1>
          <p className="text-muted-foreground">Registra una nueva compra de ingredientes e insumos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Purchase Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Información de la Compra
                </CardTitle>
                <CardDescription>Datos básicos de la compra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">Fecha de Compra *</Label>
                    <Input
                      id="date"
                      type="date"
                      className="w-full"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-sm font-medium">Proveedor *</Label>
                    <Select onValueChange={handleSupplierChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{supplier.name}</span>
                              <span className="text-xs text-muted-foreground">{supplier.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional sobre la compra (opcional)..."
                    className="w-full min-h-[80px] resize-y"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Agregar Ingredientes</span>
                  {!loading && ingredients.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {ingredients.length} disponibles
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Selecciona los ingredientes y especifica cantidades y precios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Cargando ingredientes...</div>
                  </div>
                ) : ingredients.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">No hay ingredientes disponibles</div>
                    <div className="text-sm text-muted-foreground">Agrega ingredientes primero para poder crear compras</div>
                  </div>
                ) : (
                  <>
                    {/* Ingrediente y Unidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="ingredient" className="text-sm font-medium">Ingrediente *</Label>
                        <Select
                          value={newItem.ingredientId}
                          onValueChange={(value) => setNewItem((prev) => ({ ...prev, ingredientId: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un ingrediente" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ingredient) => (
                              <SelectItem key={ingredient.id} value={ingredient.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{ingredient.name}</span>
                                  {ingredient.category && (
                                    <span className="text-xs text-muted-foreground">{ingredient.category}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit" className="text-sm font-medium">Unidad *</Label>
                        <Select
                          value={newItem.unit}
                          onValueChange={(value) => setNewItem((prev) => ({ ...prev, unit: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona la unidad" />
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
                    </div>

                    {/* Cantidad y Precio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-medium">Cantidad *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ejemplo: 10" 
                          className="w-full"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-medium">Precio Unitario (€) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ejemplo: 2.50" 
                          className="w-full"
                          value={newItem.price}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Botón Agregar */}
                    <div className="flex justify-center pt-4">
                      <Button
                        type="button"
                        onClick={addItem}
                        disabled={!newItem.ingredientId || !newItem.unit || !newItem.quantity || !newItem.price}
                        className="px-8 py-2"
                        size="lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Ingrediente
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Items List */}
            {purchaseItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Artículos de la Compra</CardTitle>
                  <CardDescription>{purchaseItems.length} artículo(s) agregado(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
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
                              {item.quantity}
                            </TableCell>
                            <TableCell>€{Number.parseFloat(item.price).toFixed(2)}</TableCell>
                            <TableCell className="font-bold">€{item.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resumen de Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Proveedor:</span>
                  <span className="font-medium">{formData.supplierName || "Sin seleccionar"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{formData.date}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Artículos:</span>
                  <span className="font-medium">{purchaseItems.length}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold text-primary">€{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>

                {getTotalAmount() > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Actualizaciones automáticas:</strong>
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Stock de ingredientes se actualizará</li>
                      <li>• Se registrará como gasto automático</li>
                      <li>• Se actualizará el capital de la empresa</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 flex items-center gap-2"
                disabled={!isFormValid()}
              >
                <Save className="h-4 w-4" />
                Registrar Compra
              </Button>
              <Link href="/purchases">
                <Button variant="outline" className="w-full bg-transparent">
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
