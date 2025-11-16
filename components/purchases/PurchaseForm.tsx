"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DatabaseService, type Supplier, type Unit } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, X, Trash2, ChevronDown, Calendar, Undo2, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { advancedSimilarity } from "@/lib/text-similarity"
import { CreateSupplierModal } from "@/app/(dashboard)/suppliers/create-supplier-modal"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

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
  quantity: number | string
  price: number | string
  total: number
  availableUnits: Unit[]
  originalInvoiceName?: string // Nombre original de la factura (si fue asignado desde productos sin coincidencia)
}

interface PurchaseFormProps {
  purchaseId?: string
}

export default function PurchaseForm({ purchaseId }: PurchaseFormProps = {}) {
  const router = useRouter()
  const isEditMode = !!purchaseId
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
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
  const [unmatchedItems, setUnmatchedItems] = useState<Array<{
    name: string
    quantity: number
    unit: string
    price: number
    total: number
  }>>([])
  const [assigningItemIndex, setAssigningItemIndex] = useState<number | null>(null)
  const [changingItemId, setChangingItemId] = useState<string | null>(null)
  const [unmatchedSupplier, setUnmatchedSupplier] = useState<string | null>(null)
  const [isCreateSupplierModalOpen, setIsCreateSupplierModalOpen] = useState(false)
  const [isQuickCreateArticleModalOpen, setIsQuickCreateArticleModalOpen] = useState(false)
  const [quickCreateArticleData, setQuickCreateArticleData] = useState({
    name: "",
    categoryId: "",
    unitId: "",
    costPerUnit: "",
    currentStock: ""
  })
  const [categorySearch, setCategorySearch] = useState("")
  const [unitSearch, setUnitSearch] = useState("")
  const [foodCategories, setFoodCategories] = useState<any[]>([])
  const [pendingArticles, setPendingArticles] = useState<Array<{
    tempId: string
    name: string
    categoryId: string
    unitId: string
    costPerUnit: string
  }>>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'item' | 'unmatched'; index?: number } | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  // Estados para descuento detectado
  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountAmount, setDiscountAmount] = useState<number | string>(0)

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
    // Reset state when purchaseId changes
    if (isEditMode) {
      setInitialLoading(true)
      setItems([])
      setSelectedSupplier(null)
      setFormData({
        name: "",
        description: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        status: "paid"
      })
    }

    loadData()

    const handleScroll = () => {
      if (titleRef.current) {
        const titlePosition = titleRef.current.getBoundingClientRect()
        setScrolled(titlePosition.bottom < 80)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId])

  const loadData = async () => {
    try {
      if (isEditMode) {
        setInitialLoading(true)
      } else {
        setLoading(true)
      }

      const promises = [
        DatabaseService.getArticles(),
        DatabaseService.getSuppliers(),
        DatabaseService.getUnits(),
        DatabaseService.getFoodCategories()
      ]

      if (isEditMode && purchaseId) {
        promises.push(DatabaseService.getPurchase(purchaseId) as any)
      }

      const results = await Promise.all(promises)
      const articlesData = results[0] as Article[]
      const suppliersData = results[1] as Supplier[]
      const unitsData = results[2] as Unit[]
      const categoriesData = results[3] as any[]
      const purchaseData = results[4] as any

      setArticles(articlesData || [])
      setSuppliers(suppliersData || [])
      setUnits(unitsData || [])
      setFoodCategories(categoriesData || [])

      // Load purchase data if in edit mode
      if (isEditMode && purchaseData) {
        setFormData({
          name: purchaseData.name || "",
          description: purchaseData.description || "",
          purchaseDate: purchaseData.purchase_date,
          status: purchaseData.status || "paid"
        })

        setInitialData({
          name: purchaseData.name || "",
          description: purchaseData.description || "",
          purchaseDate: purchaseData.purchase_date,
          status: purchaseData.status || "paid",
          supplierId: purchaseData.suppliers?.id || "",
          items: []
        })

        if (purchaseData.suppliers) {
          setSelectedSupplier(purchaseData.suppliers as Supplier)
        }

        // Load items
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
      setLoading(false)
      setInitialLoading(false)
    }
  }

  // Procesar datos de factura si existen en sessionStorage
  useEffect(() => {
    if (!isEditMode && articles.length > 0 && suppliers.length > 0 && units.length > 0) {
      const invoiceDataStr = sessionStorage.getItem('invoiceData')
      if (invoiceDataStr) {
        try {
          const invoiceData = JSON.parse(invoiceDataStr)

          // Limpiar sessionStorage
          sessionStorage.removeItem('invoiceData')

          // Prellenar formulario
          setFormData({
            name: invoiceData.purchaseName,
            description: `Factura procesada automáticamente - ${invoiceData.supplier}`,
            purchaseDate: invoiceData.date,
            status: invoiceData.status
          })

          // Buscar proveedor con matching avanzado
          let bestSupplierMatch: { supplier: Supplier; score: number } | null = null

          for (const supplier of suppliers) {
            const score = advancedSimilarity(invoiceData.supplier, supplier.name)
            if (score >= 0.7 && (!bestSupplierMatch || score > bestSupplierMatch.score)) {
              bestSupplierMatch = { supplier, score }
            }
          }

          if (bestSupplierMatch) {
            setSelectedSupplier(bestSupplierMatch.supplier)
            toast.success(`Proveedor "${bestSupplierMatch.supplier.name}" asignado automáticamente (${Math.round(bestSupplierMatch.score * 100)}% match)`)
          } else {
            // No hay match automático, guardar para asignación manual
            setUnmatchedSupplier(invoiceData.supplier)
            toast.info(`Proveedor "${invoiceData.supplier}" requiere asignación manual`)
          }

          // Procesar items
          const matchedItems: PurchaseItem[] = []
          const unmatched: typeof unmatchedItems = []

          invoiceData.items.forEach((item: any) => {
            if (item.matchedArticleId && item.matchScore >= 0.7) {
              // Tiene match alto - añadir automáticamente
              const article = articles.find(a => a.id === item.matchedArticleId)
              if (article) {
                const compatibleUnits = getCompatibleUnits(article)
                const defaultUnit = compatibleUnits[0]

                matchedItems.push({
                  id: Date.now().toString() + Math.random(),
                  articleId: article.id,
                  articleName: article.name,
                  unit: defaultUnit?.name || 'unidad',
                  unitId: defaultUnit?.id || '',
                  unitSymbol: defaultUnit?.symbol || 'ud',
                  quantity: item.quantity,
                  price: item.price,
                  total: item.total,
                  availableUnits: compatibleUnits
                })
              }
            } else {
              // Sin match - añadir a lista de no coincidentes
              unmatched.push({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                total: item.total
              })
            }
          })

          setItems(matchedItems)
          setUnmatchedItems(unmatched)

          // Procesar descuento detectado si existe
          if (invoiceData.detectedDiscount && invoiceData.detectedDiscount > 0) {
            setHasDiscount(true)
            setDiscountAmount(invoiceData.detectedDiscount)
            toast.info(`Descuento detectado: €${invoiceData.detectedDiscount.toFixed(2)}`)
          }

          if (matchedItems.length > 0) {
            toast.success(`${matchedItems.length} artículo(s) añadido(s) automáticamente`)
          }
          if (unmatched.length > 0) {
            toast.info(`${unmatched.length} producto(s) requieren asignación manual`)
          }
        } catch (error) {
          console.error('Error processing invoice data:', error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, suppliers, units, isEditMode])

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
    setUnmatchedSupplier(null) // Limpiar proveedor sin match si se selecciona uno
    setIsSupplierModalOpen(false)
  }

  const handleCreateSupplierSuccess = async () => {
    // Recargar lista de proveedores
    try {
      const suppliersData = await DatabaseService.getSuppliers()
      setSuppliers(suppliersData || [])

      // Seleccionar el proveedor recién creado (el último de la lista)
      if (suppliersData && suppliersData.length > 0) {
        const newSupplier = suppliersData[suppliersData.length - 1]
        setSelectedSupplier(newSupplier)
        setUnmatchedSupplier(null)
        toast.success(`Proveedor "${newSupplier.name}" creado y asignado`)
      }
    } catch (error) {
      console.error('Error reloading suppliers:', error)
    }
  }

  const handleRemoveSupplier = () => {
    setSelectedSupplier(null)
  }

  const getCompatibleUnits = (article: Article): Unit[] => {
    const articleUnitInfo = article.unit_info || article.default_unit_info
    const articleUnitId = article.unit_id || article.default_unit_id

    const baseUnit = units.find(unit => unit.id === articleUnitId)

    if (!articleUnitInfo?.category_id) {
      return baseUnit ? [baseUnit] : []
    }

    let compatible = units.filter(unit => unit.category_id === articleUnitInfo.category_id)

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
    // Si estamos cambiando el artículo de un item existente
    if (changingItemId !== null && selectedArticles.length === 1) {
      const existingItem = items.find(i => i.id === changingItemId)
      const newArticle = selectedArticles[0]

      if (existingItem) {
        const compatibleUnits = getCompatibleUnits(newArticle)
        const defaultUnit = compatibleUnits[0]

        const updatedItem: PurchaseItem = {
          ...existingItem,
          articleId: newArticle.id,
          articleName: newArticle.name,
          unit: defaultUnit?.name || 'unidad',
          unitId: defaultUnit?.id || '',
          unitSymbol: defaultUnit?.symbol || 'ud',
          availableUnits: compatibleUnits
          // Mantenemos quantity, price, total y originalInvoiceName del item existente
        }

        setItems(prev => prev.map(item => item.id === changingItemId ? updatedItem : item))
        toast.success('Artículo cambiado correctamente')
      }

      setSelectedArticles([])
      setIsArticleModalOpen(false)
      setChangingItemId(null)
      return
    }

    // Si estamos asignando artículo a un item sin match
    if (assigningItemIndex !== null && selectedArticles.length === 1) {
      const unmatchedItem = unmatchedItems[assigningItemIndex]
      const article = selectedArticles[0]
      const compatibleUnits = getCompatibleUnits(article)
      const defaultUnit = compatibleUnits[0]

      const newItem: PurchaseItem = {
        id: Date.now().toString() + Math.random(),
        articleId: article.id,
        articleName: article.name,
        unit: defaultUnit?.name || 'unidad',
        unitId: defaultUnit?.id || '',
        unitSymbol: defaultUnit?.symbol || 'ud',
        quantity: unmatchedItem.quantity,
        price: unmatchedItem.price,
        total: unmatchedItem.total,
        availableUnits: compatibleUnits,
        originalInvoiceName: unmatchedItem.name // Guardar nombre original de la factura
      }

      setItems(prev => [...prev, newItem])
      setUnmatchedItems(prev => prev.filter((_, i) => i !== assigningItemIndex))
      setSelectedArticles([])
      setIsArticleModalOpen(false)
      setAssigningItemIndex(null)
      toast.success('Artículo asignado correctamente')
      return
    }

    // Añadir artículos normalmente
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

  const handleAssignArticle = (index: number) => {
    setAssigningItemIndex(index)
    setSelectedArticles([])
    setIsArticleModalOpen(true)
  }

  const handleCancelAssign = () => {
    setAssigningItemIndex(null)
    setChangingItemId(null)
    setSelectedArticles([])
    setIsArticleModalOpen(false)
  }

  const handleChangeArticle = (itemId: string) => {
    setChangingItemId(itemId)
    setSelectedArticles([])
    setIsArticleModalOpen(true)
  }

  const handleUndoAssignment = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    // Solo permitir deshacer si tiene nombre original de la factura
    if (!item.originalInvoiceName) {
      toast.error('Este artículo no puede deshacerse porque no fue asignado desde productos sin coincidencia')
      return
    }

    // Si el item tiene un articleId temporal, eliminarlo de pendingArticles
    if (item.articleId.startsWith('pending-')) {
      setPendingArticles(prev => prev.filter(pa => pa.tempId !== item.articleId))
    }

    // Mover el artículo de vuelta a unmatchedItems usando el nombre ORIGINAL de la factura
    const newUnmatchedItem = {
      name: item.originalInvoiceName, // Usar nombre original de la factura, NO el del artículo asignado
      quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
      unit: item.unitSymbol,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      total: item.total
    }

    setUnmatchedItems(prev => [...prev, newUnmatchedItem])
    setItems(items.filter(i => i.id !== itemId))
    toast.success('Asignación deshecha. Puedes volver a asignar el artículo.')
  }

  const handleQuickCreateArticle = async () => {
    if (!quickCreateArticleData.name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (!quickCreateArticleData.categoryId) {
      toast.error("La categoría es obligatoria")
      return
    }
    if (!quickCreateArticleData.unitId) {
      toast.error("La unidad es obligatoria")
      return
    }
    if (!quickCreateArticleData.costPerUnit || parseFloat(quickCreateArticleData.costPerUnit) <= 0) {
      toast.error("El precio es obligatorio y debe ser mayor a 0")
      return
    }
    if (!quickCreateArticleData.currentStock || parseFloat(quickCreateArticleData.currentStock) < 0) {
      toast.error("El stock es obligatorio y no puede ser negativo")
      return
    }

    try {
      const selectedUnit = units.find(u => u.id === quickCreateArticleData.unitId)

      // Generar ID temporal para el artículo pendiente
      const tempId = `pending-${Date.now()}-${Math.random()}`

      // Guardar artículo como pendiente de crear (se creará al guardar la compra)
      const pendingArticle = {
        tempId,
        name: quickCreateArticleData.name,
        categoryId: quickCreateArticleData.categoryId,
        unitId: quickCreateArticleData.unitId,
        costPerUnit: quickCreateArticleData.costPerUnit
      }

      setPendingArticles(prev => [...prev, pendingArticle])
      toast.success("Artículo agregado (se creará al guardar la compra)")

      // Si estamos creando desde un producto sin coincidencia, agregarlo a la compra con ID temporal
      if (assigningItemIndex !== null) {
        const unmatchedItem = unmatchedItems[assigningItemIndex]

        if (unmatchedItem) {
          const newItem: PurchaseItem = {
            id: Date.now().toString() + Math.random(),
            articleId: tempId, // ID temporal
            articleName: quickCreateArticleData.name,
            unit: selectedUnit?.name || 'unidad',
            unitId: selectedUnit?.id || '',
            unitSymbol: selectedUnit?.symbol || 'ud',
            quantity: unmatchedItem.quantity,
            price: unmatchedItem.price,
            total: unmatchedItem.total,
            availableUnits: selectedUnit ? [selectedUnit] : [],
            originalInvoiceName: unmatchedItem.name
          }

          setItems(prev => [...prev, newItem])
          setUnmatchedItems(prev => prev.filter((_, i) => i !== assigningItemIndex))
          toast.success('Artículo agregado a la compra')
        }

        setAssigningItemIndex(null)
      }

      setIsQuickCreateArticleModalOpen(false)
      setQuickCreateArticleData({ name: "", categoryId: "", unitId: "", costPerUnit: "", currentStock: "" })
      setCategorySearch("")
      setUnitSearch("")
    } catch (error) {
      console.error("Error agregando artículo:", error)
      toast.error("Error al agregar artículo")
    }
  }

  const handleCreateArticleFromUnmatched = (unmatchedItem: any, index: number) => {
    // Prellenar el formulario de creación rápida con los datos del producto sin coincidencia
    setQuickCreateArticleData({
      name: unmatchedItem.name,
      categoryId: "",
      unitId: "",
      costPerUnit: unmatchedItem.price.toString(),
      currentStock: unmatchedItem.quantity.toString()
    })
    setIsQuickCreateArticleModalOpen(true)

    // Guardar el índice del item para eliminarlo después de crear el artículo si el usuario quiere
    setAssigningItemIndex(index)
  }

  const openDeleteItemModal = (id: string, name: string) => {
    setItemToDelete({ id, name, type: 'item' })
    setDeleteModalOpen(true)
  }

  const openDeleteUnmatchedModal = (index: number, name: string) => {
    setItemToDelete({ id: index.toString(), name, type: 'unmatched', index })
    setDeleteModalOpen(true)
  }

  const closeDeleteItemModal = () => {
    setDeleteModalOpen(false)
    setItemToDelete(null)
    setIsDeletingItem(false)
  }

  const confirmRemoveItem = () => {
    if (!itemToDelete) return

    setIsDeletingItem(true)

    if (itemToDelete.type === 'item') {
      // Eliminar item de la compra
      const itemToRemove = items.find(item => item.id === itemToDelete.id)

      // Si el item tiene un articleId temporal, también eliminarlo de pendingArticles
      if (itemToRemove && itemToRemove.articleId.startsWith('pending-')) {
        setPendingArticles(prev => prev.filter(pa => pa.tempId !== itemToRemove.articleId))
      }

      setItems(items.filter(item => item.id !== itemToDelete.id))
      toast.success('Artículo eliminado de la compra')
    } else if (itemToDelete.type === 'unmatched' && itemToDelete.index !== undefined) {
      // Eliminar producto sin coincidencia
      setUnmatchedItems(prev => prev.filter((_, i) => i !== itemToDelete.index))
      toast.success('Producto sin coincidencia eliminado')
    }

    closeDeleteItemModal()
  }

  const removeItem = (id: string) => {
    const itemToRemove = items.find(item => item.id === id)

    // Si el item tiene un articleId temporal, también eliminarlo de pendingArticles
    if (itemToRemove && itemToRemove.articleId.startsWith('pending-')) {
      setPendingArticles(prev => prev.filter(pa => pa.tempId !== itemToRemove.articleId))
    }

    setItems(items.filter(item => item.id !== id))
  }

  const updateItemQuantity = (id: string, quantity: number | string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // Quantity is only for inventory update, doesn't change total
        return { ...item, quantity: quantity }
      }
      return item
    }))
  }

  const updateItemPrice = (id: string, price: number | string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // Price is the total, not unit price
        const numPrice = typeof price === 'string' ? parseFloat(price) || 0 : price
        return { ...item, price: price, total: numPrice }
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

  const filteredCategoriesForQuickCreate = foodCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredUnitsForQuickCreate = units.filter(unit =>
    unit.name.toLowerCase().includes(unitSearch.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(unitSearch.toLowerCase())
  )

  const subtotalAmount = items.reduce((sum, item) => sum + item.total, 0)
  const discountValue = hasDiscount ? (typeof discountAmount === 'string' ? parseFloat(discountAmount) || 0 : discountAmount) : 0
  const totalAmount = subtotalAmount - discountValue
  const totalItems = items.length

  // Detect changes
  const hasChanges = () => {
    if (!isEditMode) return true // Always allow save in create mode

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

    const hasValidItems = items.every(item => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
      const prc = typeof item.price === 'string' ? parseFloat(item.price) : item.price
      return qty > 0 && prc > 0
    })
    if (!hasValidItems) {
      toast.error("Todos los artículos deben tener cantidad y precio válidos")
      return
    }

    try {
      setLoading(true)

      // Crear artículos pendientes primero
      const tempIdToRealIdMap: Record<string, string> = {}

      if (pendingArticles.length > 0) {
        for (const pendingArticle of pendingArticles) {
          const selectedCategory = foodCategories.find(c => c.id === pendingArticle.categoryId)
          const selectedUnit = units.find(u => u.id === pendingArticle.unitId)

          const articleData: any = {
            name: pendingArticle.name,
            food_category_id: pendingArticle.categoryId,
            unit_id: pendingArticle.unitId,
            default_unit_id: pendingArticle.unitId,
            cost_per_unit: parseFloat(pendingArticle.costPerUnit),
            current_stock: 0, // Se creará con stock 0, se actualizará con la compra
            category: selectedCategory?.name || undefined,
            unit: selectedUnit?.symbol || selectedUnit?.name || undefined
          }

          const createdArticle = await DatabaseService.createIngredient(articleData)
          tempIdToRealIdMap[pendingArticle.tempId] = createdArticle.id
        }

        // Limpiar artículos pendientes después de crearlos
        setPendingArticles([])
      }

      // Reemplazar IDs temporales por IDs reales en los items
      const processedItems = items.map(item => {
        if (item.articleId.startsWith('pending-')) {
          const realId = tempIdToRealIdMap[item.articleId]
          if (realId) {
            return { ...item, articleId: realId }
          }
        }
        return item
      })

      const purchaseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        supplier_id: selectedSupplier.id,
        purchase_date: formData.purchaseDate,
        total_amount: totalAmount,
        status: formData.status,
        items: processedItems.map(item => ({
          article_id: item.articleId,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          unit: item.unitId,
          unit_cost: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          total_cost: item.total
        }))
      }

      if (isEditMode && purchaseId) {
        // Update mode
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
        const purchaseItems = processedItems.map(item => ({
          purchase_id: purchaseId,
          article_id: item.articleId,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          unit_id: item.unitId,
          unit_cost: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          total_cost: item.total
        }))

        const { error: itemsError } = await DatabaseService.supabase
          .from('purchase_items')
          .insert(purchaseItems)

        if (itemsError) throw itemsError

        toast.success("Compra actualizada exitosamente")
      } else {
        // Create mode
        const purchase = await DatabaseService.createPurchase(purchaseData)

        // Actualizar stock de artículos
        for (const item of processedItems) {
          await updateArticleStock(item)
        }

        toast.success("Compra creada exitosamente")
      }

      router.push("/purchases")
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} purchase:`, error)
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} compra: ${error?.message || 'desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateArticleStock = async (item: PurchaseItem) => {
    try {
      const article = articles.find(a => a.id === item.articleId)
      if (!article) return

      const currentStock = article.current_stock || 0
      const currentPrice = article.cost_per_unit || 0

      // Convert to number if string
      const itemQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
      const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price
      let quantityToAdd = itemQuantity

      // Calculate unit price from total price and quantity
      const unitPrice = itemQuantity > 0 ? itemPrice / itemQuantity : 0

      // Convertir cantidad a unidad base del artículo si es necesario
      const articleBaseUnitId = article.unit_id || article.default_unit_id

      if (articleBaseUnitId && item.unitId !== articleBaseUnitId) {
        const conversion = await DatabaseService.convertUnits(itemQuantity, item.unitId, articleBaseUnitId)

        if (conversion.success && conversion.convertedValue !== undefined) {
          quantityToAdd = conversion.convertedValue
        }
      }

      // Calcular precio promedio ponderado
      const totalCurrentValue = currentStock * currentPrice
      const totalNewValue = quantityToAdd * unitPrice
      const totalQuantity = currentStock + quantityToAdd
      const averagePrice = totalQuantity > 0 ? (totalCurrentValue + totalNewValue) / totalQuantity : unitPrice

      await DatabaseService.updateIngredient(item.articleId, {
        current_stock: totalQuantity,
        cost_per_unit: averagePrice
      })
    } catch (error) {
      console.error(`Error updating article stock for ${item.articleName}:`, error)
      throw new Error(`Error al actualizar stock de ${item.articleName}`)
    }
  }

  const canSave = !!(
    formData.name.trim() &&
    selectedSupplier &&
    items.length > 0 &&
    items.every(item => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity
      const prc = typeof item.price === 'string' ? parseFloat(item.price) : item.price
      return qty > 0 && prc > 0
    }) &&
    unmatchedItems.length === 0 && // No permitir guardar si hay productos sin coincidencia
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
            <DialogTitle className="text-xl">
              {changingItemId !== null
                ? 'Cambiar Artículo'
                : assigningItemIndex !== null
                ? 'Asignar Artículo'
                : 'Añadir Artículos'}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {changingItemId !== null
                ? 'Selecciona un artículo diferente (se mantendrán cantidad y precio)'
                : assigningItemIndex !== null
                ? `Selecciona un artículo para: ${unmatchedItems[assigningItemIndex]?.name}`
                : 'Busca y añade artículos de tu inventario'}
            </p>
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

          <DialogFooter className="border-t pt-4 mt-4 flex gap-2">
            {(assigningItemIndex !== null || changingItemId !== null) && (
              <Button
                variant="outline"
                onClick={handleCancelAssign}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={saveSelectedArticles}
              disabled={
                (assigningItemIndex !== null || changingItemId !== null)
                  ? selectedArticles.length !== 1
                  : selectedArticles.length === 0
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {changingItemId !== null
                ? selectedArticles.length === 1
                  ? 'Cambiar artículo'
                  : 'Selecciona 1 artículo'
                : assigningItemIndex !== null
                ? selectedArticles.length === 1
                  ? 'Asignar artículo'
                  : 'Selecciona 1 artículo'
                : `Guardar (${selectedArticles.length})`}
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
                {formData.name || (isEditMode ? 'Editar compra' : 'Crea una compra')}
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
                {loading ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white">
          <div className="p-6">
            <h1 ref={titleRef} className="text-3xl font-semibold mb-6">
              {isEditMode ? 'Editar compra' : 'Crea una compra'}
            </h1>

            {/* Banner informativo */}
            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xl">{isEditMode ? '📝' : '📢'}</span>
                <span className="text-sm">
                  {isEditMode
                    ? 'Modifica los detalles de esta compra. Los cambios se guardarán al presionar "Actualizar"'
                    : 'Crea compras detalladas que actualizarán automáticamente el inventario de productos'}
                </span>
              </div>
              {!isEditMode && <a href="#" className="text-blue-600 font-semibold text-sm hover:underline">Más información</a>}
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors cursor-pointer"
                    onClick={() => setIsSupplierModalOpen(true)}
                  >
                    Asignar
                  </button>
                  <button
                    type="button"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2"
                    onClick={() => setIsCreateSupplierModalOpen(true)}
                  >
                    <Plus size={16} />
                    Crear proveedor
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Añade el proveedor de esta compra
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
                      onClick={handleRemoveSupplier}
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

            {/* Sección Proveedor sin match (si aplica) */}
            {unmatchedSupplier && !selectedSupplier && (
              <section className="mb-10">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                    Proveedor sin coincidencia
                  </h3>
                  <p className="text-xs text-yellow-700 mb-3">
                    El proveedor de la factura no tiene un match automático. Asigna un proveedor existente o crea uno nuevo.
                  </p>

                  <div className="p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{unmatchedSupplier}</h4>
                        <p className="text-sm text-gray-600">Proveedor detectado en la factura</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white hover:bg-gray-50 border border-gray-300"
                          onClick={() => setIsSupplierModalOpen(true)}
                        >
                          <Search size={16} className="mr-2" />
                          Asignar proveedor
                        </Button>
                        <Button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setIsCreateSupplierModalOpen(true)}
                        >
                          <Plus size={16} className="mr-2" />
                          Crear proveedor
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 mb-10" />
              </section>
            )}

            {/* Sección Artículos */}
            <div className="mb-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Artículos</h2>
                  <p className="text-sm text-gray-600 mt-1">Añade los artículos de la compra con sus cantidades y costos</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsArticleModalOpen(true)}
                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Añadir artículos
                  </button>
                  <button
                    onClick={() => setIsQuickCreateArticleModalOpen(true)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Crear artículo
                  </button>
                </div>
              </div>

              {/* Productos sin match (requieren asignación manual) */}
              {unmatchedItems.length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                      Productos sin coincidencia ({unmatchedItems.length})
                    </h3>
                    <p className="text-xs text-yellow-700">
                      Los siguientes productos de la factura no tienen un match automático. Asigna un artículo de tu inventario a cada uno.
                    </p>
                  </div>

                  {unmatchedItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border-2 border-orange-300 rounded-lg bg-orange-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {item.quantity} {item.unit} • €{item.price.toFixed(2)} c/u • Total: €{item.total.toFixed(2)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCreateArticleFromUnmatched(item, index)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5"
                            >
                              <Plus size={14} />
                              Crear artículo
                            </button>
                            <button
                              onClick={() => handleAssignArticle(index)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5"
                            >
                              <Search size={14} />
                              Asignar artículo
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => openDeleteUnmatchedModal(index, item.name)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar producto sin coincidencia"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Banner informativo cuando está vacío */}
              {items.length === 0 && unmatchedItems.length === 0 && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Agrega los artículos de tu compra, se calcularán automáticamente los totales y se actualizará el inventario
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
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-semibold text-gray-900 block">{item.articleName}</span>
                          <button
                            onClick={() => handleChangeArticle(item.id)}
                            className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Cambiar producto"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                        {item.originalInvoiceName && (
                          <button
                            onClick={() => handleUndoAssignment(item.id)}
                            className="text-orange-600 hover:text-orange-700 p-2 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Deshacer asignación"
                          >
                            <Undo2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteItemModal(item.id, item.articleName)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar artículo"
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
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.]/g, '')

                              // Permitir solo un punto decimal
                              const parts = value.split('.')
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('')
                              }

                              // Limitar a 3 decimales
                              if (parts.length === 2 && parts[1].length > 3) {
                                value = parts[0] + '.' + parts[1].substring(0, 3)
                              }

                              // Guardar como string para permitir escribir "0."
                              updateItemQuantity(item.id, value === '' ? 0 : value)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                            placeholder="0.000"
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
                            value={item.price === 0 ? '' : item.price}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.]/g, '')

                              // Permitir solo un punto decimal
                              const parts = value.split('.')
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('')
                              }

                              // Limitar a 2 decimales para dinero
                              if (parts.length === 2 && parts[1].length > 2) {
                                value = parts[0] + '.' + parts[1].substring(0, 2)
                              }

                              // Guardar como string para permitir escribir "0."
                              updateItemPrice(item.id, value === '' ? 0 : value)
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

                  <div className="border-t border-gray-300 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de artículos:</span>
                      <span className="font-semibold text-gray-900">{items.length}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">€{subtotalAmount.toFixed(2)}</span>
                    </div>

                    {/* Descuento detectado/editable */}
                    {hasDiscount && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-orange-800">Descuento detectado:</span>
                          <button
                            onClick={() => {
                              setHasDiscount(false)
                              setDiscountAmount(0)
                              toast.success('Descuento eliminado')
                            }}
                            className="text-red-600 hover:text-red-700 text-xs underline"
                          >
                            Eliminar descuento
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">€</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={discountAmount === 0 ? '' : discountAmount}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9.]/g, '')
                              const parts = value.split('.')
                              if (parts.length > 2) {
                                value = parts[0] + '.' + parts.slice(1).join('')
                              }
                              if (parts.length === 2 && parts[1].length > 2) {
                                value = parts[0] + '.' + parts[1].substring(0, 2)
                              }
                              setDiscountAmount(value === '' ? 0 : value)
                            }}
                            className="flex-1 px-3 py-1.5 border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-sm bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-orange-700">
                          Puedes editar el monto del descuento si el procesamiento no fue exacto
                        </p>
                      </div>
                    )}

                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-900">Total de la compra:</span>
                        <span className="text-xl font-bold text-green-600">€{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de creación de artículo rápidamente */}
      <Dialog open={isQuickCreateArticleModalOpen} onOpenChange={setIsQuickCreateArticleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Crear artículo rápidamente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del artículo <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ej: Tomate cherry"
                value={quickCreateArticleData.name}
                onChange={(e) => setQuickCreateArticleData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Buscar categoría..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {categorySearch === "" || filteredCategoriesForQuickCreate.length > 0 ? (
                  (categorySearch === "" ? foodCategories : filteredCategoriesForQuickCreate).map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setQuickCreateArticleData(prev => ({ ...prev, categoryId: cat.id }))
                        setCategorySearch("")
                      }}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2",
                        quickCreateArticleData.categoryId === cat.id && "bg-blue-50 border-l-4 border-blue-600"
                      )}
                    >
                      <span>{cat.icon || "📁"}</span>
                      <span className="text-gray-900">{cat.name}</span>
                      {quickCreateArticleData.categoryId === cat.id && (
                        <span className="ml-auto text-blue-600">✓</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">No se encontraron categorías</div>
                )}
              </div>
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Buscar unidad..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {unitSearch === "" || filteredUnitsForQuickCreate.length > 0 ? (
                  (unitSearch === "" ? units : filteredUnitsForQuickCreate).map((unit) => (
                    <div
                      key={unit.id}
                      onClick={() => {
                        setQuickCreateArticleData(prev => ({ ...prev, unitId: unit.id }))
                        setUnitSearch("")
                      }}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors",
                        quickCreateArticleData.unitId === unit.id && "bg-blue-50 border-l-4 border-blue-600"
                      )}
                    >
                      <span className="text-gray-900">{unit.name}</span>
                      <span className="text-gray-500 text-sm ml-2">({unit.symbol})</span>
                      {quickCreateArticleData.unitId === unit.id && (
                        <span className="ml-2 text-blue-600">✓</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">No se encontraron unidades</div>
                )}
              </div>
            </div>

            {/* Precio y Stock en una fila */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (€) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={quickCreateArticleData.costPerUnit}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9.]/g, '')
                    setQuickCreateArticleData(prev => ({ ...prev, costPerUnit: sanitized }))
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock actual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={quickCreateArticleData.unitId
                      ? `Ej: 10 ${units.find(u => u.id === quickCreateArticleData.unitId)?.symbol || ''}`
                      : "0"
                    }
                    value={quickCreateArticleData.currentStock}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^0-9.]/g, '')
                      setQuickCreateArticleData(prev => ({ ...prev, currentStock: sanitized }))
                    }}
                  />
                  {quickCreateArticleData.unitId && quickCreateArticleData.currentStock && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {units.find(u => u.id === quickCreateArticleData.unitId)?.symbol}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickCreateArticleModalOpen(false)
                setQuickCreateArticleData({ name: "", categoryId: "", unitId: "", costPerUnit: "", currentStock: "" })
                setCategorySearch("")
                setUnitSearch("")
              }}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleQuickCreateArticle}
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              Crear artículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de creación de proveedor */}
      <CreateSupplierModal
        isOpen={isCreateSupplierModalOpen}
        onClose={() => setIsCreateSupplierModalOpen(false)}
        onSuccess={handleCreateSupplierSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteItemModal}
        onConfirm={confirmRemoveItem}
        title="Eliminar Artículo"
        description="¿Estás seguro de que deseas remover el artículo"
        itemName={itemToDelete?.name || ''}
        isLoading={isDeletingItem}
      />
    </>
  )
}
