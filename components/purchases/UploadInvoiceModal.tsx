"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, FileText, Loader2, Check, Edit2, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { DatabaseService } from "@/lib/database"
import { advancedSimilarity } from "@/lib/text-similarity"

interface InvoiceItem {
  name: string
  quantity: number
  unit: string
  price: number
  total: number
}

interface Article {
  id: string
  name: string
  current_stock: number
  cost_per_unit: number
  unit_id?: string
  default_unit_id?: string
  units?: {
    id: string
    name: string
    abbreviation: string
  }
}

interface ItemMatch {
  selectedArticleId: string | null
  matchScore: number
  suggestedArticles: Array<{
    article: Article
    score: number
  }>
}

interface InvoiceData {
  supplier: string
  date: string
  items: InvoiceItem[]
  subtotal: number
  currency: string
}

interface UploadInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: InvoiceData & { purchaseName: string; status: string; itemMatches: ItemMatch[] }) => void
}

export function UploadInvoiceModal({ isOpen, onClose, onSuccess }: UploadInvoiceModalProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [purchaseName, setPurchaseName] = useState("")
  const [status, setStatus] = useState("paid")
  const [articles, setArticles] = useState<Article[]>([])
  const [itemMatches, setItemMatches] = useState<ItemMatch[]>([])

  // Cargar artículos del inventario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadArticles()
    }
  }, [isOpen])

  const loadArticles = async () => {
    try {
      const data = await DatabaseService.getArticles()
      setArticles(data || [])
    } catch (error) {
      console.error('Error loading articles:', error)
      toast.error('Error al cargar el inventario')
    }
  }

  const performMatching = (items: InvoiceItem[]): ItemMatch[] => {
    return items.map(item => {
      // Calcular scores para todos los artículos
      const scoredArticles = articles.map(article => ({
        article,
        score: advancedSimilarity(item.name, article.name)
      }))

      // Ordenar por score descendente
      scoredArticles.sort((a, b) => b.score - a.score)

      // Tomar los top 5
      const suggestedArticles = scoredArticles.slice(0, 5)

      // Auto-seleccionar si el score es alto
      const bestMatch = suggestedArticles[0]
      const selectedArticleId = bestMatch && bestMatch.score >= 0.5 ? bestMatch.article.id : null

      return {
        selectedArticleId,
        matchScore: bestMatch ? bestMatch.score : 0,
        suggestedArticles
      }
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB")
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona una imagen")
      return
    }

    setProcessing(true)
    setStep('processing')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/invoices/process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al procesar la factura')
      }

      const data = await response.json()
      setInvoiceData(data)

      // Hacer matching automático de productos
      const matches = performMatching(data.items)
      setItemMatches(matches)

      setStep('review')
      toast.success("Factura procesada exitosamente")
    } catch (error: any) {
      console.error('Error processing invoice:', error)
      toast.error(error.message || "Error al procesar la factura")
      setStep('upload')
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmit = () => {
    if (!invoiceData) return

    if (!purchaseName.trim()) {
      toast.error("El nombre de la compra es obligatorio")
      return
    }

    // Validar que todos los items tengan un artículo seleccionado
    const hasUnmatchedItems = itemMatches.some(match => !match.selectedArticleId)
    if (hasUnmatchedItems) {
      toast.error("Por favor selecciona un artículo para todos los productos de la factura")
      return
    }

    onSuccess({
      ...invoiceData,
      purchaseName: purchaseName.trim(),
      status,
      itemMatches
    })
    handleClose()
  }

  const handleClose = () => {
    setStep('upload')
    setSelectedFile(null)
    setPreviewUrl(null)
    setInvoiceData(null)
    setPurchaseName("")
    setStatus("paid")
    setItemMatches([])
    onClose()
  }

  const updateItemMatch = (index: number, articleId: string) => {
    const newMatches = [...itemMatches]
    const selectedArticle = articles.find(a => a.id === articleId)

    if (selectedArticle) {
      newMatches[index] = {
        ...newMatches[index],
        selectedArticleId: articleId,
        matchScore: advancedSimilarity(invoiceData?.items[index]?.name || '', selectedArticle.name)
      }
      setItemMatches(newMatches)
    }
  }

  const getMatchIndicator = (score: number) => {
    if (score >= 0.85) {
      return {
        icon: <CheckCircle className="text-green-600" size={20} />,
        color: 'text-green-600',
        label: 'Excelente coincidencia',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else if (score >= 0.5) {
      return {
        icon: <AlertTriangle className="text-yellow-600" size={20} />,
        color: 'text-yellow-600',
        label: 'Posible coincidencia',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    } else {
      return {
        icon: <XCircle className="text-red-600" size={20} />,
        color: 'text-red-600',
        label: 'Sin coincidencia',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!invoiceData) return
    const newItems = [...invoiceData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalcular total del item
    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].quantity * newItems[index].price
    }

    // Recalcular subtotal
    const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0)

    setInvoiceData({
      ...invoiceData,
      items: newItems,
      subtotal: newSubtotal
    })
  }

  const removeItem = (index: number) => {
    if (!invoiceData) return
    const newItems = invoiceData.items.filter((_, i) => i !== index)
    const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0)
    setInvoiceData({
      ...invoiceData,
      items: newItems,
      subtotal: newSubtotal
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Subir Factura</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  📸 <strong>Sube una imagen de tu factura en el mejor estado posible</strong> para que podamos analizarla automáticamente.
                  Asegúrate de que el texto sea legible y la imagen esté bien iluminada.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <input
                  type="file"
                  id="invoice-upload"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!selectedFile ? (
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Haz clic para seleccionar una imagen
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG, JPEG o WEBP (máx. 10MB)
                        </p>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <Check className="mx-auto h-12 w-12 text-green-600" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <label htmlFor="invoice-upload" className="text-sm text-blue-600 hover:underline cursor-pointer">
                        Cambiar imagen
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleProcess}
                disabled={!selectedFile || processing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Procesar Factura'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando factura...</h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Estamos analizando tu factura con inteligencia artificial. Esto puede tomar unos segundos.
            </p>
          </div>
        )}

        {step === 'review' && invoiceData && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700">
                  ✅ <strong>Factura procesada exitosamente.</strong> Revisa y edita los datos si es necesario.
                </p>
              </div>

              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Información de la Factura</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Proveedor</label>
                    <Input
                      value={invoiceData.supplier}
                      onChange={(e) => setInvoiceData({ ...invoiceData, supplier: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
                    <Input
                      type="date"
                      value={invoiceData.date}
                      onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Artículos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Artículos ({invoiceData.items.length})</h3>

                <div className="space-y-3">
                  {invoiceData.items.map((item, index) => {
                    const match = itemMatches[index]
                    const indicator = match ? getMatchIndicator(match.matchScore) : getMatchIndicator(0)
                    const selectedArticle = match?.selectedArticleId
                      ? articles.find(a => a.id === match.selectedArticleId)
                      : null

                    return (
                      <div key={index} className={`p-4 border rounded-lg ${indicator.bgColor} ${indicator.borderColor}`}>
                        {/* Producto detectado */}
                        <div className="mb-3 flex items-start gap-2">
                          {indicator.icon}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.quantity} {item.unit} • {invoiceData.currency}{item.price.toFixed(2)} • Total: {invoiceData.currency}{item.total.toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Selector de artículo del inventario */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-700">
                            Artículo en inventario {match?.selectedArticleId ? '' : '(Obligatorio)'}
                          </label>
                          <select
                            value={match?.selectedArticleId || ''}
                            onChange={(e) => updateItemMatch(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Seleccionar artículo...</option>
                            {match?.suggestedArticles.map(({ article, score }) => (
                              <option key={article.id} value={article.id}>
                                {article.name} ({Math.round(score * 100)}% coincidencia)
                              </option>
                            ))}
                            <option disabled>──────────</option>
                            {articles
                              .filter(a => !match?.suggestedArticles.some(s => s.article.id === a.id))
                              .map(article => (
                                <option key={article.id} value={article.id}>
                                  {article.name}
                                </option>
                              ))}
                          </select>

                          {selectedArticle && (
                            <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                              Stock actual: {selectedArticle.current_stock} {selectedArticle.units?.abbreviation || selectedArticle.units?.name || 'uds'}
                              {' • '}
                              Costo: {invoiceData.currency}{selectedArticle.cost_per_unit?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </div>

                        {/* Editar datos del item */}
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                            <Input
                              type="number"
                              step="0.001"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Precio Unit.</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Total</label>
                            <div className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-semibold text-center">
                              {invoiceData.currency}{item.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-semibold text-gray-900">Subtotal:</span>
                  <span className="text-xl font-bold text-blue-700">
                    {invoiceData.currency}{invoiceData.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Datos Adicionales */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Datos de la Compra</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Nombre de la Compra <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={purchaseName}
                      onChange={(e) => setPurchaseName(e.target.value)}
                      placeholder="Ej: Compra mensual de ingredientes"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="paid">Pagado</option>
                      <option value="unpaid">Por Pagar</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Volver
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!purchaseName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Crear Compra
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
