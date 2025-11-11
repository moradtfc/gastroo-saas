import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    const categories = await DatabaseService.getFoodCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching food categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

