"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Check, FileText } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { DatabaseService } from "@/lib/database"
import { productMatchingScore, toTitleCase } from "@/lib/text-similarity"

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
  onNavigateToCreate?: () => void
}

export function UploadInvoiceModal({ isOpen, onClose, onSuccess, onNavigateToCreate }: UploadInvoiceModalProps) {
  const [step, setStep] = useState<'upload' | 'processing'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])

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
    // Rastrear artículos ya asignados para evitar duplicados
    const usedArticleIds = new Set<string>()

    // Calcular todos los matches posibles para cada item
    const itemsWithMatches = items.map((item, itemIndex) => {
      const scoredArticles = articles.map(article => ({
        article,
        score: productMatchingScore(item.name, article.name)
      }))

      scoredArticles.sort((a, b) => b.score - a.score)

      return {
        itemIndex,
        item,
        scoredArticles
      }
    })

    // Ordenar items por mejor score (de mayor a menor) para asignar primero los matches más fuertes
    itemsWithMatches.sort((a, b) => {
      const bestScoreA = a.scoredArticles[0]?.score || 0
      const bestScoreB = b.scoredArticles[0]?.score || 0
      return bestScoreB - bestScoreA
    })

    // Crear array de resultados en el orden original
    const results: ItemMatch[] = new Array(items.length)

    // Asignar matches evitando duplicados
    for (const { itemIndex, item, scoredArticles } of itemsWithMatches) {
      // Filtrar artículos ya usados
      const availableArticles = scoredArticles.filter(sa => !usedArticleIds.has(sa.article.id))

      // Tomar los top 5 disponibles para sugerencias
      const suggestedArticles = availableArticles.slice(0, 5)

      // Auto-seleccionar si el mejor match disponible tiene score >= 0.7
      const bestMatch = suggestedArticles[0]
      let selectedArticleId: string | null = null

      if (bestMatch && bestMatch.score >= 0.7) {
        selectedArticleId = bestMatch.article.id
        usedArticleIds.add(selectedArticleId) // Marcar como usado
      }

      results[itemIndex] = {
        selectedArticleId,
        matchScore: bestMatch ? bestMatch.score : 0,
        suggestedArticles
      }
    }

    return results
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB")
        return
      }
      setSelectedFile(file)

      // Solo generar preview para imágenes, no para PDFs
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo")
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

      // Aplicar formato de título a productos y proveedor
      const formattedData = {
        ...data,
        supplier: toTitleCase(data.supplier),
        items: data.items.map((item: InvoiceItem) => ({
          ...item,
          name: toTitleCase(item.name)
        }))
      }

      // Hacer matching automático de productos
      const matches = performMatching(formattedData.items)

      // Guardar datos en sessionStorage inmediatamente
      const invoiceSessionData = {
        supplier: formattedData.supplier,
        date: formattedData.date,
        purchaseName: `Compra - ${formattedData.supplier} - ${new Date(formattedData.date).toLocaleDateString('es-ES')}`,
        status: 'paid',
        currency: formattedData.currency,
        subtotal: formattedData.subtotal,
        detectedDiscount: formattedData.detectedDiscount || 0,
        items: formattedData.items.map((item: InvoiceItem, index: number) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total,
          matchedArticleId: matches[index]?.selectedArticleId || null,
          matchScore: matches[index]?.matchScore || 0
        }))
      }

      sessionStorage.setItem('invoiceData', JSON.stringify(invoiceSessionData))

      toast.success("Factura procesada exitosamente")

      // Navegar a create
      if (onNavigateToCreate) {
        onNavigateToCreate()
      }

      // Cerrar modal
      handleClose()
    } catch (error: any) {
      console.error('Error processing invoice:', error)
      toast.error(error.message || "Error al procesar la factura")
      setStep('upload')
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessing(false)
    onClose()
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
                  📄 <strong>Sube una imagen o PDF de tu factura</strong> para que podamos analizarla automáticamente.
                  Asegúrate de que el texto sea legible y la calidad sea buena.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <input
                  type="file"
                  id="invoice-upload"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!selectedFile ? (
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Haz clic para seleccionar un archivo
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          PNG, JPG, JPEG, WEBP o PDF (máx. 10MB)
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
                        Cambiar archivo
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {selectedFile.type === 'application/pdf' ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-24 w-24 text-red-500" />
                      <p className="text-sm text-gray-600 font-medium">Archivo PDF seleccionado</p>
                    </div>
                  ) : previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  ) : null}
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
              Estamos analizando tu factura. Serás redirigido automáticamente a la página de creación de compra.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
