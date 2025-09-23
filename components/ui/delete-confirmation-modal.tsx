"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

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
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 text-center mt-4">
            {description}
            <span className="font-semibold text-gray-900"> "{itemName}"</span>?
            <br />
            <span className="text-sm text-red-600 mt-3 block">
              Esta acción no se puede deshacer.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Additional info and warnings */}
        {(additionalInfo || warningItems) && (
          <div className="px-6 pb-4">
            {additionalInfo && (
              <p className="text-sm text-orange-700 mb-3 font-medium">
                {additionalInfo}
              </p>
            )}
            {warningItems && warningItems.length > 0 && (
              <ul className="space-y-2">
                {warningItems.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel 
            onClick={onClose}
            disabled={isLoading}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
