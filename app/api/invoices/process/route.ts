import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

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
  currency: string
}

// Parser inteligente para extraer datos de facturas
function parseInvoiceText(text: string): InvoiceData {
  const lines = text.split('\n').filter(line => line.trim().length > 0)

  // Extraer proveedor (usualmente en las primeras líneas)
  const supplier = extractSupplier(lines)

  // Extraer fecha
  const date = extractDate(text)

  // Extraer moneda
  const currency = extractCurrency(text)

  // Extraer items (productos con cantidades y precios)
  const items = extractItems(lines, currency)

  // Calcular subtotal
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)

  return {
    supplier,
    date,
    items,
    subtotal,
    currency
  }
}

// Extrae el nombre del proveedor de las primeras líneas
function extractSupplier(lines: string[]): string {
  // El proveedor suele estar en las primeras 3-5 líneas
  // Buscamos la línea más larga o la que contenga palabras clave
  const topLines = lines.slice(0, 5)

  // Buscar líneas con palabras clave de empresa
  const companyKeywords = ['s.l.', 's.a.', 'ltd', 'inc', 'gmbh', 'sl', 'sa', 'ltda']
  for (const line of topLines) {
    const lowerLine = line.toLowerCase()
    if (companyKeywords.some(keyword => lowerLine.includes(keyword))) {
      return line.trim()
    }
  }

  // Si no encuentra, buscar la primera línea que no sea número o fecha
  for (const line of topLines) {
    const cleaned = line.trim()
    if (cleaned.length > 3 && !/^[\d\/\-\.\s]+$/.test(cleaned)) {
      return cleaned
    }
  }

  return topLines[0]?.trim() || 'Proveedor desconocido'
}

// Extrae la fecha en varios formatos
function extractDate(text: string): string {
  // Patrones de fecha comunes
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // DD/MM/YYYY o DD-MM-YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,  // YYYY/MM/DD
    /(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})/i  // DD de mes de YYYY
  ]

  const monthMap: { [key: string]: string } = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
  }

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (pattern.toString().includes('de')) {
        // Formato: DD de mes de YYYY
        const day = match[1].padStart(2, '0')
        const month = monthMap[match[2].toLowerCase()] || '01'
        const year = match[3]
        return `${year}-${month}-${day}`
      } else if (match[1].length === 4) {
        // Formato: YYYY/MM/DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else {
        // Formato: DD/MM/YYYY
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
      }
    }
  }

  // Si no encuentra fecha, usar fecha actual
  return new Date().toISOString().split('T')[0]
}

// Extrae el símbolo de moneda
function extractCurrency(text: string): string {
  if (text.includes('€') || text.toLowerCase().includes('eur')) return '€'
  if (text.includes('$') || text.toLowerCase().includes('usd')) return '$'
  if (text.includes('£') || text.toLowerCase().includes('gbp')) return '£'
  return '€' // Por defecto
}

// Extrae los items de la factura
function extractItems(lines: string[], currency: string): InvoiceItem[] {
  const items: InvoiceItem[] = []

  // REGLA CLAVE: Solo procesar líneas ANTES de "TOTAL"
  // Encontrar el índice de la primera línea que contiene "TOTAL" en mayúscula
  const totalIndex = lines.findIndex(line => {
    const upperLine = line.toUpperCase()
    return /\bTOTAL\b/.test(upperLine)
  })

  // Si encontramos "TOTAL", solo procesar líneas antes de ese índice
  // Si no encontramos "TOTAL", procesar todas las líneas
  const productLines = totalIndex !== -1 ? lines.slice(0, totalIndex) : lines

  console.log(`Procesando ${productLines.length} líneas de productos (antes de TOTAL en línea ${totalIndex})`)

  // Patrones para identificar líneas de producto
  // Buscar líneas que contengan cantidad y precio
  const pricePattern = new RegExp(`[${currency}€$£]?\\s*([\\d]+[.,]?[\\d]*)\\s*${currency}?`, 'g')

  for (let i = 0; i < productLines.length; i++) {
    const line = productLines[i]

    // Buscar números que parezcan precios (con o sin símbolo de moneda)
    const numbers = extractNumbers(line)

    // Una línea de producto típicamente tiene:
    // - Nombre del producto (texto)
    // - Cantidad (número pequeño, usualmente < 1000)
    // - Precio unitario (número con decimales)
    // - Total (número con decimales)

    if (numbers.length >= 2) {
      // Intentar identificar cantidad y precios
      const possibleQuantity = numbers.find(n => n > 0 && n < 1000)
      const possiblePrices = numbers.filter(n => n >= 0)

      if (possibleQuantity !== undefined && possiblePrices.length >= 1) {
        // Extraer nombre del producto (texto antes de los números)
        let name = extractProductName(line, numbers)

        // MANEJO DE PRODUCTOS MULTI-LÍNEA:
        // Si el nombre es muy corto (< 5 caracteres), puede ser que el nombre
        // esté en la línea anterior (ej: "ZANAHORTA BOLSA 1K" + "6 Un x 1,15 £/Un C 6,90 €")
        if (name.length < 5 && i > 0) {
          const previousLine = productLines[i - 1]
          const previousNumbers = extractNumbers(previousLine)

          // Si la línea anterior tiene texto pero no tiene precios (o muy pocos números)
          if (previousNumbers.length <= 1) {
            const previousName = extractProductName(previousLine, previousNumbers)
            if (previousName.length > 3) {
              // Combinar el nombre de la línea anterior con el actual
              name = previousName
              console.log(`Producto multi-línea detectado: "${name}" con datos en línea siguiente`)
            }
          }
        }

        if (name && name.length > 2) {
          // Determinar precio y total
          let price = 0
          let total = 0

          if (possiblePrices.length >= 2) {
            // Si hay 2 precios, uno es unitario y otro total
            price = Math.min(...possiblePrices)
            total = Math.max(...possiblePrices)
          } else {
            // Si solo hay 1 precio, asumimos que es el total
            total = possiblePrices[0]
            price = total / possibleQuantity
          }

          // Extraer unidad
          const unit = extractUnit(line)

          items.push({
            name: name.trim(),
            quantity: possibleQuantity,
            unit,
            price: Number(price.toFixed(2)),
            total: Number(total.toFixed(2))
          })
        }
      }
    }
  }

  // Si no se encontraron items, intentar un parsing más agresivo
  if (items.length === 0) {
    return fallbackItemExtraction(productLines, currency)
  }

  return items
}

