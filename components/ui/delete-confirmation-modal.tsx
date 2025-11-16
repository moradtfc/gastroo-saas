"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  isLoading?: boolean
  additionalInfo?: string
  warningItems?: string[]
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  additionalInfo,
  warningItems
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[450px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <p className="text-gray-600 text-center">
            {description}
            <span className="font-semibold text-gray-900"> "{itemName}"</span>?
          </p>
          <p className="text-sm text-red-600 mt-3 text-center font-medium">
            Esta acción no se puede deshacer.
          </p>

          {/* Additional info and warnings */}
          {(additionalInfo || warningItems) && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              {additionalInfo && (
                <p className="text-sm text-orange-700 mb-2 font-medium">
                  {additionalInfo}
                </p>
              )}
              {warningItems && warningItems.length > 0 && (
                <ul className="space-y-1">
                  {warningItems.map((item, index) => (
                    <li key={index} className="text-sm text-orange-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
