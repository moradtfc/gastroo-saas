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
import { Plus, DollarSign, AlertTriangle, Calendar, Receipt, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateExpensePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    notes: "",
  })

  console.log("[v0] Rendering CreateExpensePage - this is the CREATION form")

  const currentCapital = 15420.5
  const impactAmount = Number.parseFloat(formData.amount) || 0
  const newCapital = currentCapital - impactAmount
  const isLowCapital = newCapital < 5000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("[v0] Creating new expense:", formData)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      router.push("/expenses")
    }, 2000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Nuevo Gasto
          </h1>
          <p className="text-muted-foreground">Añade un nuevo gasto o costo operativo al sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-16">
                <Plus className="w-20 h-20" />
                Información del Gasto
              </CardTitle>
              <CardDescription>Completa todos los campos obligatorios para registrar el gasto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Descripción *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Ej: Factura de electricidad - Enero 2024"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingredientes">Ingredientes</SelectItem>
                        <SelectItem value="servicios">Servicios</SelectItem>
                        <SelectItem value="equipamiento">Equipamiento</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="alquiler">Alquiler</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="supplier">Proveedor/Empresa</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange("supplier", e.target.value)}
                      placeholder="Ej: Iberdrola, Mercadona, etc."
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Importe (€) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date" className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Fecha del Gasto *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Información adicional sobre el gasto..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-32">
          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Impacto Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capital Actual:</span>
                  <span className="font-semibold text-green-600">€{currentCapital.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gasto:</span>
                  <span className="font-semibold text-red-600">-€{impactAmount.toFixed(2)}</span>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Nuevo Capital:</span>
                  <span className={`font-bold ${isLowCapital ? "text-red-600" : "text-green-600"}`}>
                    €{newCapital.toFixed(2)}
                  </span>
                </div>
              </div>

              {isLowCapital && impactAmount > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Capital Bajo</p>
                      <p className="text-xs text-red-700 mt-1">Este gasto dejará tu capital por debajo de €5,000</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !formData.description || !formData.category || !formData.amount}
                >
                  {isLoading ? "Registrando..." : "Registrar Gasto"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => router.push("/expenses")}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Consejo</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Los gastos de ingredientes se registran automáticamente. Solo registra manualmente otros costos
                    operativos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
