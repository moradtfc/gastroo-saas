"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, Plus, Trash2, Upload, Calculator } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

// Mock ingredients data
const mockIngredients = [
  { id: 1, name: "Tomate", price: 2.5, unit: "kg" },
  { id: 2, name: "Aceite de Oliva", price: 8.9, unit: "L" },
  { id: 3, name: "Cebolla", price: 1.2, unit: "kg" },
  { id: 4, name: "Ajo", price: 4.5, unit: "kg" },
  { id: 5, name: "Sal", price: 0.8, unit: "kg" },
]

interface RecipeIngredient {
  id: number
  ingredientId: number
  name: string
  quantity: number
  unit: string
  pricePerUnit: number
  cost: number
  waste: number
  wasteEnabled: boolean
}

export default function NewRecipePage() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    servings: 4,
    preparationTime: "",
    difficulty: "",
    description: "",
    instructions: "",
    salePrice: "",
    targetMargin: "",
  })

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [selectedIngredient, setSelectedIngredient] = useState("")
  const [additionalCosts, setAdditionalCosts] = useState({
    labor: 0,
    utilities: 0,
    overhead: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("New recipe:", { formData, recipeIngredients, additionalCosts })
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addIngredient = () => {
    if (!selectedIngredient) return

    const ingredient = mockIngredients.find((ing) => ing.id === Number.parseInt(selectedIngredient))
    if (!ingredient) return

    const newIngredient: RecipeIngredient = {
      id: Date.now(),
      ingredientId: ingredient.id,
      name: ingredient.name,
      quantity: 0,
      unit: ingredient.unit,
      pricePerUnit: ingredient.price,
      cost: 0,
      waste: 0,
      wasteEnabled: false,
    }

    setRecipeIngredients((prev) => [...prev, newIngredient])
    setSelectedIngredient("")
  }

  const updateIngredient = (id: number, field: string, value: number | boolean) => {
    setRecipeIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === id) {
          const updated = { ...ing, [field]: value }
          if (field === "quantity" || field === "waste") {
            const effectiveQuantity = updated.wasteEnabled
              ? updated.quantity * (1 + updated.waste / 100)
              : updated.quantity
            updated.cost = (effectiveQuantity * updated.pricePerUnit) / 1000 // Convert to kg/L
          }
          return updated
        }
        return ing
      }),
    )
  }

  const removeIngredient = (id: number) => {
    setRecipeIngredients((prev) => prev.filter((ing) => ing.id !== id))
  }

  const totalIngredientCost = recipeIngredients.reduce((sum, ing) => sum + ing.cost, 0)
  const totalAdditionalCosts = Object.values(additionalCosts).reduce((sum, cost) => sum + cost, 0)
  const totalCost = totalIngredientCost + totalAdditionalCosts
  const costPerServing = totalCost / formData.servings

  const calculatedMargin = formData.salePrice
    ? ((Number.parseFloat(formData.salePrice) - costPerServing) / Number.parseFloat(formData.salePrice)) * 100
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton href="/recipes" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Nueva Receta
          </h1>
          <p className="text-muted-foreground">Crea una nueva receta con cálculo automático de costos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Datos principales del escandallo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Plato *</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Paella Valenciana"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrantes">Entrantes</SelectItem>
                        <SelectItem value="principales">Principales</SelectItem>
                        <SelectItem value="postres">Postres</SelectItem>
                        <SelectItem value="bebidas">Bebidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servings">Raciones *</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      value={formData.servings}
                      onChange={(e) => handleInputChange("servings", Number.parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preparationTime">Tiempo (min)</Label>
                    <Input
                      id="preparationTime"
                      type="number"
                      placeholder="30"
                      value={formData.preparationTime}
                      onChange={(e) => handleInputChange("preparationTime", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificultad</Label>
                    <Select onValueChange={(value) => handleInputChange("difficulty", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del plato..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Ingredientes</CardTitle>
                <CardDescription>Añade los ingredientes y sus cantidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Ingredient */}
                <div className="flex gap-2">
                  <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockIngredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                          {ingredient.name} - €{ingredient.price}/{ingredient.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addIngredient} disabled={!selectedIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Ingredients Table */}
                {recipeIngredients.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Merma</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipeIngredients.map((ingredient) => (
                          <TableRow key={ingredient.id}>
                            <TableCell className="font-medium">{ingredient.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={ingredient.quantity}
                                  onChange={(e) =>
                                    updateIngredient(ingredient.id, "quantity", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">{ingredient.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={ingredient.wasteEnabled}
                                  onCheckedChange={(checked) =>
                                    updateIngredient(ingredient.id, "wasteEnabled", checked as boolean)
                                  }
                                />
                                {ingredient.wasteEnabled && (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ingredient.waste}
                                      onChange={(e) =>
                                        updateIngredient(ingredient.id, "waste", Number.parseFloat(e.target.value) || 0)
                                      }
                                      className="w-16"
                                    />
                                    <span className="text-sm">%</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">€{ingredient.cost.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIngredient(ingredient.id)}
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
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instrucciones</CardTitle>
                <CardDescription>Pasos para preparar el plato</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="1. Paso uno...&#10;2. Paso dos...&#10;3. Paso tres..."
                  value={formData.instructions}
                  onChange={(e) => handleInputChange("instructions", e.target.value)}
                  rows={8}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-32">
            {/* Cost Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculadora de Costos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ingredientes:</span>
                    <span>€{totalIngredientCost.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Costos Adicionales:</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-16">Mano obra:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={additionalCosts.labor}
                          onChange={(e) =>
                            setAdditionalCosts((prev) => ({
                              ...prev,
                              labor: Number.parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-16">Servicios:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={additionalCosts.utilities}
                          onChange={(e) =>
                            setAdditionalCosts((prev) => ({
                              ...prev,
                              utilities: Number.parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-16">Generales:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={additionalCosts.overhead}
                          onChange={(e) =>
                            setAdditionalCosts((prev) => ({
                              ...prev,
                              overhead: Number.parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Costo Total:</span>
                      <span className="text-primary">€{totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Costo por Ración:</span>
                      <span className="text-primary">€{costPerServing.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Precio y Margen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Venta</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.salePrice}
                    onChange={(e) => handleInputChange("salePrice", e.target.value)}
                  />
                </div>

                {formData.salePrice && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margen Calculado:</span>
                      <span className={`font-bold ${calculatedMargin > 0 ? "text-green-600" : "text-red-600"}`}>
                        {calculatedMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beneficio:</span>
                      <span className="font-medium">
                        €{(Number.parseFloat(formData.salePrice) - costPerServing).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Imagen del Plato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Arrastra una imagen o haz clic para seleccionar</p>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Seleccionar Imagen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button type="submit" className="bg-accent hover:bg-accent/90 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Escandallo
              </Button>
              <Link href="/recipes">
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
