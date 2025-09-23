"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Building, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { useRouter, useSearchParams } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"

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

interface EditSupplierPageProps {
  params: {
    id: string
  }
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supplier, setSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    email: "",
    contactPerson: "",
    category: "",
    notes: "",
  })

  // Determine back URL based on where user came from
  const getBackUrl = () => {
    const from = searchParams.get('from')
    if (from === 'list') {
      return '/suppliers'
    }
    return `/suppliers/${params.id}`
  }

  useEffect(() => {
    loadSupplier()
  }, [params.id])

  const loadSupplier = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await DatabaseService.supabase
        .from('suppliers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Proveedor no encontrado')

      setSupplier(data)
      setFormData({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        website: data.website || "",
        email: data.email || "",
        contactPerson: data.contact_person || "",
        category: data.category || "",
        notes: data.notes || "",
      })
    } catch (error: any) {
      console.error('Error loading supplier:', error)
      setError(error.message || 'Error al cargar proveedor')
      toast.error('Error al cargar proveedor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        website: formData.website || null,
        email: formData.email || null,
        contact_person: formData.contactPerson || null,
        category: formData.category || null,
        notes: formData.notes || null,
      }

      const { error } = await DatabaseService.supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', params.id)

      if (error) throw error

      toast.success("Proveedor actualizado exitosamente")
      router.push(getBackUrl())
    } catch (error: any) {
      console.error('Error updating supplier:', error)
      toast.error("Error al actualizar proveedor")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="p-4 sm:p-8 space-y-8 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2">
                <Button onClick={loadSupplier} className="w-full">
                  Reintentar
                </Button>
                <Link href={getBackUrl()}>
                  <Button variant="outline" className="w-full">
                    Volver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <BackButton href={getBackUrl()} />
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Editar Proveedor
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Modifica la información del proveedor
                </p>
              </div>
            </div>
          </div>

          {/* Form Content - Responsive Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Form - Takes 2 columns on XL screens */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Building className="h-5 w-5 text-primary" />
                    Información Básica
                  </CardTitle>
                  <CardDescription>
                    Detalles principales del proveedor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre del Proveedor *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ej: Mercado Central"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">
                        Categoría
                      </Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger className="h-10">
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
                    <Label htmlFor="address" className="text-sm font-medium">
                      Dirección
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Ej: Calle Mayor 123, Madrid"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+34 91 123 4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contacto@proveedor.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-sm font-medium">
                        Sitio Web
                      </Label>
                      <Input
                        id="website"
                        placeholder="www.proveedor.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-sm font-medium">
                        Persona de Contacto
                      </Label>
                      <Input
                        id="contactPerson"
                        placeholder="Ej: Juan García"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notas
                    </Label>
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

            {/* Action Panel - Sidebar on XL screens */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Acciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                    <Link href={getBackUrl()}>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 font-medium"
                      >
                        Cancelar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Información Rápida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Creado:</span>
                      <span className="font-medium">
                        {new Date(supplier.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Actualizado:</span>
                      <span className="font-medium">
                        {new Date(supplier.updated_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}