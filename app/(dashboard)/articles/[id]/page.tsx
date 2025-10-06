"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface ArticleDetailPageProps {
  params: {
    id: string
  }
}

export default function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a la página de edición
    router.replace(`/articles/${params.id}/edit`)
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}
