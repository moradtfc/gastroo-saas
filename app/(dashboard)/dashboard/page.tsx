"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  ChefHat,
  AlertTriangle,
  Users,
  Calendar,
} from "lucide-react"

const costData = [
  { month: "Ene", cost: 2400 },
  { month: "Feb", cost: 2210 },
  { month: "Mar", cost: 2290 },
  { month: "Abr", cost: 2000 },
  { month: "May", cost: 2181 },
  { month: "Jun", cost: 2500 },
]

const profitabilityData = [
  { name: "Entrantes", value: 35, color: "#2C7A7B" },
  { name: "Principales", value: 45, color: "#ED8936" },
  { name: "Postres", value: 20, color: "#4A5568" },
]

const recentRecipes = [
  { name: "Paella Valenciana", cost: "€12.50", margin: "65%", trend: "up" },
  { name: "Gazpacho Andaluz", cost: "€3.20", margin: "78%", trend: "up" },
  { name: "Tortilla Española", cost: "€4.80", margin: "72%", trend: "down" },
  { name: "Pulpo a la Gallega", cost: "€18.90", margin: "58%", trend: "up" },
]

const alerts = [
  { type: "price", message: "El precio del aceite de oliva ha subido un 15%", severity: "high" },
  { type: "stock", message: "Stock bajo de tomates cherry", severity: "medium" },
  { type: "cost", message: "Coste de la paella por encima del objetivo", severity: "low" },
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-accent/5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Resumen de tu restaurante y métricas clave</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm border-primary/20 bg-primary/5">
            <Calendar className="w-4 h-4 mr-2" />
            Última actualización: Hoy
          </Badge>
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Coste Promedio</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€2,245</div>
            <p className="text-sm text-muted-foreground flex items-center mt-2">
              <TrendingDown className="w-4 h-4 mr-2 text-green-500" />
              -12% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-secondary/10 hover:border-secondary/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Ingredientes Activos</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">156</div>
            <p className="text-sm text-muted-foreground flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              +8 nuevos esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-accent/20 hover:border-accent/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Recetas Creadas</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-accent/30 to-accent/20 rounded-lg flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">42</div>
            <p className="text-sm text-muted-foreground flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              +5 este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Margen Promedio</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">68%</div>
            <p className="text-sm text-muted-foreground flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              +2.5% desde el mes pasado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Evolución de Costes</CardTitle>
            <CardDescription>
              Costes mensuales de ingredientes en los últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value) => [`€${value}`, "Coste"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Rentabilidad por Categoría</CardTitle>
            <CardDescription>Distribución de márgenes por tipo de plato</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profitabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Recetas Recientes</CardTitle>
            <CardDescription>Últimas recetas creadas y su rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRecipes.map((recipe, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{recipe.name}</p>
                      <p className="text-sm text-muted-foreground">Coste: {recipe.cost}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={recipe.trend === "up" ? "default" : "secondary"} className="font-medium">
                      {recipe.margin}
                    </Badge>
                    {recipe.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/90 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Alertas y Notificaciones</CardTitle>
            <CardDescription>Avisos importantes sobre precios y stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50 hover:border-primary/20 transition-all duration-300"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      alert.severity === "high"
                        ? "bg-gradient-to-br from-red-100 to-red-50"
                        : alert.severity === "medium"
                          ? "bg-gradient-to-br from-yellow-100 to-yellow-50"
                          : "bg-gradient-to-br from-blue-100 to-blue-50"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        alert.severity === "high"
                          ? "text-red-500"
                          : alert.severity === "medium"
                            ? "text-yellow-500"
                            : "text-blue-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{alert.message}</p>
                    <Badge variant="outline" className="mt-2 text-xs border-primary/20">
                      {alert.severity === "high" ? "Alta" : alert.severity === "medium" ? "Media" : "Baja"} prioridad
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
