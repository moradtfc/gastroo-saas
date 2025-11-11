import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    const suppliers = await DatabaseService.getSuppliers()
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supplier = await DatabaseService.createSupplier(body)
    return NextResponse.json(supplier, { status: 201 })
  } catch (error: any) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear proveedor' },
      { status: 500 }
    )
  }
}

