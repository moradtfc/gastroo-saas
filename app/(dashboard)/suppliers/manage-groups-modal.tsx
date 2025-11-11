"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatabaseService, Group } from "@/lib/database"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ManageGroupsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSupplierIds: string[]
  onSuccess: () => void
}

export function ManageGroupsModal({ isOpen, onClose, selectedSupplierIds, onSuccess }: ManageGroupsModalProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [editGroupName, setEditGroupName] = useState("")
  const [editGroupDescription, setEditGroupDescription] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadGroups()
    }
  }, [isOpen])

  const loadGroups = async () => {
    try {
      const data = await DatabaseService.getGroups()
      setGroups(data || [])
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Error al cargar grupos')
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('El nombre del grupo es obligatorio')
      return
    }

    try {
      setLoading(true)
      const newGroup = await DatabaseService.createGroup({
        name: newGroupName,
        description: newGroupDescription || undefined
      })

      // Si hay proveedores seleccionados, añadirlos al grupo
      if (selectedSupplierIds.length > 0) {
        await DatabaseService.addSuppliersToGroup(newGroup.id, selectedSupplierIds)
      }

      toast.success('Grupo creado exitosamente')
      setNewGroupName("")
      setNewGroupDescription("")
      setIsCreatingGroup(false)
      loadGroups()
      onSuccess()
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error(error.message || 'Error al crear grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGroup = async (groupId: string) => {
    if (!editGroupName.trim()) {
      toast.error('El nombre del grupo es obligatorio')
      return
    }

    try {
      setLoading(true)
      await DatabaseService.updateGroup(groupId, {
        name: editGroupName,
        description: editGroupDescription || undefined
      })

      toast.success('Grupo actualizado exitosamente')
      setEditingGroupId(null)
      setEditGroupName("")
      setEditGroupDescription("")
      loadGroups()
    } catch (error: any) {
      console.error('Error updating group:', error)
      toast.error(error.message || 'Error al actualizar grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el grupo "${groupName}"?`)) {
      return
    }

    try {
      setLoading(true)
      await DatabaseService.deleteGroup(groupId)
      toast.success('Grupo eliminado exitosamente')
      loadGroups()
    } catch (error: any) {
      console.error('Error deleting group:', error)
      toast.error(error.message || 'Error al eliminar grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToGroup = async (groupId: string, groupName: string) => {
    if (selectedSupplierIds.length === 0) {
      toast.error('No hay proveedores seleccionados')
      return
    }

    try {
      setLoading(true)
      await DatabaseService.addSuppliersToGroup(groupId, selectedSupplierIds)
      toast.success(`${selectedSupplierIds.length} proveedor(es) añadido(s) a "${groupName}"`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error adding suppliers to group:', error)
      toast.error(error.message || 'Error al añadir proveedores al grupo')
    } finally {
      setLoading(false)
    }
  }

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
    setEditGroupDescription(group.description || "")
  }

  const cancelEdit = () => {
    setEditingGroupId(null)
    setEditGroupName("")
    setEditGroupDescription("")
  }

  const handleClose = () => {
    setIsCreatingGroup(false)
    setEditingGroupId(null)
    setNewGroupName("")
    setNewGroupDescription("")
    setEditGroupName("")
    setEditGroupDescription("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {selectedSupplierIds.length > 0 
              ? `Agrupar ${selectedSupplierIds.length} proveedor(es)`
              : 'Gestionar grupos'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botón para crear nuevo grupo */}
          {!isCreatingGroup && (
            <Button
              onClick={() => setIsCreatingGroup(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear nuevo grupo
            </Button>
          )}

          {/* Formulario de creación de grupo */}
          {isCreatingGroup && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-blue-50">
              <div className="space-y-2">
                <Label htmlFor="newGroupName">Nombre del grupo *</Label>
                <Input
                  id="newGroupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej: Proveedores locales"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newGroupDescription">Descripción</Label>
                <Input
                  id="newGroupDescription"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateGroup}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Crear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingGroup(false)
                    setNewGroupName("")
                    setNewGroupDescription("")
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de grupos */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Grupos existentes ({groups.length})
            </Label>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay grupos creados</p>
                <p className="text-sm">Crea un grupo para organizar tus proveedores</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      "border rounded-lg p-4 transition-colors",
                      editingGroupId === group.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {editingGroupId === group.id ? (
                      // Modo edición
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Input
                            value={editGroupName}
                            onChange={(e) => setEditGroupName(e.target.value)}
                            placeholder="Nombre del grupo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={editGroupDescription}
                            onChange={(e) => setEditGroupDescription(e.target.value)}
                            placeholder="Descripción"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateGroup(group.id)}
                            disabled={loading}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Guardar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={loading}
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo vista
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedSupplierIds.length > 0 && (
                            <Button
                              onClick={() => handleAddToGroup(group.id, group.name)}
                              disabled={loading}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Añadir
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditGroup(group)}
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

