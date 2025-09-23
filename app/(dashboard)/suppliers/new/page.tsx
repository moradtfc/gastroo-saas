"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Building } from "lucide-react"
import Link from "next/link"

const categoryOptions = [
  "Verduras y Frutas",
  "Carnes y Embutidos",
  "Pescados y Mariscos",
  "Lácteos",
  "Cereales y Legumbres",
  "Aceites y Condimentos",
  "Bebidas",
  "Equipamiento",
  "Servicios",
  "Otros",
]

export default function NewSupplierPage() {
  console.log("[v0] NewSupplierPage rendering - Suppliers creation form")

  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    category: "",
    email: "",
    contactPerson: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Supplier form submitted:", formData)
    setTimeout(() => {
      alert("Proveedor creado exitosamente")
      router.push("/suppliers")
    }, 500)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.address.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.category !== ""
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-6">
        <h2 className="text-xl font-bold">✓ Formulario de Creación de Proveedor</h2>
        <p className="text-sm opacity-90">Esta es la vista de registro de nuevo proveedor</p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/suppliers">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Proveedor</h1>
          <p className="text-muted-foreground">Registra un nuevo proveedor o empresa de suministro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Información Básica
                </CardTitle>
                <CardDescription>Datos principales del proveedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Proveedor *</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Mercado Central"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    placeholder="Calle, número, ciudad"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      placeholder="+34 123 456 789"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      placeholder="www.ejemplo.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
                <CardDescription>Datos adicionales de contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@proveedor.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Persona de Contacto</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Nombre del contacto"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional sobre el proveedor..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>Vista previa del proveedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{formData.name || "Sin especificar"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Categoría</Label>
                  <p className="font-medium">{formData.category || "Sin especificar"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{formData.phone || "Sin especificar"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Dirección</Label>
                  <p className="font-medium text-sm">{formData.address || "Sin especificar"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 flex items-center gap-2"
                disabled={!isFormValid()}
              >
                <Save className="h-4 w-4" />
                Guardar Proveedor
              </Button>
              <Link href="/suppliers">
                <Button variant="outline" className="w-full bg-transparent">
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
