"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MOCK_CREDENTIALS = [
  { email: "chef@gastroo.com", password: "demo123", name: "Chef Demo", restaurant: "Restaurante Demo" },
  { email: "admin@gastroo.com", password: "admin123", name: "Admin Gastroo", restaurant: "Gastroo HQ" },
  { email: "test@test.com", password: "test123", name: "Usuario Test", restaurant: "Test Restaurant" },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("chef@gastroo.com") // Pre-filled with demo credentials
  const [password, setPassword] = useState("demo123") // Pre-filled with demo password
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    setTimeout(() => {
      const user = MOCK_CREDENTIALS.find((cred) => cred.email === email && cred.password === password)

      if (user) {
        // Simulate successful login
        localStorage.setItem("gastroo_user", JSON.stringify(user))
        console.log("[v0] Login successful:", user)
        router.push("/dashboard")
      } else {
        setError("Credenciales incorrectas. Usa: chef@gastroo.com / demo123")
        console.log("[v0] Login failed for:", { email, password })
      }
      setIsLoading(false)
    }, 1000) // Simulate network delay
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
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu cuenta para gestionar tu restaurante</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-primary/20 bg-primary/5">
              <AlertDescription className="text-sm">
                <strong>Credenciales de prueba:</strong>
                <br />
                Email: chef@gastroo.com
                <br />
                Contraseña: demo123
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="chef@restaurante.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {error && (
                <Alert className="border-destructive/20 bg-destructive/5">
                  <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
