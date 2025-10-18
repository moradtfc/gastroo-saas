"use client"

import CreateRecipeForm from '../../new/page'

interface EditRecipePageProps {
  params: {
    id: string
  }
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  return <CreateRecipeForm params={params} />
}