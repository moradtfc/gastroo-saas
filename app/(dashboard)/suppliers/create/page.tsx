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
import { Save, Building, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"

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

export default function CreateSupplierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supplierData = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        website: formData.website || null,
        category: formData.category || null,
        email: formData.email || null,
        contact_person: formData.contactPerson || null,
        notes: formData.notes || null,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
      }

      await DatabaseService.createSupplier(supplierData)
      toast.success("Proveedor creado exitosamente")
      router.push("/suppliers")
    } catch (error) {
      console.error('Error creating supplier:', error)
      toast.error("Error al crear proveedor")
    } finally {
      setLoading(false)
    }
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Nuevo Proveedor
          </h1>
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
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <DatePicker
                    date={birthDate}
                    onDateChange={setBirthDate}
                    placeholder="Seleccionar fecha de nacimiento"
                  />
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
                disabled={!isFormValid() || loading}
              >
                <Save className="h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Proveedor"}
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
