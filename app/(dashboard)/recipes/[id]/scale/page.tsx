"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Calculator, Users } from "lucide-react"

// Mock data for the recipe
const mockRecipe = {
  id: "1",
  name: "Paella Valenciana",
  originalPortions: 4,
  category: "Platos Principales",
  difficulty: "Intermedio",
  prepTime: 45,
  cookTime: 30,
  totalCost: 18.5,
  costPerPortion: 4.63,
  ingredients: [
    { id: "1", name: "Arroz bomba", quantity: 400, unit: "g", cost: 3.2, supplier: "Arroces del Delta" },
    { id: "2", name: "Pollo troceado", quantity: 800, unit: "g", cost: 6.4, supplier: "Carnes Selectas" },
    { id: "3", name: "Judías verdes", quantity: 200, unit: "g", cost: 1.8, supplier: "Verduras Frescas" },
    { id: "4", name: "Garrofón", quantity: 150, unit: "g", cost: 2.1, supplier: "Legumbres Premium" },
    { id: "5", name: "Tomate rallado", quantity: 100, unit: "g", cost: 0.8, supplier: "Verduras Frescas" },
    { id: "6", name: "Pimentón dulce", quantity: 15, unit: "g", cost: 0.45, supplier: "Especias Gourmet" },
    { id: "7", name: "Azafrán", quantity: 0.5, unit: "g", cost: 2.5, supplier: "Especias Premium" },
    { id: "8", name: "Aceite de oliva", quantity: 60, unit: "ml", cost: 1.25, supplier: "Aceites Selectos" },
  ],
}

export default function RecipeScalePage() {
  const params = useParams()
  const router = useRouter()
  const [newPortions, setNewPortions] = useState(mockRecipe.originalPortions)
  const [scaledRecipe, setScaledRecipe] = useState(mockRecipe)

  const scaleFactor = newPortions / mockRecipe.originalPortions

  const handleScaleChange = (portions: number) => {
    if (portions <= 0) return

    setNewPortions(portions)

    const scaled = {
      ...mockRecipe,
      originalPortions: portions,
      totalCost: mockRecipe.totalCost * scaleFactor,
      costPerPortion: (mockRecipe.totalCost * scaleFactor) / portions,
      ingredients: mockRecipe.ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: ingredient.quantity * scaleFactor,
        cost: ingredient.cost * scaleFactor,
      })),
    }

    setScaledRecipe(scaled)
  }

  const handleSaveScaledRecipe = () => {
    console.log("[v0] Saving scaled recipe:", scaledRecipe)
    // Here would be the API call to save the scaled recipe
    router.push(`/recipes/${params.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Escalar Receta</h1>
            <p className="text-muted-foreground">{mockRecipe.name}</p>
          </div>
        </div>
        <Button onClick={handleSaveScaledRecipe} className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          Guardar Receta Escalada
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scale Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Control de Escalado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portions">Número de Porciones</Label>
                <Input
                  id="portions"
                  type="number"
                  min="1"
                  value={newPortions}
                  onChange={(e) => handleScaleChange(Number.parseInt(e.target.value) || 1)}
                  className="text-center text-lg font-semibold"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Porciones originales:</span>
                  <span className="font-medium">{mockRecipe.originalPortions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Factor de escalado:</span>
                  <span className="font-medium">{scaleFactor.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-primary">
                  <span>Nuevas porciones:</span>
                  <span>{newPortions}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Acciones Rápidas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScaleChange(mockRecipe.originalPortions * 2)}
                  >
                    x2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScaleChange(mockRecipe.originalPortions * 3)}
                  >
                    x3
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScaleChange(Math.ceil(mockRecipe.originalPortions / 2))}
                  >
                    ÷2
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleScaleChange(mockRecipe.originalPortions)}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Resumen de Costos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo total original:</span>
                <span className="font-medium">€{mockRecipe.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo por porción original:</span>
                <span className="font-medium">€{mockRecipe.costPerPortion.toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-semibold text-primary">
                <span>Nuevo costo total:</span>
                <span>€{scaledRecipe.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-primary">
                <span>Nuevo costo por porción:</span>
                <span>€{scaledRecipe.costPerPortion.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scaled Ingredients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Ingredientes Escalados
                <Badge variant="secondary">{newPortions} porciones</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scaledRecipe.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{ingredient.name}</h4>
                      <p className="text-sm text-muted-foreground">{ingredient.supplier}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">
                        {ingredient.quantity.toFixed(ingredient.quantity < 1 ? 2 : 0)} {ingredient.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">€{ingredient.cost.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de ingredientes:</span>
                  <span className="text-lg font-bold text-primary">€{scaledRecipe.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
