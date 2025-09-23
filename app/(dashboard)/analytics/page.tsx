"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Download } from "lucide-react"

// Mock data for analytics
const costEvolutionData = [
  { month: "Ene", costoTotal: 4200, costoUnitario: 12.5, margen: 65 },
  { month: "Feb", costoTotal: 4800, costoUnitario: 13.2, margen: 62 },
  { month: "Mar", costoTotal: 4600, costoUnitario: 12.8, margen: 64 },
  { month: "Abr", costoTotal: 5200, costoUnitario: 14.1, margen: 58 },
  { month: "May", costoTotal: 4900, costoUnitario: 13.5, margen: 61 },
  { month: "Jun", costoTotal: 5400, costoUnitario: 14.8, margen: 56 },
]

const profitabilityData = [
  { categoria: "Entrantes", ventas: 15600, costos: 4200, margen: 73 },
  { categoria: "Principales", ventas: 28900, costos: 12400, margen: 57 },
  { categoria: "Postres", ventas: 8200, costos: 2100, margen: 74 },
  { categoria: "Bebidas", ventas: 12400, costos: 3200, margen: 74 },
]

const ingredientUsageData = [
  { name: "Tomate", value: 25, color: "#2C7A7B" },
  { name: "Pollo", value: 20, color: "#ED8936" },
  { name: "Queso", value: 15, color: "#38B2AC" },
  { name: "Cebolla", value: 12, color: "#F6AD55" },
  { name: "Otros", value: 28, color: "#E2E8F0" },
]

const seasonalTrendsData = [
  { periodo: "Q1 2024", primavera: 85, verano: 45, otoño: 92, invierno: 78 },
  { periodo: "Q2 2024", primavera: 92, verano: 88, otoño: 65, invierno: 45 },
  { periodo: "Q3 2024", primavera: 65, verano: 95, otoño: 78, invierno: 52 },
  { periodo: "Q4 2024", primavera: 58, verano: 42, otoño: 88, invierno: 85 },
]

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  const [selectedCategory, setSelectedCategory] = useState("all")

  console.log("[v0] Analytics page rendering")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Avanzado</h1>
          <p className="text-gray-600 mt-1">Análisis profundo de costos, rentabilidad y tendencias</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Mes</SelectItem>
              <SelectItem value="3m">3 Meses</SelectItem>
              <SelectItem value="6m">6 Meses</SelectItem>
              <SelectItem value="1y">1 Año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Costo Promedio</p>
                <p className="text-2xl font-bold text-gray-900">€13.8</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -2.3% vs mes anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margen Promedio</p>
                <p className="text-2xl font-bold text-gray-900">63.2%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +1.8% vs mes anterior
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingredientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">247</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Package className="h-3 w-3 mr-1" />
                  +12 este mes
                </p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requieren atención
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="costs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="costs">Evolución de Costos</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Costos por Mes</CardTitle>
              <CardDescription>Análisis de la evolución de costos totales, unitarios y márgenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={costEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="costoTotal"
                      stroke="#2C7A7B"
                      strokeWidth={2}
                      name="Costo Total (€)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="costoUnitario"
                      stroke="#ED8936"
                      strokeWidth={2}
                      name="Costo Unitario (€)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="margen"
                      stroke="#38B2AC"
                      strokeWidth={2}
                      name="Margen (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ingredientes</span>
                    <span className="text-sm text-gray-600">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "68%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Mano de Obra</span>
                    <span className="text-sm text-gray-600">22%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: "22%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Otros Gastos</span>
                    <span className="text-sm text-gray-600">10%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: "10%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predicciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Tendencia Positiva</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Los costos unitarios muestran una tendencia a la baja del 2.3%
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Proyección Q3</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Se espera un costo promedio de €13.2 para el próximo trimestre
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rentabilidad por Categoría</CardTitle>
              <CardDescription>Comparación de ventas, costos y márgenes por categoría de platos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ventas" fill="#2C7A7B" name="Ventas (€)" />
                    <Bar yAxisId="left" dataKey="costos" fill="#ED8936" name="Costos (€)" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="margen"
                      stroke="#38B2AC"
                      strokeWidth={2}
                      name="Margen (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {profitabilityData.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.categoria}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ventas</span>
                      <span className="font-medium">€{item.ventas.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Costos</span>
                      <span className="font-medium">€{item.costos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Margen</span>
                      <Badge variant={item.margen > 65 ? "default" : item.margen > 55 ? "secondary" : "destructive"}>
                        {item.margen}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingredientes Más Utilizados</CardTitle>
                <CardDescription>Distribución de uso de ingredientes en las recetas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ingredientUsageData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {ingredientUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas de Ingredientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">Tomate Cherry</p>
                        <p className="text-sm text-red-600">Precio aumentó 15%</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Crítico</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Aceite de Oliva</p>
                        <p className="text-sm text-orange-600">Stock bajo</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Medio</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Queso Parmesano</p>
                        <p className="text-sm text-yellow-600">Revisar proveedor</p>
                      </div>
                    </div>
                    <Badge variant="outline">Bajo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Estacionales</CardTitle>
              <CardDescription>Análisis de patrones de consumo por temporada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seasonalTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="primavera"
                      stackId="1"
                      stroke="#22C55E"
                      fill="#22C55E"
                      fillOpacity={0.6}
                      name="Primavera"
                    />
                    <Area
                      type="monotone"
                      dataKey="verano"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                      name="Verano"
                    />
                    <Area
                      type="monotone"
                      dataKey="otoño"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                      name="Otoño"
                    />
                    <Area
                      type="monotone"
                      dataKey="invierno"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Invierno"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Optimización de Menú</h4>
                    <p className="text-sm text-blue-700">
                      Considera aumentar platos de verano en Q2 para maximizar rentabilidad
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Gestión de Inventario</h4>
                    <p className="text-sm text-green-700">Reduce stock de ingredientes de invierno durante Q2-Q3</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Nuevas Oportunidades</h4>
                    <p className="text-sm text-purple-700">Desarrolla más opciones de otoño para Q4</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Eficiencia Estacional</span>
                    <span className="text-sm text-gray-600">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "87%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Adaptabilidad de Menú</span>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Optimización de Costos</span>
                    <span className="text-sm text-gray-600">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