// Extrae todos los números de una línea
function extractNumbers(line: string): number[] {
  const numbers: number[] = []

  // Limpiar símbolos de moneda
  const cleaned = line.replace(/[€$£]/g, ' ')

  // Buscar patrones de números (incluyendo decimales con . o ,)
  const matches = cleaned.matchAll(/(\d+)[.,]?(\d*)/g)

  for (const match of matches) {
    const whole = match[1]
    const decimal = match[2] || '0'
    const number = parseFloat(`${whole}.${decimal}`)
    if (!isNaN(number)) {
      numbers.push(number)
    }
  }

  return numbers
}

// Extrae el nombre del producto de una línea
function extractProductName(line: string, numbers: number[]): string {
  let name = line

  // Remover símbolos de moneda
  name = name.replace(/[€$£]/g, '')

  // Remover los números encontrados
  numbers.forEach(num => {
    const numStr = num.toString().replace('.', '[.,]')
    name = name.replace(new RegExp(numStr, 'g'), '')
  })

  // Remover unidades comunes
  const units = ['kg', 'g', 'l', 'ml', 'ud', 'unidad', 'unidades', 'pcs', 'pz', 'un', 'x']
  units.forEach(unit => {
    name = name.replace(new RegExp(`\\b${unit}\\b`, 'gi'), '')
  })

  // Remover patrones comunes no deseados
  name = name.replace(/[C\-—]+\s*$/g, '') // Remover guiones y letras sueltas al final
  name = name.replace(/\b(un|x)\b/gi, '') // Remover "un" y "x" sueltos

  // Limpiar espacios y caracteres especiales
  name = name.replace(/\s+/g, ' ').trim()

  return name
}

// Extrae la unidad de medida
function extractUnit(line: string): string {
  const lowerLine = line.toLowerCase()

  // Unidades comunes en orden de prioridad
  const units = [
    { pattern: /\bkg\b/i, unit: 'kg' },
    { pattern: /\bg\b/i, unit: 'g' },
    { pattern: /\blitros?\b/i, unit: 'L' },
    { pattern: /\bl\b/i, unit: 'L' },
    { pattern: /\bml\b/i, unit: 'ml' },
    { pattern: /\bunidades?\b/i, unit: 'unidad' },
    { pattern: /\bud\b/i, unit: 'unidad' },
    { pattern: /\bpcs\b/i, unit: 'unidad' },
    { pattern: /\bpz\b/i, unit: 'unidad' }
  ]

  for (const { pattern, unit } of units) {
    if (pattern.test(lowerLine)) {
      return unit
    }
  }

  return 'unidad'
}

// Parsing de fallback si el método principal no encuentra items
function fallbackItemExtraction(lines: string[], currency: string): InvoiceItem[] {
  const items: InvoiceItem[] = []

  console.log('Ejecutando extracción fallback con líneas filtradas')

  // Buscar líneas que contengan al menos un precio (formato con decimales)
  for (const line of lines) {
    if (/\d+[.,]\d{2}/.test(line)) {
      const numbers = extractNumbers(line)

      if (numbers.length > 0) {
        const name = extractProductName(line, numbers)

        // Filtrar nombres que sean demasiado cortos o contengan palabras clave no deseadas
        const invalidKeywords = ['subtotal', 'impuesto', 'iva', 'tax', 'descuento', 'entregado', 'cambio']
        const hasInvalidKeyword = invalidKeywords.some(keyword =>
          name.toLowerCase().includes(keyword)
        )

        if (name.length > 2 && !hasInvalidKeyword) {
          // El último número suele ser el precio total del producto
          const price = numbers[numbers.length - 1]

          items.push({
            name: name.trim(),
            quantity: 1,
            unit: 'unidad',
            price: price,
            total: price
          })
        }
      }
    }
  }

  return items
}

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

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('Procesando factura con OCR...')

    // Procesar imagen con Tesseract.js
    const { data } = await Tesseract.recognize(
      buffer,
      'spa', // Idioma español
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`)
          }
        }
      }
    )

    console.log('Texto extraído:', data.text)

    // Parsear el texto extraído
    const invoiceData = parseInvoiceText(data.text)

    console.log('Datos parseados:', invoiceData)

    // Validar que se hayan extraído datos mínimos
    if (!invoiceData.supplier || invoiceData.items.length === 0) {
      return NextResponse.json(
        {
          message: 'No se pudieron extraer datos suficientes de la factura. Asegúrate de que la imagen sea clara y esté bien iluminada.',
          extractedText: data.text.substring(0, 500) // Primeros 500 caracteres para debug
        },
        { status: 400 }
      )
    }

    return NextResponse.json(invoiceData)

  } catch (error: any) {
    console.error('Error procesando factura:', error)
    return NextResponse.json(
      { message: error.message || 'Error al procesar la factura' },
      { status: 500 }
    )
  }
}
