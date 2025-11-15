"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, Filter, ChevronDown, Plus, MoreVertical, Calendar, Building, Package, Eye, Edit, Trash2, Upload, ChevronLeft, ChevronRight, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DatabaseService } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useDeleteModal } from "@/hooks/use-delete-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UploadInvoiceModal } from "@/components/purchases/UploadInvoiceModal"

interface Purchase {
  id: string
  name: string
  description?: string | null
  purchase_date: string
  total_amount: number
  status: string
  notes?: string | null
  suppliers?: {
    name: string
  } | null
}

type SortField = 'date' | 'amount' | null
type SortOrder = 'asc' | 'desc'

export default function PurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showBanner, setShowBanner] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openFilterMenu, setOpenFilterMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)

  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()
  const menuRef = useRef<HTMLDivElement>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)

  const itemsPerPage = 12

  useEffect(() => {
    loadPurchases()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setOpenFilterMenu(false)
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
    router.push(`/purchases/${purchase.id}`)
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

  const applyFilters = () => {
    let filtered = [...purchases]

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((purchase) =>
        (purchase.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.suppliers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((purchase) => {
        if (statusFilter === "paid") {
          return purchase.status === "paid" || purchase.status === "completed"
        }
        if (statusFilter === "unpaid") {
          return purchase.status === "unpaid" || purchase.status === "pending"
        }
        return purchase.status === statusFilter
      })
    }

    // Filtro de rango de fechas
    if (dateFrom) {
      filtered = filtered.filter((purchase) =>
        new Date(purchase.purchase_date) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      filtered = filtered.filter((purchase) =>
        new Date(purchase.purchase_date) <= new Date(dateTo)
      )
    }

    // Ordenamiento
    if (sortField === 'date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.purchase_date).getTime()
        const dateB = new Date(b.purchase_date).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    } else if (sortField === 'amount') {
      filtered.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.total_amount - b.total_amount
          : b.total_amount - a.total_amount
      })
    }

    return filtered
  }

  const filteredPurchases = applyFilters()

  // Paginación
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
    setSortField(null)
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || sortField !== null

  const handleInvoiceSuccess = async (data: any) => {
    try {
      setLoading(true)

      // Validar artículos contra inventario
      const articles = await DatabaseService.getArticles()
      const suppliers = await DatabaseService.getSuppliers()

      // Buscar o crear proveedor
      let supplier = suppliers?.find(s =>
        s.name.toLowerCase().includes(data.supplier.toLowerCase()) ||
        data.supplier.toLowerCase().includes(s.name.toLowerCase())
      )

      if (!supplier) {
        toast.info(`Proveedor "${data.supplier}" no encontrado. Créalo primero en la sección de Proveedores.`)
        setLoading(false)
        return
      }

      // Validar artículos y preparar items
      const validatedItems = []
      const missingArticles = []

      for (const item of data.items) {
        const article = articles?.find(a =>
          a.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(a.name.toLowerCase())
        )

        if (article) {
          validatedItems.push({
            article_id: article.id,
            quantity: item.quantity,
            unit: article.unit_id || article.default_unit_id,
            unit_cost: item.price,
            total_cost: item.total
          })
        } else {
          missingArticles.push(item.name)
        }
      }

      if (missingArticles.length > 0) {
        toast.error(
          `Los siguientes artículos no existen en tu inventario: ${missingArticles.join(', ')}. Por favor créalos primero.`,
          { duration: 8000 }
        )
        setLoading(false)
        return
      }

      // Crear compra
      const purchaseData = {
        name: data.purchaseName,
        supplier_id: supplier.id,
        purchase_date: data.date,
        total_amount: data.subtotal,
        status: data.status,
        items: validatedItems
      }

      await DatabaseService.createPurchase(purchaseData)

      // Actualizar inventario automáticamente
      for (const item of data.items) {
        const article = articles?.find(a =>
          a.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(a.name.toLowerCase())
        )

        if (article) {
          const currentStock = article.current_stock || 0
          const currentPrice = article.cost_per_unit || 0
          const newStock = currentStock + item.quantity

          // Calcular precio promedio ponderado
          const totalCurrentValue = currentStock * currentPrice
          const totalNewValue = item.quantity * (item.price / item.quantity)
          const averagePrice = newStock > 0 ? (totalCurrentValue + totalNewValue) / newStock : (item.price / item.quantity)

          await DatabaseService.updateIngredient(article.id, {
            current_stock: newStock,
            cost_per_unit: averagePrice
          })
        }
      }

      toast.success("Compra creada exitosamente desde la factura")
      await loadPurchases()
    } catch (error: any) {
      console.error('Error creating purchase from invoice:', error)
      toast.error(error.message || "Error al crear la compra")
    } finally {
      setLoading(false)
    }
  }

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
              placeholder="Buscar compra, proveedor o descripción..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setOpenFilterMenu(!openFilterMenu)}
              className={cn(
                "px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap",
                hasActiveFilters && "border-blue-500 bg-blue-50"
              )}
            >
              <Filter size={18} />
              Ordenar y Filtrar
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {[statusFilter !== "all", dateFrom, dateTo, sortField !== null].filter(Boolean).length}
                </span>
              )}
              <ChevronDown size={18} />
            </button>

            {openFilterMenu && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Ordenar y Filtrar</h3>
                  <button
                    onClick={() => setOpenFilterMenu(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Ordenar */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ordenar por</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (sortField === 'date' && sortOrder === 'desc') {
                            setSortOrder('asc')
                          } else {
                            setSortField('date')
                            setSortOrder('desc')
                          }
                          setCurrentPage(1)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                          sortField === 'date'
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        Fecha {sortField === 'date' && (sortOrder === 'asc' ? '(Ascendente)' : '(Descendente)')}
                      </button>
                      <button
                        onClick={() => {
                          if (sortField === 'amount' && sortOrder === 'desc') {
                            setSortOrder('asc')
                          } else {
                            setSortField('amount')
                            setSortOrder('desc')
                          }
                          setCurrentPage(1)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                          sortField === 'amount'
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        Monto {sortField === 'amount' && (sortOrder === 'asc' ? '(Menor a Mayor)' : '(Mayor a Menor)')}
                      </button>
                    </div>
                  </div>

                  {/* Filtrar por Estado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setStatusFilter("all")
                          setCurrentPage(1)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                          statusFilter === "all"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter("paid")
                          setCurrentPage(1)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                          statusFilter === "paid"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        Pagado
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter("unpaid")
                          setCurrentPage(1)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border transition-colors",
                          statusFilter === "unpaid"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        Por Pagar
                      </button>
                    </div>
                  </div>

                  {/* Filtrar por Rango de Fechas */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rango de Fechas</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Desde</label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => {
                            setDateFrom(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => {
                            setDateTo(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearFilters()
                      setOpenFilterMenu(false)
                    }}
                    className="flex-1"
                  >
                    Limpiar
                  </Button>
                  <Button
                    onClick={() => setOpenFilterMenu(false)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <Upload size={18} />
            Subir factura
          </button>

          <Link href="/purchases/create">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap">
              <Plus className="inline-block mr-2" size={18} />
              Nueva Compra
            </button>
          </Link>
        </div>

        {/* Tabla de compras */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Encabezados de tabla */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-3">Nombre</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-3">Proveedor</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1"></div>
          </div>

          {/* Filas de compras */}
          {filteredPurchases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay compras</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || hasActiveFilters
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
            <>
              {paginatedPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 items-center transition-colors"
              >
                <div className="col-span-3">
                  <span className="text-gray-900">
                    {purchase.name}
                  </span>
                </div>

                <div className="col-span-2 flex items-center gap-2 text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  {new Date(purchase.purchase_date).toLocaleDateString('es-ES')}
                </div>

                <div className="col-span-3 flex items-center gap-2 text-gray-700">
                  <Building size={16} className="text-gray-400" />
                  {purchase.suppliers?.name || 'Sin proveedor'}
                </div>

                <div className="col-span-2 text-gray-900">
                  €{(purchase.total_amount || 0).toFixed(2)}
                </div>

                <div className="col-span-1">
                  {getStatusBadge(purchase.status)}
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
              ))}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-4 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredPurchases.length)} de {filteredPurchases.length} compras
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={cn(
                        "p-2 rounded-lg border transition-colors",
                        currentPage === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                      )}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        )
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1]
                        const showEllipsis = prevPage && page - prevPage > 1

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={cn(
                                "min-w-[40px] h-10 px-3 rounded-lg border transition-colors",
                                currentPage === page
                                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                              )}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        )
                      })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={cn(
                        "p-2 rounded-lg border transition-colors",
                        currentPage === totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                      )}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Información de resultados sin paginación */}
        {filteredPurchases.length > 0 && totalPages <= 1 && (
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
        description="¿Estás seguro de que deseas eliminar la compra"
        itemName={deleteModal.item?.name || 'Sin nombre'}
        isLoading={deleteModal.isLoading}
      />

      <UploadInvoiceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleInvoiceSuccess}
      />
    </div>
  )
}
