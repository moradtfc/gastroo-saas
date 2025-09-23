"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UnitConversionErrorModalProps {
  isOpen: boolean
  onClose: () => void
  ingredientName: string
  fromUnit: string
  toUnit: string
  errorMessage: string
  fromCategory?: string
  toCategory?: string
}

export function UnitConversionErrorModal({
  isOpen,
  onClose,
  ingredientName,
  fromUnit,
  toUnit,
  errorMessage,
  fromCategory,
  toCategory
}: UnitConversionErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-lg font-semibold text-gray-900">
            Error de Conversión de Unidades
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Información del ingrediente */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Ingrediente afectado:</h4>
            <Badge variant="secondary" className="text-sm">
              {ingredientName}
            </Badge>
          </div>

          {/* Conversión intentada */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="font-medium text-red-900 mb-2 text-sm">Conversión no válida:</h4>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-red-700 border-red-300">
                {fromUnit}
                {fromCategory && <span className="ml-1 text-xs">({fromCategory})</span>}
              </Badge>
              <X className="w-4 h-4 text-red-600" />
              <Badge variant="outline" className="text-red-700 border-red-300">
                {toUnit}
                {toCategory && <span className="ml-1 text-xs">({toCategory})</span>}
              </Badge>
            </div>
          </div>

          {/* Mensaje de error */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-900 mb-2 text-sm">Explicación:</h4>
            <p className="text-sm text-yellow-800">
              {errorMessage}
            </p>
          </div>

          {/* Sugerencias */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">Sugerencias:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Solo puedes convertir entre unidades de la misma categoría</li>
              <li>• Verifica que estés usando la unidad correcta para este ingrediente</li>
              <li>• Si necesitas cambiar la unidad base del ingrediente, edítalo desde su perfil</li>
            </ul>
          </div>
        </div>

        {/* Botón de cerrar */}
        <div className="flex justify-center pt-2 border-t border-gray-100">
          <Button
            onClick={onClose}
            className="px-8"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
