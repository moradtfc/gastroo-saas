"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Receipt, AlertTriangle } from "lucide-react"

// Mock expense data
const mockExpense = {
  id: 1,
  date: "2024-01-15",
  description: "Factura de electricidad - Enero 2024",
  category: "Servicios",
  amount: 280.75,
  type: "manual",
  supplier: "Iberdrola",
  notes:
    "Factura correspondiente al consumo eléctrico del mes de enero. Incluye iluminación, equipos de cocina y refrigeración.",
}

export default function EditExpensePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    description: mockExpense.description,
    amount: mockExpense.amount.toString(),
    category: mockExpense.category,
    supplier: mockExpense.supplier,
    date: mockExpense.date,
    notes: mockExpense.notes,
  })

  const categories = [
    "Ingredientes",
    "Servicios",
    "Mantenimiento",
    "Alquiler",
    "Personal",
    "Marketing",
    "Equipamiento",
    "Transporte",
    "Seguros",
    "Otros",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Updating expense:", formData)

    // Simulate API call
    setTimeout(() => {
      router.push(`/expenses/${params.id}`)
    }, 1000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Check if this is an automatic expense (can't be edited)
  if (mockExpense.type === "automatic") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/expenses/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Gasto</h1>
            <p className="text-gray-600 mt-1">Gasto #{params.id}</p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">No se puede editar</h3>
                <p className="text-sm text-red-800 mt-1">
                  Este gasto se registró automáticamente al añadir ingredientes al inventario. Los gastos automáticos no
                  se pueden editar directamente. Para modificar este gasto, edita el ingrediente correspondiente en el
                  inventario.
                </p>
                <div className="mt-4">
                  <Link href="/ingredients">
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent">
                      Ir a Inventario
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/expenses/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Gasto</h1>
          <p className="text-gray-600 mt-1">Gasto #{params.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Editar Información del Gasto
              </CardTitle>
              <CardDescription>Modifica los campos necesarios y guarda los cambios</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Input
                      id="description"
                      placeholder="Ej: Factura de electricidad"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Importe (€) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Proveedor/Empresa *</Label>
                    <Input
                      id="supplier"
                      placeholder="Ej: Iberdrola, Mercado Central"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange("supplier", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha del Gasto *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional sobre el gasto..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Link href={`/expenses/${params.id}`}>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Cambios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Importe Original:</span>
                <span className="font-semibold text-gray-500">€{mockExpense.amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nuevo Importe:</span>
                <span className="font-semibold text-red-600">
                  €{formData.amount ? Number.parseFloat(formData.amount).toFixed(2) : "0.00"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diferencia:</span>
                <span
                  className={`font-semibold ${
                    formData.amount
                      ? Number.parseFloat(formData.amount) - mockExpense.amount > 0
                        ? "text-red-600"
                        : "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {formData.amount
                    ? (Number.parseFloat(formData.amount) - mockExpense.amount > 0 ? "+" : "") +
                      (Number.parseFloat(formData.amount) - mockExpense.amount).toFixed(2)
                    : "0.00"}
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <Badge variant="secondary">{formData.category || "Sin seleccionar"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  Los cambios en este gasto afectarán el cálculo del capital actual de tu empresa.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
