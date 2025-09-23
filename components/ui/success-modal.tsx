"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, DollarSign, TrendingUp, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  operation: string
  details: {
    totalItems?: number
    totalAmount?: number
    itemsUpdated?: string[]
    stockUpdated?: boolean
    expenseCreated?: boolean
    supplier?: string
    date?: string
  }
  onViewDetails?: () => void
  onContinue?: () => void
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  operation,
  details,
  onViewDetails,
  onContinue
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <p className="text-center text-gray-600 mt-1 text-sm">
            {operation} realizada exitosamente
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resumen de la operación */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Resumen de la operación:</h4>
            
            {details.supplier && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Proveedor:</span>
                <Badge variant="secondary">{details.supplier}</Badge>
              </div>
            )}
            
            {details.date && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fecha:</span>
                <span className="text-sm font-medium">{details.date}</span>
              </div>
            )}
            
            {details.totalItems && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Artículos:
                </span>
                <span className="text-sm font-medium">{details.totalItems} productos</span>
              </div>
            )}
            
            {details.totalAmount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total:
                </span>
                <span className="text-lg font-bold text-green-600">
                  €{details.totalAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Actualizaciones automáticas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-900 text-sm">Actualizaciones automáticas:</h4>
            </div>
            <div className="space-y-1">
              {details.stockUpdated && (
                <div className="flex items-center gap-2 text-xs text-blue-800">
                  <CheckCircle className="w-3 h-3" />
                  <span>Stock de ingredientes actualizado</span>
                </div>
              )}
              {details.expenseCreated && (
                <div className="flex items-center gap-2 text-xs text-blue-800">
                  <CheckCircle className="w-3 h-3" />
                  <span>Gasto registrado automáticamente</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <CheckCircle className="w-3 h-3" />
                <span>Precios promedio recalculados</span>
              </div>
            </div>
          </div>

          {/* Productos actualizados */}
          {details.itemsUpdated && details.itemsUpdated.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-medium text-green-900 mb-2 text-sm">Productos actualizados:</h4>
              <div className="flex flex-wrap gap-1">
                {details.itemsUpdated.slice(0, 4).map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs text-green-700 border-green-300 px-2 py-1">
                    {item}
                  </Badge>
                ))}
                {details.itemsUpdated.length > 4 && (
                  <Badge variant="outline" className="text-xs text-green-700 border-green-300 px-2 py-1">
                    +{details.itemsUpdated.length - 4} más
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          {onViewDetails && (
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="flex-1"
            >
              Ver Detalles
            </Button>
          )}
          <Button
            onClick={onContinue || onClose}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {onContinue ? (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              "Entendido"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
