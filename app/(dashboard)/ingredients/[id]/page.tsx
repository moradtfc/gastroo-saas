"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, TrendingUp, Calculator, History, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

// Mock price history data (would come from database in real app)
const priceHistory = [
  { date: "2024-01-01", price: 2.2 },
  { date: "2024-01-05", price: 2.3 },
  { date: "2024-01-10", price: 2.45 },
  { date: "2024-01-15", price: 2.5 },
  { date: "2024-01-20", price: 2.4 },
  { date: "2024-01-25", price: 2.55 },
]

// Conversion factors to grams
const conversionFactors: Record<string, number> = {
  kg: 1000,
  g: 1,
  L: 1000, // Assuming 1L = 1000g for liquids
  ml: 1,
  unidad: 100, // Assuming 1 unit = 100g
  docena: 1200, // Assuming 1 dozen = 1200g
  bandeja: 500, // Assuming 1 tray = 500g
  paquete: 250, // Assuming 1 package = 250g
}

interface IngredientDetailPageProps {
  params: {
    id: string
  }
}

export default function IngredientDetailPage({ params }: IngredientDetailPageProps) {
  const [ingredient, setIngredient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conversionAmount, setConversionAmount] = useState("")
  const [targetUnit, setTargetUnit] = useState("g")

  useEffect(() => {
    loadIngredient()
  }, [params.id])

  const loadIngredient = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading ingredient with ID:', params.id)
      
      const { data, error } = await DatabaseService.supabase
        .from('ingredients')
        .select(`
          *,
          suppliers (
            name,
            phone,
            email
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        throw new Error('Ingrediente no encontrado')
      }

      console.log('Ingredient loaded:', data)
      setIngredient(data)
    } catch (error: any) {
      console.error('Error loading ingredient:', error)
      setError(error.message || 'Error al cargar ingrediente')
      toast.error('Error al cargar ingrediente')
    } finally {
      setLoading(false)
    }
  }

  const convertUnits = () => {
    if (!ingredient || !conversionAmount) return null

    const amount = parseFloat(conversionAmount)
    if (isNaN(amount)) return null

    const sourceGrams = amount * (conversionFactors[ingredient.unit] || 1)
    const targetAmount = sourceGrams / (conversionFactors[targetUnit] || 1)

    return {
      amount: targetAmount,
      unit: targetUnit,
      cost: (targetAmount * (ingredient.cost_per_unit || 0)) / (conversionFactors[ingredient.unit] || 1) * (conversionFactors[targetUnit] || 1)
    }
  }

  const conversion = convertUnits()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !ingredient) {
    return (
      <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Ingrediente No Encontrado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error || 'El ingrediente solicitado no existe en la base de datos.'}
              </p>
              <div className="space-y-2">
                <Button onClick={loadIngredient} className="w-full">
                  Reintentar
                </Button>
                <Link href="/ingredients">
                  <Button variant="outline" className="w-full">
                    Volver a Ingredientes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const stockPercentage = Math.min(((ingredient.current_stock || 0) / Math.max(ingredient.current_stock || 0, ingredient.min_stock || 0, 50)) * 100, 100)
  const isLowStock = (ingredient.current_stock || 0) <= (ingredient.min_stock || 0)

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <BackButton href="/ingredients" />
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
              {ingredient.name}
            </h1>
            <p className="text-muted-foreground text-lg">
              Detalles del ingrediente y análisis de costos
            </p>
          </div>
        </div>
        <Link href={`/ingredients/${ingredient.id}/edit`}>
          <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
            <Edit className="h-5 w-5 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Categoría</Label>
                  <div>
                    {ingredient.category ? (
                      <Badge variant="secondary" className="text-sm">
                        {ingredient.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin categoría</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Precio por Unidad</Label>
                  <div className="text-2xl font-bold text-foreground">
                    €{(ingredient.cost_per_unit || 0).toFixed(2)} / {ingredient.unit}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Proveedor</Label>
                  <div>
                    <p className="font-medium">{ingredient.suppliers?.name || 'Sin proveedor'}</p>
                    {ingredient.suppliers?.phone && (
                      <p className="text-sm text-muted-foreground">{ingredient.suppliers.phone}</p>
                    )}
                    {ingredient.suppliers?.email && (
                      <p className="text-sm text-muted-foreground">{ingredient.suppliers.email}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Stock Actual</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-semibold ${isLowStock ? 'text-red-600' : 'text-foreground'}`}>
                        {ingredient.current_stock || 0} {ingredient.unit}
                      </span>
                      {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isLowStock ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mín: {ingredient.min_stock || 0}</span>
                      <span>{isLowStock ? 'Stock Bajo' : 'Stock Normal'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allergens */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Alérgenos</Label>
                <div className="flex gap-2 flex-wrap">
                  {ingredient.allergens && ingredient.allergens.length > 0 ? (
                    ingredient.allergens.map((allergen: string) => (
                      <Badge key={allergen} variant="destructive" className="text-xs">
                        {allergen}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">Ninguno</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unit Converter */}
          <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="w-8 h-8 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-accent" />
                </div>
                Conversor de Unidades
              </CardTitle>
              <CardDescription>
                Convierte cantidades y calcula costos en diferentes unidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Cantidad</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={conversionAmount}
                    onChange={(e) => setConversionAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad Original</Label>
                  <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                    {ingredient.unit}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-unit">Convertir a</Label>
                  <Select value={targetUnit} onValueChange={setTargetUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Gramos (g)</SelectItem>
                      <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="L">Litros (L)</SelectItem>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="docena">Docena</SelectItem>
                      <SelectItem value="bandeja">Bandeja</SelectItem>
                      <SelectItem value="paquete">Paquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {conversion && (
                <div className="mt-6 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cantidad Convertida</Label>
                      <div className="text-2xl font-bold text-foreground">
                        {conversion.amount.toFixed(2)} {conversion.unit}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Costo Estimado</Label>
                      <div className="text-2xl font-bold text-accent">
                        €{conversion.cost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Price History */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <History className="h-4 w-4 text-primary" />
                </div>
                Historial de Precios
              </CardTitle>
              <CardDescription>
                Evolución del precio en los últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toFixed(2)}`, 'Precio']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Estadísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Precio Actual</span>
                <span className="font-semibold">€{(ingredient.cost_per_unit || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Última Actualización</span>
                <span className="font-semibold">
                  {new Date(ingredient.updated_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estado del Stock</span>
                <Badge variant={isLowStock ? "destructive" : "default"}>
                  {isLowStock ? "Bajo" : "Normal"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}