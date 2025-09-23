"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Download, Share2, TrendingUp, TrendingDown, AlertTriangle, ChefHat, DollarSign, Users, Clock } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

interface MenuDetailPageProps {
  params: {
    id: string
  }
}

export default function MenuDetailPage({ params }: MenuDetailPageProps) {
  const [menu, setMenu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMenu()
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
            recipes (
              id,
              name,
              description,
              servings,
              cooking_time,
              difficulty,
              sale_price,
              recipe_ingredients (
                id,
                cost,
                quantity,
                unit,
                ingredients (
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Menú no encontrado')

      // Calculate costs and stats
      const recipes = data.menu_recipes || []
      const totalCost = recipes.reduce((sum: number, mr: any) => {
        const recipeCost = mr.recipes?.recipe_ingredients?.reduce((recipeSum: number, ri: any) => recipeSum + (ri.cost || 0), 0) || 0
        return sum + recipeCost
      }, 0)
      const totalPrice = recipes.reduce((sum: number, mr: any) => sum + (mr.recipes?.sale_price || 0), 0)
      const margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0

      setMenu({
        ...data,
        totalCost,
        totalPrice,
        margin,
        recipeCount: recipes.length
      })
    } catch (error: any) {
      console.error('Error loading menu:', error)
      setError(error.message || 'Error al cargar menú')
      toast.error('Error al cargar menú')
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

  if (error || !menu) {
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
                <Button onClick={loadMenu} className="w-full">
                  Reintentar
                </Button>
                <BackButton href="/menus" className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Borrador</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>
      default:
        return <Badge variant="outline">{status || 'Sin estado'}</Badge>
    }
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <BackButton href="/menus" />
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
                {menu.name}
              </h1>
              {getStatusBadge(menu.status)}
            </div>
            <p className="text-muted-foreground text-lg">
              Detalles del menú y análisis de costos
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
          <Link href={`/menus/${params.id}/edit`}>
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
          {/* Menu Overview */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ChefHat className="h-6 w-6 text-primary" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {menu.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Descripción</p>
                  <p className="text-base text-muted-foreground">{menu.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <ChefHat className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platos</p>
                    <p className="text-lg font-semibold">{menu.recipeCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Precio Total</p>
                    <p className="text-lg font-semibold">€{menu.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Margen</p>
                    <p className="text-lg font-semibold text-green-600">{menu.margin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              {menu.category && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Categoría</p>
                  <Badge variant="secondary">{menu.category}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-primary" />
                Platos del Menú
              </CardTitle>
              <CardDescription>
                Desglose detallado de platos y costos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menu.menu_recipes && menu.menu_recipes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plato</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Margen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menu.menu_recipes.map((mr: any) => {
                      const recipe = mr.recipes
                      const recipeCost = recipe?.recipe_ingredients?.reduce((sum: number, ri: any) => sum + (ri.cost || 0), 0) || 0
                      const recipePrice = recipe?.sale_price || 0
                      const recipeMargin = recipePrice > 0 ? ((recipePrice - recipeCost) / recipePrice) * 100 : 0

                      return (
                        <TableRow key={mr.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-semibold">{recipe?.name || 'Plato desconocido'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {recipe?.servings && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {recipe.servings} raciones
                                  </span>
                                )}
                                {recipe?.cooking_time && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {recipe.cooking_time}m
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {recipe?.description || 'Sin descripción'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            €{recipeCost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            €{recipePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-green-600">
                              {recipeMargin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="font-medium bg-muted/50">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">€{menu.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{menu.totalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {menu.margin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay platos en este menú</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                <p className="text-2xl font-bold text-primary">€{menu.totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Costo total</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                <p className="text-2xl font-bold text-secondary">€{menu.totalPrice.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Precio total</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{menu.margin.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Margen de beneficio</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">€{menu.recipeCount > 0 ? (menu.totalPrice / menu.recipeCount).toFixed(2) : '0.00'}</p>
                <p className="text-sm text-muted-foreground">Precio promedio por plato</p>
              </div>
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
                  {new Date(menu.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actualizado:</span>
                <span className="font-medium">
                  {new Date(menu.updated_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium">{getStatusBadge(menu.status)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platos:</span>
                <span className="font-medium">{menu.recipeCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}