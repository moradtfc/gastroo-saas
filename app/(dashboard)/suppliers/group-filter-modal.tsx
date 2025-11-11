"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Group } from "@/lib/database"
import { cn } from "@/lib/utils"

interface GroupFilterModalProps {
  isOpen: boolean
  groups: Group[]
  selectedGroupIds: string[]
  onClose: () => void
  onApply: (groupIds: string[]) => void
}

export function GroupFilterModal({
  isOpen,
  groups,
  selectedGroupIds,
  onClose,
  onApply,
}: GroupFilterModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedGroupIds)

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedGroupIds)
      setSearchTerm("")
    }
  }, [isOpen, selectedGroupIds])

  const filteredGroups = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()

    if (!normalizedTerm) {
      return groups
    }

    return groups.filter((group) =>
      group.name.toLowerCase().includes(normalizedTerm) ||
      (group.description || "").toLowerCase().includes(normalizedTerm)
    )
  }, [groups, searchTerm])

  const toggleSelection = (groupId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleApply = () => {
    onApply(localSelectedIds)
  }

  const handleClear = () => {
    setLocalSelectedIds([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Filtrar proveedores por grupo
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Selecciona uno o varios grupos para limitar la lista de proveedores.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar grupo..."
              className="h-10"
            />
          </div>

          <div className="border border-gray-200 rounded-lg">
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {groups.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No hay grupos creados todavía.
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No se encontraron grupos con ese término.
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const isSelected = localSelectedIds.includes(group.id)

                  return (
                    <label
                      key={group.id}
                      className={cn(
                        "flex items-start justify-between gap-4 px-4 py-3 cursor-pointer transition-colors",
                        "hover:bg-blue-50",
                        isSelected && "bg-blue-50"
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{group.name}</p>
                        {group.description && (
                          <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(group.id)}
                        className="w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {localSelectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-600 mr-1">
                Seleccionados:
              </span>
              {localSelectedIds.map((groupId) => {
                const group = groups.find((item) => item.id === groupId)
                if (!group) return null

                return (
                  <button
                    key={groupId}
                    type="button"
                    onClick={() => toggleSelection(groupId)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <span className="max-w-[140px] truncate">{group.name}</span>
                    <span aria-hidden="true" className="text-blue-500 hover:text-blue-700">×</span>
                    <span className="sr-only">Eliminar {group.name}</span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

