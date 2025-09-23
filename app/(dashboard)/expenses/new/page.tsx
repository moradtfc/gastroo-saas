"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Receipt, AlertTriangle, TrendingDown, Calculator } from "lucide-react"
import Link from "next/link"

export default function NewExpensePage() {
  console.log("[v0] NewExpensePage component rendering - CREATE EXPENSE VIEW")
  console.log("[v0] This is the EXPENSE CREATION FORM, not detail view")

  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const currentCapital = 15750.0

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

  const isFormValid = () => {
    return (
      formData.description.trim() !== "" &&
      formData.amount !== "" &&
      Number.parseFloat(formData.amount) > 0 &&
      formData.category !== "" &&
      formData.supplier.trim() !== "" &&
      formData.date !== ""
    )
  }

  const calculateImpact = () => {
    const amount = Number.parseFloat(formData.amount) || 0
    const newCapital = currentCapital - amount
    const impactPercentage = ((amount / currentCapital) * 100).toFixed(1)
    return { newCapital, impactPercentage, amount }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setIsSubmitting(true)
    console.log("[v0] Creating expense:", formData)

    // Simulate API call
    setTimeout(() => {
      router.push("/expenses")
    }, 1500)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const { newCapital, impactPercentage, amount } = calculateImpact()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-primary text-white p-4 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">CREAR NUEVO GASTO</h1>
            <p className="text-primary-foreground/80">Formulario de registro de gastos y costos operativos</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Gastos
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Receipt className="w-5 h-5" />
                  Información del Gasto
                </CardTitle>
                <CardDescription>Completa todos los campos obligatorios para registrar el gasto</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción *</Label>
                      <Input
                        id="description"
                        placeholder="Ej: Factura de electricidad"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className={formData.description.trim() === "" ? "border-red-300" : ""}
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
                        className={
                          formData.amount === "" || Number.parseFloat(formData.amount) <= 0 ? "border-red-300" : ""
                        }
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
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                          formData.category === "" ? "border-red-300" : "border-gray-300"
                        }`}
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
                        className={formData.supplier.trim() === "" ? "border-red-300" : ""}
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
                      className={formData.date === "" ? "border-red-300" : ""}
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
                    <Button type="submit" className="flex-1" disabled={!isFormValid() || isSubmitting}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Guardando..." : "Guardar Gasto"}
                    </Button>
                    <Link href="/expenses">
                      <Button type="button" variant="outline" disabled={isSubmitting}>
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Summary Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Resumen del Gasto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Importe:</span>
                  <span className="font-semibold text-lg">
                    €{formData.amount ? Number.parseFloat(formData.amount).toFixed(2) : "0.00"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <span className="font-medium">{formData.category || "Sin seleccionar"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fecha:</span>
                  <span className="font-medium">{formData.date}</span>
                </div>

                {amount > 0 && (
                  <>
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Impacto en Capital
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Capital actual:</span>
                          <span className="font-medium">€{currentCapital.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Después del gasto:</span>
                          <span className={`font-medium ${newCapital < 5000 ? "text-red-600" : "text-gray-900"}`}>
                            €{newCapital.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Impacto:</span>
                          <span className="font-medium text-red-600">-{impactPercentage}%</span>
                        </div>
                      </div>

                      {newCapital < 5000 && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-800">
                              <strong>Advertencia:</strong> Este gasto dejará el capital por debajo de €5,000
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Gastos Automáticos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Los ingredientes registrados en el inventario se añaden automáticamente como gastos. Este formulario
                  es para gastos operativos adicionales.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
