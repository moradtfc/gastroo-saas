import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'

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
  detectedDiscount?: number // Descuento detectado de items con total negativo
}

// API Key de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA4vWfXWpO5-u2tlXlYe2hfR_QhzP0Lmco'

// Inicializar Google GenAI
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

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
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

    if (!supportedTypes.includes(mediaType)) {
      return NextResponse.json(
        { message: 'Formato no soportado. Use JPEG, PNG, GIF, WEBP o PDF.' },
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

    const fileType = mediaType === 'application/pdf' ? 'PDF' : 'imagen'
    console.log(`Procesando factura (${fileType}) con Gemini AI...`)
    console.log(`Tamaño de archivo: ${(bytes.byteLength / 1024).toFixed(2)} KB`)
    console.log(`Tipo MIME: ${mediaType}`)

    // Generar contenido con Gemini usando schema validation y JSON estructurado
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mediaType,
              data: base64Image
            }
          },
          { text: INVOICE_EXTRACTION_PROMPT }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplier: { type: Type.STRING },
            date: { type: Type.STRING },
            currency: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  total: { type: Type.NUMBER }
                },
                required: ['name', 'quantity', 'unit', 'price', 'total']
              }
            },
            subtotal: { type: Type.NUMBER },
            total: { type: Type.NUMBER }
          },
          required: ['supplier', 'date', 'items', 'subtotal', 'total', 'currency']
        }
      }
    })

    const text = response.text

    if (!text) {
      return NextResponse.json(
        { message: 'No se pudo obtener respuesta de Gemini AI' },
        { status: 500 }
      )
    }

    console.log('Respuesta JSON de Gemini:', text)

    // Con responseMimeType: 'application/json', la respuesta ya es JSON válido
    let invoiceData: InvoiceData
    try {
      invoiceData = JSON.parse(text)
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

    // Calcular descuento total de items con valores negativos (promociones/descuentos)
    const originalItemsCount = invoiceData.items.length
    const negativeItems = invoiceData.items.filter(item => item.quantity < 0 || item.total < 0)

    // Sumar todos los descuentos (valores negativos)
    const totalDiscount = negativeItems.reduce((sum, item) => {
      return sum + Math.abs(item.total) // Convertir a valor absoluto para el descuento
    }, 0)

    // Filtrar items negativos de la lista de productos
    invoiceData.items = invoiceData.items.filter(item => item.quantity > 0 && item.total > 0)

    // Agregar descuento detectado si existe
    if (totalDiscount > 0) {
      invoiceData.detectedDiscount = totalDiscount
      console.log(`✓ Descuento detectado: ${invoiceData.currency}${totalDiscount.toFixed(2)} (${negativeItems.length} item(s) con valores negativos)`)
    }

    if (originalItemsCount > invoiceData.items.length) {
      const filteredCount = originalItemsCount - invoiceData.items.length
      console.log(`✓ Filtrados ${filteredCount} item(s) con valores negativos del listado de productos`)
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
