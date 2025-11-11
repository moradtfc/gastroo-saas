"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Search, ChevronDown, MoreVertical, ArrowUpDown } from "lucide-react"
import { DatabaseService, Group } from "@/lib/database"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { CreateSupplierModal } from "./create-supplier-modal"
import { ManageGroupsModal } from "./manage-groups-modal"
import { GroupFilterModal } from "./group-filter-modal"
import { cn } from "@/lib/utils"

import { useDeleteModal } from "@/hooks/use-delete-modal"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "email" | null>(null)
  const [openSortMenu, setOpenSortMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [groups, setGroups] = useState<Group[]>([])
  const [supplierGroupsMap, setSupplierGroupsMap] = useState<Record<string, Group[]>>({})
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [isGroupFilterModalOpen, setIsGroupFilterModalOpen] = useState(false)
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const suppliersPerPage = 12
  const menuRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const { deleteModal, openDeleteModal, closeDeleteModal, setLoading: setDeleteLoading } = useDeleteModal()

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setOpenSortMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      const [suppliersData, groupsData, supplierGroupsResponse] = await Promise.all([
        DatabaseService.getSuppliers(),
        DatabaseService.getGroups(),
        DatabaseService.supabase
          .from('supplier_groups')
          .select(`
            supplier_id,
            group:groups(*)
          `)
      ])

      if (supplierGroupsResponse.error) throw supplierGroupsResponse.error

      const supplierGroupData = ((supplierGroupsResponse.data || []) as unknown) as Array<{
        supplier_id: string
        group: Group | null
      }>

      const groupMap: Record<string, Group[]> = {}
      supplierGroupData.forEach((relation) => {
        if (!relation.group) return
        if (!groupMap[relation.supplier_id]) {
          groupMap[relation.supplier_id] = []
        }
        groupMap[relation.supplier_id].push(relation.group)
      })

      setSuppliers(suppliersData || [])
      setGroups(groupsData || [])
      setSupplierGroupsMap(groupMap)
    } catch (error) {
      console.error('Error loading suppliers:', error)
      setError('Error al cargar proveedores')
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredSuppliers.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredSuppliers.map((s) => s.id))
    }
  }

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleView = (supplier: any) => {
    setEditingSupplierId(supplier.id)
    setIsCreateModalOpen(true)
    setOpenMenuId(null)
  }

  const handleEdit = (supplier: any) => {
    setEditingSupplierId(supplier.id)
    setIsCreateModalOpen(true)
    setOpenMenuId(null)
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    try {
      setDeleteLoading(true)
      
      const { error } = await DatabaseService.supabase
        .from('suppliers')
        .delete()
        .eq('id', deleteModal.item.id)

      if (error) throw error

      toast.success('Proveedor eliminado correctamente')
      loadSuppliers()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Error al eliminar proveedor')
      setDeleteLoading(false)
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedItems.length} proveedor(es)?`)) {
      return
    }

    try {
      for (const supplierId of selectedItems) {
        await DatabaseService.supabase
          .from('suppliers')
          .delete()
          .eq('id', supplierId)
      }

      toast.success(`${selectedItems.length} proveedor(es) eliminado(s) correctamente`)
      setSelectedItems([])
      loadSuppliers()
    } catch (error) {
      console.error("Error eliminando proveedores:", error)
      toast.error("Error al eliminar proveedores")
    }
  }

  const buildWhatsappNumber = (supplier: any) => {
    const countryCode = (supplier.phone_country_code || "").toString()
    const phoneNumber = (supplier.phone_number || supplier.phone || "").toString()
    const combined = `${countryCode}${phoneNumber}`.replace(/\D/g, "")
    return combined
  }

  const handlePhoneClick = (supplier: any) => {
    if (!supplier.has_whatsapp) {
      return
    }

    const whatsappNumber = buildWhatsappNumber(supplier)

    if (!whatsappNumber) {
      toast.error("No se pudo abrir WhatsApp: número inválido")
      return
    }

    const whatsappUrl = `https://wa.me/${whatsappNumber}`
    window.open(whatsappUrl, "_blank")
  }

  const handleSortSelection = (type: "name" | "email") => {
    if (sortBy === type) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else if (sortOrder === "desc") {
        setSortBy(null)
        setSortOrder(null)
      }
    } else {
      setSortBy(type)
      setSortOrder("asc")
    }
    setOpenSortMenu(false)
  }

  const getMenuLabel = () => {
    const labels: string[] = []

    if (sortBy) {
      if (sortBy === "name") {
        labels.push(sortOrder === "asc" ? "A-Z" : "Z-A")
      } else if (sortBy === "email") {
        labels.push(sortOrder === "asc" ? "Email: A-Z" : "Email: Z-A")
      }
    }

    if (selectedGroupIds.length > 0) {
      if (selectedGroupIds.length === 1) {
        const groupName = groups.find((group) => group.id === selectedGroupIds[0])?.name
        labels.push(groupName ? `Grupo: ${groupName}` : "Grupo seleccionado")
      } else {
        labels.push(`Grupos (${selectedGroupIds.length})`)
      }
    }

    if (labels.length === 0) {
      return "Ordenar y Filtrar"
    }

    return labels.join(" • ")
  }

  const toggleGroupFilter = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  const clearGroupFilters = () => {
    setSelectedGroupIds([])
    setOpenSortMenu(false)
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    const words = name.trim().split(" ")
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getColorFromName = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-red-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const selectedGroupDetails = selectedGroupIds
    .map((groupId) => groups.find((group) => group.id === groupId))
    .filter((group): group is Group => Boolean(group))

  const filteredSuppliers = suppliers
    .filter((supplier) => {
      const supplierName = (supplier.name || "").toLowerCase()
      const matchesSearch = supplierName.includes(searchTerm.toLowerCase())
      const supplierGroupIds = (supplierGroupsMap[supplier.id] || []).map((group) => group.id)
      const matchesGroup =
        selectedGroupIds.length === 0 ||
        supplierGroupIds.some((groupId) => selectedGroupIds.includes(groupId))

      return matchesSearch && matchesGroup
    })
    .sort((a, b) => {
      if (sortOrder === null || sortBy === null) return 0
      
      if (sortBy === "name") {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        return sortOrder === "asc" 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      } else if (sortBy === "email") {
        const emailA = (a.email || "").toLowerCase()
        const emailB = (b.email || "").toLowerCase()
        return sortOrder === "asc" 
          ? emailA.localeCompare(emailB)
          : emailB.localeCompare(emailA)
      }
      
      return 0
    })

  // Lógica de paginación
  const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage)
  const startIndex = (currentPage - 1) * suppliersPerPage
  const endIndex = startIndex + suppliersPerPage
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex)

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, sortOrder, selectedGroupIds])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Banner de información */}
          {showBanner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  i
                </div>
                <span className="text-gray-700">
                  <strong>Gestiona tus proveedores</strong> de forma eficiente y organizada.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

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

            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setOpenSortMenu(!openSortMenu)}
                className={cn(
                  "px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer",
                  (sortBy || selectedGroupIds.length > 0) && "border-blue-500 bg-blue-50"
                )}
              >
                <ArrowUpDown size={18} />
                {getMenuLabel()}
                <ChevronDown size={18} />
              </button>

              {openSortMenu && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <div className="px-4 pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Ordenar</p>
                  </div>
                  <button
                    onClick={() => handleSortSelection("name")}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                      sortBy === "name" && "bg-blue-50 text-blue-600 font-medium"
                    )}
                  >
                    Alfabéticamente {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleSortSelection("email")}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer",
                      sortBy === "email" && "bg-blue-50 text-blue-600 font-medium"
                    )}
                  >
                    Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Filtros</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsGroupFilterModalOpen(true)
                      setOpenSortMenu(false)
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer flex items-center justify-between",
                      selectedGroupIds.length > 0 && "bg-blue-50 text-blue-600 font-medium"
                    )}
                  >
                    <span>Filtrar por grupo</span>
                    {selectedGroupIds.length > 0 && (
                      <span className="ml-3 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5">
                        {selectedGroupIds.length}
                      </span>
                    )}
                  </button>
                  {(sortBy || selectedGroupIds.length > 0) && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      {selectedGroupIds.length > 0 && (
                        <button
                          onClick={() => {
                            clearGroupFilters()
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-blue-600 text-sm transition-colors cursor-pointer"
                        >
                          Limpiar filtros
                        </button>
                      )}
                      {sortBy && (
                        <button
                          onClick={() => {
                            setSortBy(null)
                            setSortOrder(null)
                            setOpenSortMenu(false)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600 text-sm transition-colors cursor-pointer"
                        >
                          Limpiar orden
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsGroupsModalOpen(true)}
              className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              Agrupar
            </button>

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm cursor-pointer"
            >
              Crear proveedor
            </button>
          </div>

          {selectedGroupDetails.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm font-medium text-gray-600 mr-1">Grupos activos:</span>
              {selectedGroupDetails.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroupFilter(group.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <span className="truncate max-w-[160px]">{group.name}</span>
                  <span aria-hidden="true" className="text-blue-500 hover:text-blue-700">×</span>
                  <span className="sr-only">Eliminar filtro de {group.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearGroupFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Tabla de proveedores */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Encabezados de tabla */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={
                    filteredSuppliers.length > 0 &&
                    selectedItems.length === filteredSuppliers.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="col-span-4">Nombre</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Teléfono</div>
              <div className="col-span-2">Categoría</div>
            </div>

            {/* Filas de proveedores */}
          {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay proveedores</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "No se encontraron proveedores con ese nombre"
                    : "Comienza creando tu primer proveedor"}
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <Plus className="inline-block mr-2" size={18} />
                  Crear proveedor
                </button>
            </div>
          ) : (
              paginatedSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 items-center transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(supplier.id)}
                      onChange={() => toggleSelectItem(supplier.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                        </div>

                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded flex items-center justify-center text-white text-sm font-semibold ${getColorFromName(supplier.name)}`}>
                      {getInitials(supplier.name)}
                            </div>
                    <span 
                      onClick={() => handleView(supplier)}
                      className="text-blue-600 font-medium hover:underline cursor-pointer"
                    >
                      {supplier.name}
                    </span>
                            </div>

                  <div className="col-span-3 text-gray-700">
                    {supplier.email || (
                      <span className="text-gray-400 italic">Sin email</span>
                    )}
                            </div>

                  <div className="col-span-2 text-gray-700">
                    {supplier.phone ? (
                      supplier.has_whatsapp ? (
                        <button
                          type="button"
                          onClick={() => handlePhoneClick(supplier)}
                          className="text-green-600 hover:text-green-700 font-medium underline-offset-2 hover:underline transition-colors cursor-pointer"
                        >
                          {supplier.phone}
                        </button>
                      ) : (
                        supplier.phone
                      )
                    ) : (
                      <span className="text-gray-400 italic">Sin teléfono</span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-gray-700">
                      {supplier.food_category?.name || supplier.category || (
                        <span className="text-gray-400 italic">Sin categoría</span>
                      )}
                    </span>
                    <div
                      className="relative"
                      ref={openMenuId === supplier.id ? menuRef : null}
                    >
                      <button
                        onClick={() => toggleMenu(supplier.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openMenuId === supplier.id && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                          <button
                            onClick={() => handleView(supplier)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer"
                          >
                            Ver detalles
                          </button>
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              openDeleteModal(supplier)
                              setOpenMenuId(null)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Controles de paginación */}
            {filteredSuppliers.length > suppliersPerPage && (
              <div className="mt-6 mb-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Anterior
                </button>
                
                {/* Números de página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Información de resultados */}
          {filteredSuppliers.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredSuppliers.length)} de {filteredSuppliers.length} proveedor(es)
            </div>
          )}

          {/* Barra inferior de selección múltiple */}
          {selectedItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">
                    {selectedItems.length} seleccionado{selectedItems.length > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                  >
                    Desmarcar todo
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsGroupsModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    Agrupar
                  </button>
                  <button
                    onClick={handleDeleteMultiple}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    Eliminar proveedores
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Eliminar Proveedor"
        description="¿Estás seguro de que deseas eliminar el proveedor"
        itemName={deleteModal.item?.name || ''}
        isLoading={deleteModal.isLoading}
      />

      <CreateSupplierModal
        isOpen={isCreateModalOpen}
        supplierId={editingSupplierId}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingSupplierId(null)
        }}
        onSuccess={() => {
          loadSuppliers()
          setIsCreateModalOpen(false)
          setEditingSupplierId(null)
        }}
      />

      <GroupFilterModal
        isOpen={isGroupFilterModalOpen}
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        onClose={() => setIsGroupFilterModalOpen(false)}
        onApply={(groupIds) => {
          setSelectedGroupIds(groupIds)
          setIsGroupFilterModalOpen(false)
        }}
      />

      <ManageGroupsModal
        isOpen={isGroupsModalOpen}
        onClose={() => setIsGroupsModalOpen(false)}
        selectedSupplierIds={selectedItems}
        onSuccess={() => {
          setSelectedItems([])
          loadSuppliers()
        }}
      />
    </>
  )
}