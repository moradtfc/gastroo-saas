"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Calendar, Package, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DatabaseService, type Supplier, type Unit } from "@/lib/database"
import { toast } from "sonner"
import { SuccessModal } from "@/components/ui/success-modal"
import { UnitConversionErrorModal } from "@/components/ui/unit-conversion-error-modal"

interface Ingredient {
  id: string
  name: string
  unit: string
  category?: string
  current_stock?: number
  cost_per_unit?: number
}

interface PurchaseItem {
  id: string
  ingredientId: string
  ingredientName: string
  unit: string
  unitId: string
  unitSymbol: string
  quantity: number
  price: number
  total: number
}

export default function CreatePurchasePage() {
  console.log("[v0] CreatePurchasePage rendering - Purchases creation form")

  const router = useRouter()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("completed")
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  // Unit conversion error modal state
  const [showConversionErrorModal, setShowConversionErrorModal] = useState(false)
  const [conversionError, setConversionError] = useState<{
    ingredientName: string
    fromUnit: string
    toUnit: string
    errorMessage: string
    fromCategory?: string
    toCategory?: string
  } | null>(null)

  // Form state for adding new item
  const [selectedIngredient, setSelectedIngredient] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ingredientsData, suppliersData, unitsData] = await Promise.all([
        DatabaseService.getIngredients(),
        DatabaseService.getSuppliers(),
        DatabaseService.getUnits()
      ])
      setIngredients(ingredientsData || [])
      setSuppliers(suppliersData || [])
      setUnits(unitsData || [])
      console.log('Loaded data:', { 
        ingredients: ingredientsData?.length, 
        suppliers: suppliersData?.length,
        units: unitsData?.length 
      })
      if (ingredientsData && ingredientsData.length > 0) {
        toast.success(`${ingredientsData.length} ingredientes, ${suppliersData?.length || 0} proveedores y ${unitsData?.length || 0} unidades cargados`)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!selectedIngredient || !selectedUnit || !quantity || !price) {
      toast.error("Por favor completa todos los campos del artículo")
      return
    }

    const ingredient = ingredients.find((i) => i.id === selectedIngredient)
    const selectedUnitInfo = units.find((u) => u.id === selectedUnit)

    if (!ingredient || !selectedUnitInfo) {
      toast.error("Ingrediente o unidad no encontrados")
      return
    }

    // Check if unit conversion is valid (if ingredient has a default unit)
    const ingredientWithUnits = ingredient as any
    if (ingredientWithUnits.default_unit_id && ingredientWithUnits.default_unit_id !== selectedUnit) {
      const conversionCheck = await DatabaseService.canConvertUnits(ingredientWithUnits.default_unit_id, selectedUnit)
      
      if (!conversionCheck.canConvert) {
        // Show conversion error modal
        const ingredientDefaultUnit = ingredientWithUnits.default_unit_info
        setConversionError({
          ingredientName: ingredient.name,
          fromUnit: ingredientDefaultUnit?.name || 'unidad desconocida',
          toUnit: selectedUnitInfo.name,
          errorMessage: conversionCheck.error || 'Conversión no válida',
          fromCategory: ingredientDefaultUnit?.category?.name,
          toCategory: selectedUnitInfo.category?.name
        })
        setShowConversionErrorModal(true)
        return
      }
    }

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      unit: selectedUnitInfo.name,
      unitId: selectedUnitInfo.id,
      unitSymbol: selectedUnitInfo.symbol,
      quantity: Number.parseFloat(quantity),
      price: Number.parseFloat(price),
      total: Number.parseFloat(quantity) * Number.parseFloat(price),
    }

    setItems([...items, newItem])

    // Reset form
    setSelectedIngredient("")
    setSelectedUnit("")
    setQuantity("")
    setPrice("")
    
    toast.success(`${ingredient.name} agregado a la compra`)
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)
  const totalItems = items.length

  const updateIngredientStock = async (item: PurchaseItem) => {
    try {
      const ingredient = ingredients.find(i => i.id === item.ingredientId)
      if (!ingredient) {
        console.warn(`Ingredient with ID ${item.ingredientId} not found in local state`)
        return
      }

      const currentStock = ingredient.current_stock || 0
      const currentPrice = ingredient.cost_per_unit || 0
      let quantityToAdd = item.quantity
      const newPrice = item.price

      console.log(`Updating ${ingredient.name}: Current stock: ${currentStock}, Adding: ${item.quantity} ${item.unitSymbol}`)

      // Convert quantity to ingredient's base unit if necessary
      const ingredientWithUnits = ingredient as any
      const ingredientBaseUnitId = ingredientWithUnits.unit_id || ingredientWithUnits.default_unit_id
      
      if (ingredientBaseUnitId && item.unitId !== ingredientBaseUnitId) {
        console.log(`Converting ${item.quantity} from unit ${item.unitId} to base unit ${ingredientBaseUnitId}`)
        
        const conversion = await DatabaseService.convertUnits(item.quantity, item.unitId, ingredientBaseUnitId)
        
        if (conversion.success && conversion.convertedValue !== undefined) {
          quantityToAdd = conversion.convertedValue
          console.log(`✅ Conversion successful: ${item.quantity} ${item.unitSymbol} = ${quantityToAdd} (base unit)`)
        } else {
          console.warn(`⚠️ Could not convert units for ${ingredient.name}, using original quantity`)
          console.warn(`Conversion error: ${conversion.error}`)
        }
      }

      // Calculate weighted average price using the converted quantity
      const totalCurrentValue = currentStock * currentPrice
      const totalNewValue = quantityToAdd * newPrice // Use converted quantity for value calculation
      const totalQuantity = currentStock + quantityToAdd
      const averagePrice = totalQuantity > 0 ? (totalCurrentValue + totalNewValue) / totalQuantity : newPrice

      console.log(`Price calculation: (${currentStock} × ${currentPrice}) + (${quantityToAdd} × ${newPrice}) = ${totalCurrentValue + totalNewValue} ÷ ${totalQuantity} = ${averagePrice.toFixed(2)}`)

      // Update ingredient in database
      await DatabaseService.updateIngredient(item.ingredientId, {
        current_stock: totalQuantity,
        cost_per_unit: averagePrice
      })

      console.log(`✅ Updated ${ingredient.name}: Stock ${currentStock} + ${quantityToAdd} = ${totalQuantity}, Price: ${averagePrice.toFixed(2)}€`)
    } catch (error: any) {
      console.error(`Error updating ingredient stock for ${item.ingredientName}:`, error)
      throw new Error(`Error al actualizar stock de ${item.ingredientName}: ${error.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Submitting purchase creation form")

    if (items.length === 0) {
      toast.error("Debes agregar al menos un artículo a la compra")
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Starting purchase creation process...')
      console.log('Items to process:', items)
      console.log('Total amount:', totalAmount)
      
      // Validate form data
      if (!purchaseDate) {
        toast.error('La fecha de compra es requerida')
        return
      }
      
      if (totalAmount <= 0) {
        toast.error('El monto total debe ser mayor a 0')
        return
      }

      // Prepare purchase data for database
      const purchaseData = {
        supplier_id: selectedSupplier || undefined,
        purchase_date: purchaseDate,
        total_amount: totalAmount,
        status: status,
        notes: notes || undefined,
        items: items.map(item => ({
          ingredient_id: item.ingredientId,
          quantity: item.quantity,
          unit: item.unitId,
          unit_cost: item.price,
          total_cost: item.total
        }))
      }

      console.log('Purchase data prepared:', purchaseData)

      // Create purchase in database
      toast.info('Creando compra en la base de datos...')
      const purchase = await DatabaseService.createPurchase(purchaseData)
      console.log('Purchase created:', purchase)
      
      // Update ingredient stocks and prices
      toast.info('Actualizando stock de ingredientes...')
      for (const item of items) {
        await updateIngredientStock(item)
      }

      // Prepare success modal data
      const supplier = suppliers.find(s => s.id === selectedSupplier)
      const supplierName = supplier?.name || 'Sin proveedor'
      setSuccessData({
        purchase,
        totalItems,
        totalAmount,
        supplier: supplierName,
        date: new Date(purchaseDate).toLocaleDateString('es-ES'),
        itemsUpdated: items.map(item => item.ingredientName),
        stockUpdated: true,
        expenseCreated: true
      })
      
      setShowSuccessModal(true)
      
      // Reset form
      setPurchaseDate(new Date().toISOString().split("T")[0])
      setNotes("")
      setStatus("completed")
      setSelectedSupplier("")
      setItems([])
      
      toast.success('¡Compra creada exitosamente!')
    } catch (error: any) {
      console.error('Error creating purchase:', error)
      
      // Show specific error message
      const errorMessage = error.message || 'Error desconocido al crear la compra'
      toast.error(`Error: ${errorMessage}`)
      
      // Additional debugging info
      if (error.message?.includes('Ingrediente con ID')) {
        toast.error('Problema con los ingredientes. Recarga la página e intenta de nuevo.')
      } else if (error.message?.includes('supplier_id')) {
        toast.error('Problema con el proveedor seleccionado.')
      } else if (error.message?.includes('purchase_date')) {
        toast.error('Problema con la fecha de compra.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/purchases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Nueva Compra
          </h1>
          <p className="text-muted-foreground">Agrega ingredientes e insumos al inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Fecha de Compra *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="supplier">Proveedor *</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.length === 0 ? (
                          <SelectItem value="no-suppliers" disabled>
                            No hay proveedores disponibles
                          </SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{supplier.name}</span>
                                {supplier.phone && (
                                  <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Estado *</Label>
                    <Select value={status} onValueChange={setStatus}>
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
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe la compra, observaciones especiales, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Artículos
                </CardTitle>
                <CardDescription>Selecciona ingredientes, cantidades y proveedores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primera fila: Ingrediente y Unidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ingredient" className="text-sm font-medium">Ingrediente *</Label>
                    <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <div className="p-2 text-center text-muted-foreground">Cargando ingredientes...</div>
                        ) : ingredients.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">No hay ingredientes disponibles</div>
                        ) : (
                          ingredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{ingredient.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Stock actual: {ingredient.current_stock || 0} {ingredient.unit}
                                  {ingredient.category && ` • ${ingredient.category}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium">Unidad *</Label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona la unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading" disabled>
                            Cargando unidades...
                          </SelectItem>
                        ) : units.length === 0 ? (
                          <SelectItem value="no-units" disabled>
                            No hay unidades disponibles
                          </SelectItem>
                        ) : (
                          // Group units by category
                          Object.entries(
                            units.reduce((acc, unit) => {
                              const categoryName = unit.category?.name || 'Sin categoría'
                              if (!acc[categoryName]) acc[categoryName] = []
                              acc[categoryName].push(unit)
                              return acc
                            }, {} as Record<string, Unit[]>)
                          ).map(([categoryName, categoryUnits]) => (
                            <div key={categoryName}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                {categoryName}
                              </div>
                              {categoryUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{unit.name}</span>
                                    <span className="text-xs text-muted-foreground">({unit.symbol})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Segunda fila: Cantidad y Precio */}
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
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
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
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botón Agregar */}
                <div className="flex justify-center pt-4">
                  <Button 
                    type="button" 
                    onClick={addItem} 
                    disabled={!selectedIngredient || !selectedUnit || !quantity || !price}
                    className="px-8 py-2"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ingrediente
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Artículos de la Compra</CardTitle>
                  <CardDescription>{items.length} artículo(s) agregado(s)</CardDescription>
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
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.ingredientName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.unitSymbol}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>€{item.price.toFixed(2)}</TableCell>
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-32">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Artículos:</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="text-2xl font-bold text-primary">€{totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Integration Info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Actualización Automática</h3>
                      <p className="text-sm text-blue-800 mt-1">
                        Al registrar esta compra se actualizará automáticamente:
                      </p>
                    </div>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1 ml-8">
                    <li>• Stock de ingredientes</li>
                    <li>• Registro de gastos</li>
                    <li>• Capital de la empresa</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting || items.length === 0 || !selectedSupplier}>
              {isSubmitting ? "Registrando..." : "Registrar Compra"}
            </Button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="¡Compra Registrada!"
          operation="Compra"
          details={successData}
          onViewDetails={() => {
            setShowSuccessModal(false)
            router.push(`/purchases/${successData.purchase.id}`)
          }}
          onContinue={() => {
            setShowSuccessModal(false)
            router.push('/purchases')
          }}
        />
      )}

      {/* Unit Conversion Error Modal */}
      {conversionError && (
        <UnitConversionErrorModal
          isOpen={showConversionErrorModal}
          onClose={() => {
            setShowConversionErrorModal(false)
            setConversionError(null)
          }}
          ingredientName={conversionError.ingredientName}
          fromUnit={conversionError.fromUnit}
          toUnit={conversionError.toUnit}
          errorMessage={conversionError.errorMessage}
          fromCategory={conversionError.fromCategory}
          toCategory={conversionError.toCategory}
        />
      )}
    </div>
  )
}
