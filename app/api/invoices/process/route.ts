import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

// Inicializar Gemini API
// TEMPORAL: Hardcoded API key (mover a .env después de resolver el problema)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA4vWfXWpO5-u2tlXlYe2hfR_QhzP0Lmco'
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

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
    // Debug: Verificar variables de entorno
    console.log('=== DEBUG VARIABLES DE ENTORNO ===')
    console.log('GEMINI_API_KEY existe:', !!process.env.GEMINI_API_KEY)
    console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0)
    console.log('GEMINI_API_KEY primeros 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10) || 'undefined')
    console.log('===================================')

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
      console.error('Todas las variables de entorno:', Object.keys(process.env).filter(k => k.includes('GEMINI')))
      return NextResponse.json(
        { message: 'Error de configuración del servidor. Contacte al administrador.' },
        { status: 500 }
      )
    }

    // Convertir archivo a buffer y luego a base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    console.log('Procesando factura con Gemini AI...')
    console.log(`Tamaño de imagen: ${(bytes.byteLength / 1024).toFixed(2)} KB`)

    // Configurar el modelo Gemini que soporta visión
    // gemini-pro-vision es el modelo que acepta imágenes
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

    // Generar contenido con la imagen y el prompt
    const result = await model.generateContent([
      INVOICE_EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType: mediaType
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    console.log('Respuesta de Gemini:', text)

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

    // Manejar errores específicos de la API de Gemini
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
