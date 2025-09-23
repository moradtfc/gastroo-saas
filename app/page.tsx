import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Calculator, BarChart3, Users } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Gastroo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90">Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
            Gestiona los costos de tu restaurante de manera <span className="text-primary">profesional</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Controla ingredientes, escandallos y menús con la plataforma más completa para restaurantes, chefs y
            negocios gastronómicos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Comenzar Prueba Gratuita
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Todo lo que necesitas para gestionar tu negocio
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Gestión de Costos</CardTitle>
                <CardDescription>
                  Calcula automáticamente el costo de cada plato y optimiza tus márgenes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <ChefHat className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Escandallos</CardTitle>
                <CardDescription>
                  Crea y gestiona recetas profesionales con control total de ingredientes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Reportes detallados y métricas para tomar mejores decisiones</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Colaboración</CardTitle>
                <CardDescription>Trabaja en equipo con roles y permisos personalizados</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">¿Listo para optimizar tu restaurante?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Únete a cientos de restaurantes que ya confían en Gastroo para gestionar sus costos
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Comenzar Ahora - Es Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Gastroo</span>
          </div>
          <p className="text-muted-foreground">© 2024 Gastroo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
