"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChefHat, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "Chef Nuevo", // Pre-filled with demo data
    email: "nuevo@gastroo.com", // Pre-filled with demo email
    password: "nuevo123", // Pre-filled with demo password
    restaurantName: "Mi Nuevo Restaurante", // Pre-filled with demo restaurant
    restaurantType: "restaurant", // Pre-selected restaurant type
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      // Simulate successful registration
      const newUser = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem("gastroo_user", JSON.stringify(newUser))
      console.log("[v0] Registration successful:", newUser)

      setSuccess(true)

      // Redirect to onboarding after success message
      setTimeout(() => {
        router.push("/onboarding")
      }, 2000)

      setIsLoading(false)
    }, 1500) // Simulate network delay
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <ChefHat className="h-12 w-12 text-primary mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-foreground">¡Cuenta Creada!</h2>
              <p className="text-muted-foreground mt-2">
                Bienvenido a Gastroo. Te redirigiremos al proceso de configuración inicial.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">Gastroo</span>
        </div>

        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>Comienza a gestionar tu restaurante profesionalmente</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-accent/20 bg-accent/5">
              <AlertDescription className="text-sm">
                <strong>Datos de ejemplo precargados</strong> - Puedes modificarlos o usar tal como están para probar la
                aplicación.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="chef@restaurante.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                <Input
                  id="restaurantName"
                  type="text"
                  placeholder="La Cocina de Juan"
                  value={formData.restaurantName}
                  onChange={(e) => handleInputChange("restaurantName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantType">Tipo de Negocio</Label>
                <Select
                  value={formData.restaurantType}
                  onValueChange={(value) => handleInputChange("restaurantType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurante</SelectItem>
                    <SelectItem value="cafe">Café/Cafetería</SelectItem>
                    <SelectItem value="bakery">Panadería</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="food-truck">Food Truck</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta Gratis"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
