"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Receipt, Calendar, DollarSign, Building, FileText, AlertTriangle } from "lucide-react"

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
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
}

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (params.id === "new") {
      router.replace("/expenses/create")
      return
    }
  }, [params.id, router])

  if (params.id === "new") {
    return null
  }

  const handleDelete = () => {
    console.log("Deleting expense:", params.id)
    // Simulate API call and redirect
    setTimeout(() => {
      window.location.href = "/expenses"
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Gastos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Gasto</h1>
            <p className="text-gray-600 mt-1">Gasto #{params.id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {mockExpense.type === "manual" && (
            <>
              <Link href={`/expenses/${params.id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-transparent"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Información del Gasto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Descripción</label>
                    <p className="text-lg font-semibold text-gray-900">{mockExpense.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Categoría</label>
                    <div className="mt-1">
                      <Badge variant="secondary">{mockExpense.category}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo de Gasto</label>
                    <div className="mt-1">
                      <Badge variant={mockExpense.type === "automatic" ? "default" : "outline"}>
                        {mockExpense.type === "automatic" ? "Automático" : "Manual"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Importe</label>
                    <p className="text-2xl font-bold text-red-600">-€{mockExpense.amount.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Fecha del Gasto
                    </label>
                    <p className="text-lg text-gray-900">{mockExpense.date}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      Proveedor/Empresa
                    </label>
                    <p className="text-lg text-gray-900">{mockExpense.supplier}</p>
                  </div>
                </div>
              </div>

              {mockExpense.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Notas Adicionales
                  </label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{mockExpense.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Impacto Financiero</CardTitle>
              <CardDescription>Cómo afecta este gasto a las finanzas de tu restaurante</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Impacto en Capital</p>
                  <p className="text-lg font-bold text-red-600">-€{mockExpense.amount.toFixed(2)}</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Receipt className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">% del Total Mensual</p>
                  <p className="text-lg font-bold text-blue-600">12.8%</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Días para Recuperar</p>
                  <p className="text-lg font-bold text-orange-600">3.2 días</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Creado</label>
                <p className="text-sm text-gray-900">
                  {new Date(mockExpense.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Última Modificación</label>
                <p className="text-sm text-gray-900">
                  {new Date(mockExpense.updatedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {mockExpense.type === "automatic" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Gasto Automático</h3>
                    <p className="text-sm text-blue-800 mt-1">
                      Este gasto se registró automáticamente al añadir ingredientes al inventario. No se puede editar
                      directamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="w-4 h-4 mr-2" />
                Exportar Detalle
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Receipt className="w-4 h-4 mr-2" />
                Duplicar Gasto
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer y afectará el cálculo
                del capital de tu empresa.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700">
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
