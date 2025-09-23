"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

// Mock data for comparison
const comparisonData = [
  {
    id: 1,
    name: "Ensalada Mediterránea",
    category: "Entrantes",
    servings: 4,
    totalCost: 3.2,
    costPerServing: 0.8,
    salePrice: 3.2,
    margin: 75,
    preparationTime: 15,
    difficulty: "Fácil",
    ingredients: 6,
  },
  {
    id: 2,
    name: "Paella Valenciana",
    category: "Principales",
    servings: 6,
    totalCost: 18.5,
    costPerServing: 3.08,
    salePrice: 8.8,
    margin: 65,
    preparationTime: 45,
    difficulty: "Intermedio",
    ingredients: 12,
  },
  {
    id: 4,
    name: "Gazpacho Andaluz",
    category: "Entrantes",
    servings: 4,
    totalCost: 2.1,
    costPerServing: 0.53,
    salePrice: 2.65,
    margin: 80,
    preparationTime: 20,
    difficulty: "Fácil",
    ingredients: 7,
  },
]

const chartData = comparisonData.map((recipe) => ({
  name: recipe.name.split(" ")[0], // First word for shorter labels
  costo: recipe.costPerServing,
  precio: recipe.salePrice,
  margen: recipe.margin,
}))

const pieData = comparisonData.map((recipe) => ({
  name: recipe.name.split(" ")[0],
  value: recipe.costPerServing,
}))

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

export default function CompareRecipesPage() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-100 text-green-800"
      case "Intermedio":
        return "bg-yellow-100 text-yellow-800"
      case "Avanzado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/recipes">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comparador de Escandallos</h1>
          <p className="text-muted-foreground">Analiza y compara múltiples recetas lado a lado</p>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparación Detallada
          </CardTitle>
          <CardDescription>Análisis comparativo de {comparisonData.length} escandallos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  {comparisonData.map((recipe) => (
                    <TableHead key={recipe.id} className="text-center">
                      {recipe.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Categoría</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center">
                      <Badge variant="secondary">{recipe.category}</Badge>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Raciones</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center">
                      {recipe.servings}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Costo Total</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center font-medium">
                      €{recipe.totalCost.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Costo por Ración</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center font-bold text-primary">
                      €{recipe.costPerServing.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Precio de Venta</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center font-medium">
                      €{recipe.salePrice.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Margen</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center font-bold text-accent">
                      {recipe.margin}%
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Beneficio por Ración</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center font-medium text-green-600">
                      €{(recipe.salePrice - recipe.costPerServing).toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Tiempo de Preparación</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center">
                      {recipe.preparationTime} min
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Dificultad</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center">
                      <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ingredientes</TableCell>
                  {comparisonData.map((recipe) => (
                    <TableCell key={recipe.id} className="text-center">
                      {recipe.ingredients}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación de Costos y Precios</CardTitle>
            <CardDescription>Análisis visual de costos, precios y márgenes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "margen") return [`${value}%`, "Margen"]
                      return [`€${value}`, name === "costo" ? "Costo por ración" : "Precio de venta"]
                    }}
                  />
                  <Bar dataKey="costo" fill="hsl(var(--chart-1))" name="costo" />
                  <Bar dataKey="precio" fill="hsl(var(--chart-2))" name="precio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Costos</CardTitle>
            <CardDescription>Proporción de costos por receta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`€${value}`, "Costo por ración"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Más Económico</CardDescription>
            <CardTitle className="text-xl text-green-600">
              {comparisonData.reduce((min, recipe) => (recipe.costPerServing < min.costPerServing ? recipe : min)).name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{Math.min(...comparisonData.map((r) => r.costPerServing)).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mayor Margen</CardDescription>
            <CardTitle className="text-xl text-accent">
              {comparisonData.reduce((max, recipe) => (recipe.margin > max.margin ? recipe : max)).name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.max(...comparisonData.map((r) => r.margin))}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Más Rápido</CardDescription>
            <CardTitle className="text-xl text-primary">
              {
                comparisonData.reduce((min, recipe) => (recipe.preparationTime < min.preparationTime ? recipe : min))
                  .name
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.min(...comparisonData.map((r) => r.preparationTime))} min</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
