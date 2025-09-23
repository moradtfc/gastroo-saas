"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Trash2, Calendar, Building, Package, FileText, AlertTriangle } from "lucide-react"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [purchase, setPurchase] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    if (params.id === "new") {
      router.replace("/purchases/create")
      return
    }
    loadPurchase()
  }, [params.id, router])

  const loadPurchase = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DatabaseService.getPurchase(params.id)
      setPurchase(data)
    } catch (error: any) {
      console.error('Error loading purchase:', error)
      setError('Error al cargar la compra')
      toast.error('Error al cargar la compra')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      const result = await DatabaseService.deletePurchase(deleteModal.item.id)
      
      toast.success('Compra eliminada correctamente')
      toast.info('El inventario ha sido actualizado')
      
      if (result.deletedExpenseAmount > 0) {
        toast.info(`Gasto asociado eliminado: €${result.deletedExpenseAmount.toFixed(2)}`)
      }
      router.push('/purchases')
      closeDeleteModal()
    } catch (error: any) {
      console.error('Error deleting purchase:', error)
      toast.error(error.message || 'Error al eliminar compra')
      setDeleteLoading(false)
    }
  }

  if (params.id === "new") {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {error || 'No se pudo encontrar la compra'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/purchases')} variant="outline" className="flex-1">
                  Volver a Compras
                </Button>
                <Button onClick={loadPurchase} className="flex-1">
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completada</Badge>
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const totalItems = purchase.purchase_items?.length || 0

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/purchases">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Compras
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle de Compra</h1>
            <p className="text-gray-600 mt-1">Información completa de la compra</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/purchases/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-transparent"
            onClick={() => openDeleteModal(purchase)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Información de la Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Fecha de Compra
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(purchase.purchase_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      Proveedor
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {purchase.suppliers?.name || 'Sin proveedor'}
                    </p>
                    {purchase.suppliers?.phone && (
                      <p className="text-sm text-gray-600">{purchase.suppliers.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado</label>
                    <div className="mt-1">
                      {getStatusBadge(purchase.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total de Artículos</label>
                    <p className="text-lg font-semibold text-gray-900">{totalItems} artículos</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Monto Total</label>
                    <p className="text-3xl font-bold text-primary">€{(purchase.total_amount || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {purchase.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Notas
                  </label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{purchase.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Artículos Comprados</CardTitle>
              <CardDescription>{totalItems} artículo(s) en esta compra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.purchase_items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.ingredients?.name || 'Ingrediente desconocido'}
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit_info?.symbol || item.unit}
                        </TableCell>
                        <TableCell>€{(item.unit_cost || 0).toFixed(2)}</TableCell>
                        <TableCell className="font-bold">€{(item.total_cost || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Impacto de la Compra</CardTitle>
              <CardDescription>Actualizaciones automáticas realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Stock Actualizado</h4>
                  <p className="text-sm text-green-700">
                    Se agregaron {totalItems} ingredientes al inventario automáticamente.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Gasto Registrado</h4>
                  <p className="text-sm text-blue-700">
                    Se registró un gasto automático de €{(purchase.total_amount || 0).toFixed(2)} en la sección de gastos.
                  </p>
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
                  {new Date(purchase.created_at).toLocaleDateString("es-ES", {
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
                  {new Date(purchase.updated_at).toLocaleDateString("es-ES", {
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

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Integración Automática</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Esta compra actualizó automáticamente el stock de ingredientes y se registró como gasto en el
                    sistema financiero.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Package className="w-4 h-4 mr-2" />
                Duplicar Compra
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Compra"
        description="¿Estás seguro de que deseas eliminar la compra del"
        itemName={`${new Date(purchase.purchase_date).toLocaleDateString('es-ES')} - ${purchase.suppliers?.name || 'Sin proveedor'}`}
        additionalInfo="⚠️ Al eliminar esta compra se realizarán las siguientes acciones automáticamente:"
        warningItems={[
          "📦 Los ingredientes de esta compra se restarán del inventario",
          "💰 El gasto asociado será eliminado de los registros",
          "🏢 El capital de la empresa será ajustado automáticamente"
        ]}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}