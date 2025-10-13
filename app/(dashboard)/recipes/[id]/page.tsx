"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Share2, Download, Scale, Copy, Calculator, AlertTriangle, ChefHat, Clock, Users } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

interface RecipeDetailPageProps {
  params: {
    id: string
  }
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const [recipe, setRecipe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scaleFactor, setScaleFactor] = useState(1)

  useEffect(() => {
    loadRecipe()
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
    } catch (error: any) {
      console.error('Error loading recipe:', error)
      setError(error.message || 'Error al cargar receta')
      toast.error('Error al cargar receta')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
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
                <BackButton href="/recipes" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => sum + (ri.cost || 0), 0) || 0
  const costPerServing = recipe.servings ? totalCost / recipe.servings : 0
  const margin = recipe.sale_price && totalCost ? ((recipe.sale_price - totalCost) / recipe.sale_price) * 100 : 0

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
      case 'facil':
        return <Badge variant="default" className="bg-green-100 text-green-800">Fácil</Badge>
      case 'intermedio':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Intermedio</Badge>
      case 'avanzado':
        return <Badge variant="default" className="bg-red-100 text-red-800">Avanzado</Badge>
      default:
        return <Badge variant="outline">{difficulty || 'No especificado'}</Badge>
    }
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <BackButton href="/recipes" />
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
              {recipe.name}
            </h1>
            <p className="text-muted-foreground text-lg">
              Detalles del escandallo y análisis de costos
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-transparent">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Link href={`/recipes/${params.id}/scale`}>
            <Button variant="outline" className="bg-transparent">
              <Scale className="h-4 w-4 mr-2" />
              Escalar
            </Button>
          </Link>
          <Button variant="outline" className="bg-transparent">
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
          <Link href={`/recipes/${params.id}/edit`}>
            <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recipe Overview */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ChefHat className="h-6 w-6 text-primary" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Raciones</p>
                    <p className="text-lg font-semibold">{recipe.servings || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tiempo</p>
                    <p className="text-lg font-semibold">{recipe.cooking_time ? `${recipe.cooking_time} min` : 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dificultad</p>
                    <div className="mt-1">
                      {getDifficultyBadge(recipe.difficulty)}
                    </div>
                  </div>
                </div>
              </div>
              {recipe.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Descripción</p>
                  <p className="text-base text-muted-foreground">{recipe.description}</p>
                </div>
              )}
              {recipe.category && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Categoría</p>
                  <Badge variant="secondary">{recipe.category}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="h-6 w-6 text-primary" />
                Ingredientes y Costos
              </CardTitle>
              <CardDescription>
                Desglose detallado de ingredientes y costos por porción
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Costo/Porción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipe.recipe_ingredients.map((ri: any) => (
                      <TableRow key={ri.id}>
                        <TableCell className="font-medium">
                          {ri.articles?.name || 'Ingrediente desconocido'}
                        </TableCell>
                        <TableCell className="text-right">
                          {ri.quantity} {ri.unit}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{(ri.cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          €{recipe.servings ? ((ri.cost || 0) / recipe.servings).toFixed(2) : '0.00'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell>Total</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">€{totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{costPerServing.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay ingredientes registrados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          {recipe.instructions && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="text-xl">Instrucciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                    {recipe.instructions}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Analysis */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Análisis de Costos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">€{totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Costo total</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                <p className="text-2xl font-bold text-secondary">€{costPerServing.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Costo por porción</p>
              </div>
              {recipe.sale_price && (
                <>
                  <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">€{recipe.sale_price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Precio de venta</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{margin.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Margen de beneficio</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ingredientes:</span>
                <span className="font-medium">
                  {recipe.recipe_ingredients?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}