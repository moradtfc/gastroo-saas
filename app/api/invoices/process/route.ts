import { NextRequest, NextResponse } from 'next/server'

interface InvoiceItem {
  name: string
  quantity: number
  unit: string
  price: number
  total: number
}

interface InvoiceData {
  supplier: string
  date: string
  items: InvoiceItem[]
  subtotal: number
  total: number
  currency: string
}

// API Key de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA4vWfXWpO5-u2tlXlYe2hfR_QhzP0Lmco'

// Prompt optimizado para extracción de datos de facturas
const INVOICE_EXTRACTION_PROMPT = `
Analiza esta imagen de factura y extrae la información en formato JSON.

IMPORTANTE:
- Extrae SOLO los productos/items comprados, NO incluyas líneas de resumen como "TOTAL", "SUBTOTAL", "IVA", etc.
- Si encuentras las palabras "TOTAL" o "SUBTOTAL" en una línea, esa línea NO es un producto, es el resumen.
- La lista de productos termina cuando aparece "SUBTOTAL" o "TOTAL".

Devuelve un JSON con esta estructura exacta:
{
  "supplier": "Nombre del proveedor/tienda",
  "date": "YYYY-MM-DD",
  "currency": "€" o "$" o "£",
  "items": [
    {
      "name": "Nombre del producto (limpio, sin códigos ni símbolos)",
      "quantity": número,
      "unit": "kg" | "g" | "L" | "ml" | "unidad",
      "price": precio_unitario_decimal,
      "total": total_decimal
    }
  ],
  "subtotal": número_decimal,
  "total": número_decimal
}

Reglas:
1. Nombres de productos: Limpia códigos, símbolos, y caracteres extraños. Solo el nombre legible.
2. Números: Usa formato decimal con punto (ej: 2.50, no 2,50)
3. Fecha: Formato YYYY-MM-DD siempre
4. Si no puedes determinar algún valor, usa: 0 para números, "desconocido" para textos, "unidad" para units
5. NO incluyas en items: líneas con TOTAL, SUBTOTAL, IVA, IMPUESTOS, DESCUENTOS, CAMBIO, etc.

Responde SOLO con el JSON, sin explicaciones adicionales.
`.trim()

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

    // Validar tipo de archivo
    const mediaType = file.type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
      return NextResponse.json(
        { message: 'Formato de imagen no soportado. Use JPEG, PNG, GIF o WEBP.' },
        { status: 400 }
      )
    }

    // Validar que la API key esté configurada
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
      console.error('GEMINI_API_KEY no está configurada')
      return NextResponse.json(
        { message: 'Error de configuración del servidor. Contacte al administrador.' },
        { status: 500 }
      )
    }

    // Convertir archivo a buffer y luego a base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    console.log('Procesando factura con Gemini AI (API REST)...')
    console.log(`Tamaño de imagen: ${(bytes.byteLength / 1024).toFixed(2)} KB`)

    // Llamar directamente a la API REST de Gemini usando la v1 (no beta)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

    const requestBody = {
      contents: [{
        parts: [
          { text: INVOICE_EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType: mediaType,
              data: base64Image
            }
          }
        ]
      }]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error de Gemini API:', response.status, errorText)

      return NextResponse.json(
        {
          message: `Error al procesar la factura con Gemini AI (${response.status})`,
          debug: errorText.substring(0, 500)
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Respuesta de Gemini:', JSON.stringify(data, null, 2))

    // Extraer el texto de la respuesta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json(
        { message: 'No se pudo obtener respuesta de Gemini AI' },
        { status: 500 }
      )
    }

    console.log('Texto extraído de Gemini:', text)

    // Parsear el JSON de la respuesta
    // Gemini a veces devuelve el JSON dentro de bloques de código markdown
    let jsonText = text.trim()

    // Eliminar bloques de código markdown si existen
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }

    let invoiceData: InvoiceData
    try {
      invoiceData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Error parseando JSON de Gemini:', parseError)
      console.error('Texto recibido:', text)
      return NextResponse.json(
        {
          message: 'No se pudo procesar la respuesta de la IA. Intenta con una imagen más clara.',
          debug: text.substring(0, 500)
        },
        { status: 400 }
      )
    }

    // Validar que se hayan extraído datos mínimos
    if (!invoiceData.supplier || !invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json(
        {
          message: 'No se pudieron extraer productos de la factura. Asegúrate de que la imagen sea clara y contenga productos.',
          extractedData: invoiceData
        },
        { status: 400 }
      )
    }

    console.log(`✅ Factura procesada exitosamente: ${invoiceData.items.length} productos extraídos`)

    return NextResponse.json(invoiceData)

  } catch (error: any) {
    console.error('Error procesando factura:', error)

    // Manejar errores específicos
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { message: 'Error de autenticación con el servicio de IA. Contacte al administrador.' },
        { status: 500 }
      )
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return NextResponse.json(
        { message: 'Límite de procesamiento alcanzado. Intenta nuevamente más tarde.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Error al procesar la factura' },
      { status: 500 }
    )
  }
}
