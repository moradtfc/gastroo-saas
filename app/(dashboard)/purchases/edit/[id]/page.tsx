"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { DatabaseService, type Supplier, type Unit } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, X, Trash2, ChevronDown, Calendar } from "lucide-react"
import Link from "next/link"

interface Article {
  id: string
  name: string
  category?: string
  current_stock?: number
  cost_per_unit?: number
  unit: string
  unit_id?: string
  default_unit_id?: string
  unit_info?: Unit
  default_unit_info?: Unit
}

interface PurchaseItem {
  id: string
  articleId: string
  articleName: string
  unit: string
  unitId: string
  unitSymbol: string
  quantity: number
  price: number
  total: number
  availableUnits: Unit[]
}

export default function EditPurchasePage() {
  const router = useRouter()
  const params = useParams()
  const purchaseId = params.id as string

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)
  const [searchArticle, setSearchArticle] = useState("")
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([])
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [openUnitSelect, setOpenUnitSelect] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    status: "paid"
  })

  const [initialData, setInitialData] = useState({
    name: "",
    description: "",
    purchaseDate: "",
    status: "",
    supplierId: "",
    items: [] as PurchaseItem[]
  })

  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    loadData()

    const handleScroll = () => {
      if (titleRef.current) {
        const titlePosition = titleRef.current.getBoundingClientRect()
        setScrolled(titlePosition.bottom < 80)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const loadData = async () => {
    try {
      setInitialLoading(true)
      const [articlesData, suppliersData, unitsData, purchaseData] = await Promise.all([
        DatabaseService.getArticles(),
        DatabaseService.getSuppliers(),
        DatabaseService.getUnits(),
        DatabaseService.getPurchase(purchaseId)
      ])

      setArticles(articlesData || [])
      setSuppliers(suppliersData || [])
      setUnits(unitsData || [])

      if (purchaseData) {
        // Set form data
        setFormData({
          name: purchaseData.name || "",
          description: purchaseData.description || "",
          purchaseDate: purchaseData.purchase_date,
          status: purchaseData.status || "paid"
        })

        // Set initial data for change detection
        setInitialData({
          name: purchaseData.name || "",
          description: purchaseData.description || "",
          purchaseDate: purchaseData.purchase_date,
          status: purchaseData.status || "paid",
          supplierId: purchaseData.suppliers?.id || "",
          items: []
        })

        // Set supplier
        if (purchaseData.suppliers) {
          setSelectedSupplier(purchaseData.suppliers as Supplier)
        }

        // Set items
        if (purchaseData.purchase_items && purchaseData.purchase_items.length > 0) {
          const loadedItems: PurchaseItem[] = await Promise.all(
            purchaseData.purchase_items.map(async (item: any) => {
              const article = articlesData?.find((a: Article) => a.id === item.articles?.id)
              const compatibleUnits = article ? getCompatibleUnitsForArticle(article, unitsData || []) : []
              const itemUnit = unitsData?.find((u: Unit) => u.id === item.unit_info?.id || u.id === item.unit)

              return {
                id: item.id,
                articleId: item.articles?.id || "",
                articleName: item.articles?.name || "",
                unit: itemUnit?.name || "",
                unitId: itemUnit?.id || "",
                unitSymbol: itemUnit?.symbol || "",
                quantity: item.quantity || 0,
                price: item.total_cost || 0,
                total: item.total_cost || 0,
                availableUnits: compatibleUnits
              }
            })
          )

          setItems(loadedItems)
          setInitialData(prev => ({
            ...prev,
            items: JSON.parse(JSON.stringify(loadedItems))
          }))
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error al cargar datos")
    } finally {
      setInitialLoading(false)
    }
  }

  const getCompatibleUnitsForArticle = (article: Article, allUnits: Unit[]): Unit[] => {
    const articleUnitInfo = article.unit_info || article.default_unit_info
    const articleUnitId = article.unit_id || article.default_unit_id

    const baseUnit = allUnits.find(unit => unit.id === articleUnitId)

    if (!articleUnitInfo?.category_id) {
      return baseUnit ? [baseUnit] : []
    }

    let compatible = allUnits.filter(unit => unit.category_id === articleUnitInfo.category_id)

    if (baseUnit) {
      const exists = compatible.some(unit => unit.id === baseUnit.id)
      if (!exists) {
        compatible = [baseUnit, ...compatible]
      } else {
        compatible = [baseUnit, ...compatible.filter(unit => unit.id !== baseUnit.id)]
      }
    }

    if (compatible.length === 0 && baseUnit) {
      return [baseUnit]
    }

    const uniqueById = new Map<string, Unit>()
    compatible.forEach(unit => uniqueById.set(unit.id, unit))
    return Array.from(uniqueById.values())
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsSupplierModalOpen(false)
  }

  const getCompatibleUnits = (article: Article): Unit[] => {
    return getCompatibleUnitsForArticle(article, units)
  }

  const addArticleFromModal = (article: Article) => {
    const isSelected = selectedArticles.some(a => a.id === article.id)
    const isInPurchase = items.some(item => item.articleId === article.id)

    if (!isSelected && !isInPurchase) {
      setSelectedArticles(prev => [...prev, article])
    }
  }

  const removeSelectedArticle = (articleId: string) => {
    setSelectedArticles(prev => prev.filter(a => a.id !== articleId))
  }

  const saveSelectedArticles = () => {
    const newItems: PurchaseItem[] = selectedArticles.map(article => {
      const compatibleUnits = getCompatibleUnits(article)
      const defaultUnit = compatibleUnits[0]

      return {
        id: Date.now().toString() + Math.random(),
        articleId: article.id,
        articleName: article.name,
        unit: defaultUnit?.name || 'unidad',
        unitId: defaultUnit?.id || '',
        unitSymbol: defaultUnit?.symbol || 'ud',
        quantity: 0,
        price: 0,
        total: 0,
        availableUnits: compatibleUnits
      }
    })

    setItems(prev => [...prev, ...newItems])
    setSelectedArticles([])
    setIsArticleModalOpen(false)
    toast.success(`${newItems.length} artículo(s) añadido(s)`)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // Quantity is only for inventory update, doesn't change total
        return { ...item, quantity: quantity }
      }
      return item
    }))
  }

  const updateItemPrice = (id: string, price: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // Price is the total, not unit price
        return { ...item, price: price, total: price }
      }
      return item
    }))
  }

  const updateItemUnit = (id: string, unitId: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const selectedUnit = item.availableUnits.find(u => u.id === unitId)
        if (selectedUnit) {
          return {
            ...item,
            unitId: selectedUnit.id,
            unit: selectedUnit.name,
            unitSymbol: selectedUnit.symbol
          }
        }
      }
      return item
    }))
  }

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchArticle.toLowerCase())
  )

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)
  const totalItems = items.length

  // Detect changes
  const hasChanges = () => {
    if (formData.name !== initialData.name) return true
    if (formData.description !== initialData.description) return true
    if (formData.purchaseDate !== initialData.purchaseDate) return true
    if (formData.status !== initialData.status) return true
    if (selectedSupplier?.id !== initialData.supplierId) return true
    if (items.length !== initialData.items.length) return true

    // Check if items have changed
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i]
      const initialItem = initialData.items.find(item => item.id === currentItem.id)

      if (!initialItem) return true

      if (currentItem.articleId !== initialItem.articleId) return true
      if (currentItem.quantity !== initialItem.quantity) return true
      if (currentItem.price !== initialItem.price) return true
      if (currentItem.unitId !== initialItem.unitId) return true
    }

    return false
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre de la compra es obligatorio")
      return
    }

    if (!selectedSupplier) {
      toast.error("Debes seleccionar un proveedor")
      return
    }

    if (items.length === 0) {
      toast.error("Debes agregar al menos un artículo a la compra")
      return
    }

    const hasValidItems = items.every(item => item.quantity > 0 && item.price > 0)
    if (!hasValidItems) {
      toast.error("Todos los artículos deben tener cantidad y precio válidos")
      return
    }

    try {
      setLoading(true)

      // For edit, we need to use updatePurchase instead of createPurchase
      // For now, let's delete and recreate (simpler approach)

      const purchaseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        supplier_id: selectedSupplier.id,
        purchase_date: formData.purchaseDate,
        total_amount: totalAmount,
        status: formData.status,
        items: items.map(item => ({
          article_id: item.articleId,
          quantity: item.quantity,
          unit: item.unitId,
          unit_cost: item.price,
          total_cost: item.total
        }))
      }

      // Update purchase using Supabase directly
      const { error: updateError } = await DatabaseService.supabase
        .from('purchases')
        .update({
          name: purchaseData.name,
          description: purchaseData.description,
          supplier_id: purchaseData.supplier_id,
          purchase_date: purchaseData.purchase_date,
          total_amount: purchaseData.total_amount,
          status: purchaseData.status
        })
        .eq('id', purchaseId)

      if (updateError) throw updateError

      // Delete old items
      await DatabaseService.supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', purchaseId)

      // Create new items
      const purchaseItems = items.map(item => ({
        purchase_id: purchaseId,
        article_id: item.articleId,
        quantity: item.quantity,
        unit_id: item.unitId,
        unit_cost: item.price,
        total_cost: item.total
      }))

      const { error: itemsError } = await DatabaseService.supabase
        .from('purchase_items')
        .insert(purchaseItems)

      if (itemsError) throw itemsError

      toast.success("Compra actualizada exitosamente")
      router.push("/purchases")
    } catch (error: any) {
      console.error("Error updating purchase:", error)
      toast.error(`Error al actualizar compra: ${error?.message || 'desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const canSave = !!(
    formData.name.trim() &&
    selectedSupplier &&
    items.length > 0 &&
    items.every(item => item.quantity > 0 && item.price > 0) &&
    hasChanges()
  )

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Modal de búsqueda de artículos */}
      <Dialog open={isArticleModalOpen} onOpenChange={(open) => {
        setIsArticleModalOpen(open)
        if (!open) {
          setSelectedArticles([])
          setSearchArticle('')
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Añadir Artículos</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Busca y añade artículos de tu inventario</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Tags de artículos seleccionados */}
            {selectedArticles.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedArticles.map((article) => (
                  <div
                    key={article.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm"
                  >
                    <span className="font-medium">{article.name}</span>
                    <button
                      onClick={() => removeSelectedArticle(article.id)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar artículo..."
                value={searchArticle}
                onChange={(e) => setSearchArticle(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-2">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => {
                  const isSelected = selectedArticles.some(a => a.id === article.id)
                  const isInPurchase = items.some(item => item.articleId === article.id)
                  const isDisabled = isSelected || isInPurchase

                  return (
                    <div
                      key={article.id}
                      onClick={() => !isDisabled && addArticleFromModal(article)}
                      className={cn(
                        "p-4 border rounded-lg transition-all",
                        isDisabled
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:bg-blue-50 hover:border-blue-500 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{article.name}</p>
                          <p className="text-sm text-gray-600">
                            {article.unit} • Costo: €{(article.cost_per_unit || 0).toFixed(2)}
                          </p>
                        </div>
                        {isDisabled ? (
                          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                            {isInPurchase ? 'En compra ✓' : 'Añadido ✓'}
                          </span>
                        ) : (
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Añadir
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No se encontraron artículos</p>
                  <p className="text-sm">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              onClick={saveSelectedArticles}
              disabled={selectedArticles.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Guardar ({selectedArticles.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de selección de proveedor */}
      <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Seleccionar Proveedor</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {suppliers.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-gray-600 mb-2">
                  Registra tus proveedores para empezar a asociarlos a tus compras
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSupplierModalOpen(false)
                    router.push("/suppliers")
                  }}
                  className="mt-4"
                >
                  Ir a Proveedores
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50",
                      selectedSupplier?.id === supplier.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    )}
                    onClick={() => handleSupplierSelect(supplier)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{supplier.name}</p>
                        {supplier.category && (
                          <p className="text-sm text-gray-600 mt-1">{supplier.category}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          {supplier.phone && <span>📞 {supplier.phone}</span>}
                          {supplier.email && <span>✉️ {supplier.email}</span>}
                        </div>
                      </div>
                      {selectedSupplier?.id === supplier.id && (
                        <div className="ml-2">
                          <span className="text-blue-600 text-xl">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsSupplierModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fixed overlay full-screen */}
      <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
        {/* Header sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-[9999] transition-all">
          <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex-1">
              <Link href="/purchases">
                <button
                  className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors text-xl cursor-pointer"
                >
                  ✕
                </button>
              </Link>
            </div>
            <div className="flex-1 text-center">
              <h2 className={`text-lg font-semibold transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
                {formData.name || 'Editar compra'}
              </h2>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading || !canSave}
                className={cn(
                  "px-6 py-3 rounded-lg font-semibold transition-colors",
                  canSave && !loading
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white">
          <div className="p-6">
            <h1 ref={titleRef} className="text-3xl font-semibold mb-6">
              Editar compra
            </h1>

            {/* Banner informativo */}
            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xl">📝</span>
                <span className="text-sm">Modifica los detalles de esta compra. Los cambios se guardarán al presionar "Actualizar"</span>
              </div>
            </div>

            {/* Sección Información */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Información</h2>

              <div className="space-y-4">
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-base"
                  placeholder="Nombre de la compra"
                />

                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-base resize-none"
                  placeholder="Descripción (opcional)"
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Fecha</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                        className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg bg-white [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                      className="w-full h-10 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="paid">Pagado</option>
                      <option value="unpaid">Por Pagar</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 mb-10" />

            {/* Sección Proveedores */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Proveedores</h2>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300"
                  onClick={() => setIsSupplierModalOpen(true)}
                >
                  Cambiar
                </Button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Proveedor de esta compra
              </p>

              {/* Proveedor seleccionado */}
              {selectedSupplier && (
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedSupplier.name}</p>
                      {selectedSupplier.category && (
                        <p className="text-sm text-gray-600 mt-1">{selectedSupplier.category}</p>
                      )}
                      <div className="flex flex-col gap-1 mt-2 text-sm text-gray-500">
                        {selectedSupplier.phone && <span>📞 {selectedSupplier.phone}</span>}
                        {selectedSupplier.email && <span>✉️ {selectedSupplier.email}</span>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSupplier(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              )}

              {!selectedSupplier && (
                <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                  No hay proveedor seleccionado
                </div>
              )}
            </section>

            <hr className="border-gray-200 mb-10" />

            {/* Sección Artículos */}
            <div className="mb-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Artículos</h2>
                  <p className="text-sm text-gray-600 mt-1">Artículos de la compra con sus cantidades y costos</p>
                </div>
                <button
                  onClick={() => setIsArticleModalOpen(true)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Añadir artículos
                </button>
              </div>

              {/* Banner informativo cuando está vacío */}
              {items.length === 0 && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Agrega los artículos de tu compra
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estadísticas de artículos */}
              {items.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Artículos</p>
                    <p className="text-2xl font-bold text-blue-900">{items.length}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <p className="text-xs text-green-600 font-semibold mb-1">Total</p>
                    <p className="text-2xl font-bold text-green-900">€{totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Lista de artículos */}
              {items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900 block">{item.articleName}</span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Cantidad */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '')
                              const parts = value.split('.')
                              const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value
                              updateItemQuantity(item.id, sanitized ? Number(sanitized) : 0)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                            placeholder="0"
                          />
                        </div>

                        {/* Unidad */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenUnitSelect(openUnitSelect === item.id ? null : item.id)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            >
                              <span className={item.unitId ? 'text-gray-900' : 'text-gray-400'}>
                                {item.unitId
                                  ? `${item.unitSymbol} - ${item.unit}`
                                  : 'Seleccionar unidad'}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform ${openUnitSelect === item.id ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {openUnitSelect === item.id && item.availableUnits && item.availableUnits.length > 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                <div className="max-h-60 overflow-y-auto">
                                  {item.availableUnits
                                    .sort((a: Unit, b: Unit) => {
                                      if (a.base_unit) return -1
                                      if (b.base_unit) return 1
                                      return (a.conversion_factor || 0) - (b.conversion_factor || 0)
                                    })
                                    .map((unit: Unit) => (
                                      <button
                                        key={unit.id}
                                        type="button"
                                        onClick={() => {
                                          updateItemUnit(item.id, unit.id)
                                          setOpenUnitSelect(null)
                                        }}
                                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                                          item.unitId === unit.id
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>
                                            <span className="font-semibold">{unit.symbol}</span> - {unit.name}
                                          </span>
                                          {unit.base_unit && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Base</span>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Precio total */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Precio Total (€)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.price || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '')
                              const parts = value.split('.')
                              const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value
                              updateItemPrice(item.id, sanitized ? Number(sanitized) : 0)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Total */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Total (€)</label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
                            €{item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen de la compra */}
              {items.length > 0 && (
                <div className="mt-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la Compra</h3>

                  {/* Desglose de artículos */}
                  <div className="space-y-2 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{item.articleName}</span>
                          <span className="text-gray-500">
                            ({item.quantity} {item.unitSymbol})
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">€{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total de artículos:</span>
                      <span className="font-semibold text-gray-900">{items.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Total de la compra:</span>
                      <span className="text-xl font-bold text-green-600">€{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
