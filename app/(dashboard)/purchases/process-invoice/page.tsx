"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { findBestMatches, extractProductName, normalizeText } from "@/lib/text-similarity"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Sparkles, CheckCircle2, Save, Upload, Trash2 } from "lucide-react"
import Link from "next/link"

interface OcrItem {
  id: string
  ocrText: string
  productName: string
  quantity: string
  unit: string
  price: string
  selectedIngredientId: string
  suggestions: any[]
  confirmed: boolean
}

const mockSuppliers = [
  { id: 1, name: "Mercado Central", category: "Verduras y Frutas" },
  { id: 2, name: "Oleícola San José", category: "Aceites y Condimentos" },
  { id: 3, name: "Quesería La Mancha", category: "Lácteos" },
  { id: 4, name: "Pescadería Marina", category: "Pescados y Mariscos" },
]

export default function ProcessInvoicePage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [rawInvoiceText, setRawInvoiceText] = useState("")
  const [ocrItems, setOcrItems] = useState<OcrItem[]>([])

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    supplierName: "",
    notes: "",
  })

  useEffect(() => {
    loadIngredients()
  }, [])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      const data = await DatabaseService.getIngredients()
      setIngredients(data || [])

      if (data && data.length > 0) {
        toast.success(`${data.length} ingredientes cargados`)
      }
    } catch (error) {
      console.error('Error loading ingredients:', error)
      toast.error('Error al cargar ingredientes')
    } finally {
      setLoading(false)
    }
  }

  const processInvoiceText = () => {
    if (!rawInvoiceText.trim()) {
      toast.error('Por favor ingresa el texto de la factura')
      return
    }

    setProcessing(true)

    try {
      // Split by lines
      const lines = rawInvoiceText.split('\n').filter(line => line.trim().length > 0)

      const processedItems: OcrItem[] = []

      for (const line of lines) {
        // Extract product name from line
        const productName = extractProductName(line)

        if (productName.length < 3) continue // Skip very short names

        // Find best matches
        const matches = findBestMatches(productName, ingredients, 5, 0.3)

        // Extract quantity and price (simple regex)
        const quantityMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|ud|unid|unidades?|paq)/i)
        const priceMatch = line.match(/(\d+[.,]\d+)\s*€?/)

        const item: OcrItem = {
          id: Date.now().toString() + Math.random(),
          ocrText: line,
          productName,
          quantity: quantityMatch ? quantityMatch[1].replace(',', '.') : '',
          unit: quantityMatch ? quantityMatch[2].toLowerCase() : 'kg',
          price: priceMatch ? priceMatch[1].replace(',', '.') : '',
          selectedIngredientId: matches.length > 0 ? matches[0].ingredient.id : '',
          suggestions: matches,
          confirmed: false
        }

        processedItems.push(item)
      }

      setOcrItems(processedItems)
      toast.success(`Procesados ${processedItems.length} productos de la factura`)
    } catch (error) {
      console.error('Error processing invoice:', error)
      toast.error('Error al procesar la factura')
    } finally {
      setProcessing(false)
    }
  }

  const updateOcrItem = (itemId: string, updates: Partial<OcrItem>) => {
    setOcrItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }

  const confirmItem = (itemId: string) => {
    const item = ocrItems.find(i => i.id === itemId)
    if (!item) return

    if (!item.selectedIngredientId || !item.quantity || !item.price) {
      toast.error('Por favor completa todos los campos del producto')
      return
    }

    updateOcrItem(itemId, { confirmed: true })
    toast.success('Producto confirmado')

    // Save mapping for future suggestions
    DatabaseService.createOrUpdateProductMapping(
      item.productName,
      item.selectedIngredientId,
      1.0
    ).catch(err => console.error('Error saving mapping:', err))
  }

  const removeItem = (itemId: string) => {
    setOcrItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleSubmit = async () => {
    const confirmedItems = ocrItems.filter(item => item.confirmed)

    if (confirmedItems.length === 0) {
      toast.error('Debes confirmar al menos un producto')
      return
    }

    if (!formData.supplierId) {
      toast.error('Selecciona un proveedor')
      return
    }

    try {
      // Calculate total
      const totalAmount = confirmedItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0
        const price = parseFloat(item.price) || 0
        return sum + (qty * price)
      }, 0)

      // Create purchase items
      const purchaseItems = confirmedItems.map(item => ({
        ingredient_id: item.selectedIngredientId,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        unit_cost: parseFloat(item.price),
        total_cost: parseFloat(item.quantity) * parseFloat(item.price)
      }))

      // Create purchase
      const purchase = await DatabaseService.createPurchase({
        supplier_id: formData.supplierId,
        purchase_date: formData.date,
        total_amount: totalAmount,
        status: 'completed',
        notes: formData.notes + '\n\nProcesado desde factura OCR',
        items: purchaseItems
      })

      // Update stock for each ingredient
      for (const item of confirmedItems) {
        const ingredient = ingredients.find(i => i.id === item.selectedIngredientId)
        if (!ingredient) continue

        const newQuantity = parseFloat(item.quantity)
        const newPrice = parseFloat(item.price)
        const currentStock = ingredient.current_stock || 0
        const currentPrice = ingredient.cost_per_unit || 0

        // Weighted average price
        const totalCurrentValue = currentStock * currentPrice
        const totalNewValue = newQuantity * newPrice
        const totalQuantity = currentStock + newQuantity
        const averagePrice = totalQuantity > 0 ? (totalCurrentValue + totalNewValue) / totalQuantity : newPrice

        await DatabaseService.updateIngredient(item.selectedIngredientId, {
          current_stock: totalQuantity,
          cost_per_unit: averagePrice
        })
      }

      toast.success('Compra registrada exitosamente desde factura OCR')
      router.push('/purchases')
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error('Error al registrar la compra')
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = mockSuppliers.find((s) => s.id.toString() === supplierId)
    setFormData((prev) => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || "",
    }))
  }

  const getTotalAmount = () => {
    return ocrItems
      .filter(item => item.confirmed)
      .reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0
        const price = parseFloat(item.price) || 0
        return sum + (qty * price)
      }, 0)
  }

  const getConfirmedCount = () => {
    return ocrItems.filter(item => item.confirmed).length
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Procesamiento Inteligente de Facturas con OCR
        </h2>
        <p className="text-sm opacity-90">Sube una factura y el sistema sugerirá automáticamente los ingredientes</p>
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
          <h1 className="text-3xl font-bold text-foreground">Procesar Factura</h1>
          <p className="text-muted-foreground">Matching automático con sugerencias inteligentes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: Upload/Paste Invoice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Paso 1: Texto de la Factura
              </CardTitle>
              <CardDescription>
                Pega el texto de tu factura aquí. Ejemplo de formato:
                <br />
                <code className="text-xs bg-gray-100 p-1 rounded">
                  Tomate 2kg 5.50€ <br />
                  Aceite de oliva 1L 12.00€
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Pega aquí el texto de la factura...&#10;Ejemplo:&#10;Tomate cherry 2kg 5.50€&#10;Aceite de oliva virgen extra 1L 12.00€&#10;Queso manchego curado 500g 8.50€"
                className="min-h-[150px] font-mono text-sm"
                value={rawInvoiceText}
                onChange={(e) => setRawInvoiceText(e.target.value)}
              />

              <Button
                onClick={processInvoiceText}
                disabled={processing || !rawInvoiceText.trim()}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {processing ? 'Procesando...' : 'Procesar Factura con IA'}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Review and Confirm Items */}
          {ocrItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Paso 2: Confirmar Productos ({getConfirmedCount()}/{ocrItems.length})</span>
                  <Badge variant="secondary">
                    {getConfirmedCount()} confirmados
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Revisa las sugerencias y confirma cada producto. Puedes cambiar el ingrediente si la sugerencia no es correcta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ocrItems.map((item) => (
                    <Card key={item.id} className={item.confirmed ? 'border-green-500 bg-green-50' : 'border-gray-200'}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* OCR Text */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Texto OCR</Label>
                            <p className="text-sm font-mono bg-gray-100 p-2 rounded">{item.ocrText}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Producto detectado: <strong>{item.productName}</strong>
                            </p>
                          </div>

                          {/* Suggestions */}
                          {item.suggestions.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Sugerencias (por similitud)</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.suggestions.slice(0, 3).map((match, idx) => (
                                  <Badge
                                    key={match.ingredient.id}
                                    variant={item.selectedIngredientId === match.ingredient.id ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => updateOcrItem(item.id, { selectedIngredientId: match.ingredient.id })}
                                  >
                                    {idx === 0 && <Sparkles className="h-3 w-3 mr-1" />}
                                    {match.ingredient.name} ({Math.round(match.score * 100)}%)
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ingredient Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label>Ingrediente *</Label>
                              <Select
                                value={item.selectedIngredientId}
                                onValueChange={(value) => updateOcrItem(item.id, { selectedIngredientId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona ingrediente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients.map((ingredient) => (
                                    <SelectItem key={ingredient.id} value={ingredient.id}>
                                      {ingredient.name} {ingredient.category && `(${ingredient.category})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Cantidad *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateOcrItem(item.id, { quantity: e.target.value })}
                                placeholder="2.5"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Unidad *</Label>
                              <Select
                                value={item.unit}
                                onValueChange={(value) => updateOcrItem(item.id, { unit: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="g">g</SelectItem>
                                  <SelectItem value="l">L</SelectItem>
                                  <SelectItem value="ml">ml</SelectItem>
                                  <SelectItem value="unidad">unidad</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Precio Unitario (€) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateOcrItem(item.id, { price: e.target.value })}
                                placeholder="2.50"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Total</Label>
                              <div className="flex items-center h-10 px-3 bg-gray-100 rounded-md">
                                <span className="font-bold">
                                  €{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>

                            {!item.confirmed && (
                              <Button
                                size="sm"
                                onClick={() => confirmItem(item.id)}
                                disabled={!item.selectedIngredientId || !item.quantity || !item.price}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirmar
                              </Button>
                            )}

                            {item.confirmed && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Confirmado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Purchase Info */}
          {ocrItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Paso 3: Información de la Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Proveedor *</Label>
                    <Select onValueChange={handleSupplierChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name} - {supplier.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productos detectados:</span>
                  <span className="font-medium">{ocrItems.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confirmados:</span>
                  <span className="font-medium text-green-600">{getConfirmedCount()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proveedor:</span>
                  <span className="font-medium">{formData.supplierName || '-'}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-2xl font-bold text-primary">€{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              {getConfirmedCount() > 0 && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={getConfirmedCount() === 0 || !formData.supplierId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Compra ({getConfirmedCount()} items)
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900">Cómo funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-blue-800 space-y-2">
                <li>✓ El sistema analiza el texto de la factura</li>
                <li>✓ Sugiere ingredientes por similitud de nombre</li>
                <li>✓ Aprende de tus confirmaciones</li>
                <li>✓ Actualiza stock automáticamente</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
