"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, Filter, ChevronDown, Plus, MoreVertical, Calendar, Building, Package, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"

interface Purchase {
  id: string
  purchase_date: string
  total_amount: number
  status: string
  notes?: string | null
  suppliers?: {
    name: string
  } | null
}

export default function PurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showBanner, setShowBanner] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()
  const menuRef = useRef<HTMLDivElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPurchases()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setOpenStatusMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)
      const data = await DatabaseService.getPurchases()
      setPurchases(data || [])
    } catch (error) {
      console.error("Error loading purchases:", error)
      toast.error("Error al cargar compras")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)

      const { error } = await DatabaseService.supabase
        .from('purchases')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Compra eliminada correctamente')
      loadPurchases()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting purchase:', error)
      toast.error('Error al eliminar compra')
      setDeleteLoading(false)
    }
  }

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleView = (purchase: Purchase) => {
    router.push(`/purchases/${purchase.id}`)
    setOpenMenuId(null)
  }

  const handleEdit = (purchase: Purchase) => {
    router.push(`/purchases/${purchase.id}/edit`)
    setOpenMenuId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Pagado</span>
      case "unpaid":
      case "pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Por Pagar</span>
      case "cancelled":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Cancelada</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">Desconocido</span>
    }
  }

  const getStatusLabel = () => {
    if (statusFilter === "all") return "Todos los estados"
    if (statusFilter === "paid" || statusFilter === "completed") return "Pagadas"
    if (statusFilter === "unpaid" || statusFilter === "pending") return "Por Pagar"
    if (statusFilter === "cancelled") return "Canceladas"
    return "Todos los estados"
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      (purchase.suppliers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Cálculos de estadísticas
  const totalPurchases = purchases.length
  const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0)
  const completedPurchases = purchases.filter((purchase) => purchase.status === "paid" || purchase.status === "completed").length
  const paidPercentage = totalPurchases > 0 ? ((completedPurchases / totalPurchases) * 100).toFixed(1) : "0.0"
  const pendingAmount = purchases
    .filter((purchase) => purchase.status === "unpaid" || purchase.status === "pending")
    .reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Banner de información */}
        {showBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
              i
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>Módulo de Compras:</strong> Aquí podrás registrar todas tus compras que afectarán automáticamente el inventario de productos.
                Puedes registrar las compras de forma manual o simplemente subir una foto de la factura y la aplicación se encargará de analizarla
                y registrar la compra automáticamente por ti.
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Compras</div>
            <div className="text-3xl font-bold text-gray-900">{totalPurchases}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Gasto Total</div>
            <div className="text-3xl font-bold text-gray-900">€{totalSpent.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Pagadas</div>
            <div className="text-3xl font-bold text-green-600">{paidPercentage}%</div>
            <div className="text-xs text-gray-500 mt-1">{completedPurchases} de {totalPurchases}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Por pagar</div>
            <div className="text-3xl font-bold text-orange-600">€{pendingAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setOpenStatusMenu(!openStatusMenu)}
              className={cn(
                "px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer",
                statusFilter !== "all" && "border-blue-500 bg-blue-50"
              )}
            >
              <Filter size={18} />
              {getStatusLabel()}
              <ChevronDown size={18} />
            </button>

            {openStatusMenu && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setStatusFilter("all")
                    setOpenStatusMenu(false)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    statusFilter === "all" && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Todos los estados
                </button>
                <button
                  onClick={() => {
                    setStatusFilter("paid")
                    setOpenStatusMenu(false)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    (statusFilter === "paid" || statusFilter === "completed") && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Pagadas
                </button>
                <button
                  onClick={() => {
                    setStatusFilter("unpaid")
                    setOpenStatusMenu(false)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    (statusFilter === "unpaid" || statusFilter === "pending") && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Por Pagar
                </button>
                <button
                  onClick={() => {
                    setStatusFilter("cancelled")
                    setOpenStatusMenu(false)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                    statusFilter === "cancelled" && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  Canceladas
                </button>
              </div>
            )}
          </div>

          <Link href="/purchases/create">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm cursor-pointer">
              <Plus className="inline-block mr-2" size={18} />
              Nueva Compra
            </button>
          </Link>
        </div>

        {/* Tabla de compras */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Encabezados de tabla */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-2">Fecha</div>
            <div className="col-span-3">Proveedor</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2">Notas</div>
            <div className="col-span-1"></div>
          </div>

          {/* Filas de compras */}
          {filteredPurchases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay compras</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron compras con los filtros aplicados"
                  : "Comienza registrando tu primera compra"}
              </p>
              <Link href="/purchases/create">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  <Plus className="inline-block mr-2" size={18} />
                  Nueva Compra
                </button>
              </Link>
            </div>
          ) : (
            filteredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 items-center transition-colors"
              >
                <div className="col-span-2 flex items-center gap-2 text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  {new Date(purchase.purchase_date).toLocaleDateString('es-ES')}
                </div>

                <div className="col-span-3 flex items-center gap-2 text-gray-700">
                  <Building size={16} className="text-gray-400" />
                  {purchase.suppliers?.name || 'Sin proveedor'}
                </div>

                <div className="col-span-2 text-gray-900 font-semibold">
                  €{(purchase.total_amount || 0).toFixed(2)}
                </div>

                <div className="col-span-2">
                  {getStatusBadge(purchase.status)}
                </div>

                <div className="col-span-2 text-gray-700 text-sm truncate">
                  {purchase.notes || 'Sin notas'}
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <div
                    className="relative"
                    ref={openMenuId === purchase.id ? menuRef : null}
                  >
                    <button
                      onClick={() => toggleMenu(purchase.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {openMenuId === purchase.id && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <button
                          onClick={() => handleView(purchase)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Ver detalles
                        </button>
                        <button
                          onClick={() => handleEdit(purchase)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null)
                            openDeleteModal(purchase)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Información de resultados */}
        {filteredPurchases.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredPurchases.length} compra(s)
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Compra"
        description="¿Estás seguro de que deseas eliminar la compra del"
        itemName={`${new Date(deleteModal.item?.purchase_date || '').toLocaleDateString('es-ES')} - ${deleteModal.item?.suppliers?.name || 'Sin proveedor'}`}
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}
