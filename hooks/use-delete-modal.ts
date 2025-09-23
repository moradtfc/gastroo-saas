import { useState } from 'react'

interface DeleteModalState<T = any> {
  isOpen: boolean
  item: T | null
  isLoading: boolean
}

export function useDeleteModal<T = any>() {
  const [deleteModal, setDeleteModal] = useState<DeleteModalState<T>>({
    isOpen: false,
    item: null,
    isLoading: false
  })

  const openDeleteModal = (item: T) => {
    setDeleteModal({
      isOpen: true,
      item,
      isLoading: false
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      item: null,
      isLoading: false
    })
  }

  const setLoading = (loading: boolean) => {
    setDeleteModal(prev => ({ ...prev, isLoading: loading }))
  }

  return {
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    setLoading
  }
}
