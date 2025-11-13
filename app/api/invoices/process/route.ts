import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Determine media type
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
      return NextResponse.json(
        { message: 'Formato de imagen no soportado' },
        { status: 400 }
      )
    }

    // Analyze invoice with Claude Vision
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analiza esta factura y extrae la siguiente información en formato JSON:

{
  "supplier": "nombre de la empresa que emitió la factura",
  "date": "fecha de la factura en formato YYYY-MM-DD",
  "items": [
    {
      "name": "nombre del producto",
      "quantity": cantidad como número,
      "unit": "unidad de medida (kg, g, L, ml, unidades, etc)",
      "price": precio unitario como número,
      "total": total del item como número
    }
  ],
  "subtotal": subtotal total como número,
  "currency": "símbolo de la moneda (€, $, etc)"
}

Instrucciones importantes:
- Extrae TODOS los productos listados en la factura
- Los números deben ser numéricos, sin símbolos de moneda
- Si no puedes determinar algún valor, usa valores por defecto razonables
- La unidad debe ser lo más específica posible (kg, g, L, ml, etc)
- El total de cada item debe ser quantity * price
- El subtotal debe ser la suma de todos los totales
- Devuelve SOLO el JSON, sin texto adicional`
            }
          ],
        },
      ],
    })

    // Extract JSON from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Try to find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta')
    }

    const invoiceData = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!invoiceData.supplier || !invoiceData.date || !invoiceData.items || !Array.isArray(invoiceData.items)) {
      throw new Error('Formato de datos inválido')
    }

    // Ensure all items have required fields
    invoiceData.items = invoiceData.items.map((item: any) => ({
      name: item.name || 'Producto sin nombre',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'unidad',
      price: Number(item.price) || 0,
      total: Number(item.total) || (Number(item.quantity) * Number(item.price))
    }))

    // Recalculate subtotal to ensure accuracy
    invoiceData.subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + item.total, 0)

    // Set default currency if not provided
    if (!invoiceData.currency) {
      invoiceData.currency = '€'
    }

    return NextResponse.json(invoiceData)

  } catch (error: any) {
    console.error('Error processing invoice:', error)
    return NextResponse.json(
      { message: error.message || 'Error al procesar la factura' },
      { status: 500 }
    )
  }
}
