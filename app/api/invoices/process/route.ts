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
  total: number
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

  // Extraer el total de la factura (TOTAL ENTREGADO, TOTAL A PAGAR, etc.)
  const total = extractTotal(text)

  // Calcular subtotal de los items
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)

  return {
    supplier,
    date,
    items,
    subtotal,
    total,
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

// Extrae el total de la factura (TOTAL ENTREGADO, TOTAL A PAGAR, etc.)
function extractTotal(text: string): number {
  const lines = text.split('\n')

  // Buscar líneas que contengan "TOTAL ENTREGADO", "TOTAL A PAGAR", "IMPORTE TOTAL", etc.
  const totalKeywords = [
    /TOTAL\s+ENTREGADO[^\d]*(\d+[.,]\d{2})/i,
    /TOTAL\s+A\s+PAGAR[^\d]*(\d+[.,]\d{2})/i,
    /IMPORTE\s+TOTAL[^\d]*(\d+[.,]\d{2})/i,
    /TOTAL[^\d]*(\d+[.,]\d{2})\s*[€$£]\s*$/i
  ]

  for (const line of lines) {
    for (const pattern of totalKeywords) {
      const match = line.match(pattern)
      if (match) {
        const totalStr = match[1].replace(',', '.')
        const total = parseFloat(totalStr)
        if (!isNaN(total)) {
          console.log(`Total extraído: ${total} € de línea: "${line.trim()}"`)
          return total
        }
      }
    }
  }

  // Si no encontramos el total, devolver 0
  return 0
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

  // Rastrear líneas ya procesadas para evitar duplicados en productos multi-línea
  const processedLines = new Set<number>()

  for (let i = 0; i < productLines.length; i++) {
    // Saltar si ya procesamos esta línea como parte de un producto multi-línea
    if (processedLines.has(i)) continue

    const line = productLines[i]

    // Buscar números que parezcan precios (con o sin símbolo de moneda)
    const numbers = extractNumbers(line)

    // REGLA CLAVE: Un producto termina cuando encontramos un PRECIO
    // Detectar si esta línea tiene un precio al final (formato: X,XX € o similar)
    const hasPriceAtEnd = /\d+[.,]\d{2}\s*[€$£]?\s*$/.test(line)

    if (hasPriceAtEnd && numbers.length >= 1) {
      // Esta línea tiene un precio, por lo tanto marca el FIN de un producto

      // Extraer nombre del producto de la línea actual
      let name = extractProductName(line, numbers)
      let quantity = 1
      let unit = extractUnit(line)

      // Determinar precio y total
      let price = 0
      let total = 0

      // MANEJO DE PRODUCTOS MULTI-LÍNEA:
      // Si el precio está aquí pero el nombre es muy corto/vacío,
      // el nombre real está en la línea ANTERIOR
      if (name.length < 5 && i > 0 && !processedLines.has(i - 1)) {
        const previousLine = productLines[i - 1]
        const previousNumbers = extractNumbers(previousLine)
        const previousHasPrice = /\d+[.,]\d{2}\s*[€$£]?\s*$/.test(previousLine)

        // Si la línea anterior NO tiene precio, es parte del nombre de este producto
        if (!previousHasPrice) {
          const previousName = extractProductName(previousLine, previousNumbers)
          if (previousName.length > 3) {
            name = previousName
            processedLines.add(i - 1) // Marcar como procesada
            console.log(`Producto multi-línea detectado: "${name}" con precio en línea ${i + 1}`)
          }
        }
      }

      // Determinar cantidad, precio unitario y precio total
      // Patrón común: "6 Un x 1,15 £/Un C 6,90 €" → cantidad=6, precio=1.15, total=6.90
      const quantityMatch = line.match(/(\d+)\s*Un\s*x\s*(\d+[.,]\d{2})/i)

      if (quantityMatch) {
        // Línea con formato explícito de cantidad
        quantity = parseInt(quantityMatch[1])
        price = parseFloat(quantityMatch[2].replace(',', '.'))
        total = numbers[numbers.length - 1] // El último número es el total
      } else if (numbers.length >= 2) {
        // Si hay múltiples números, el último es el total
        total = numbers[numbers.length - 1]

        // Buscar un número que pueda ser cantidad (pequeño, entero o casi entero, < 100)
        const possibleQty = numbers.find(n => n > 0 && n < 100 && (n === Math.floor(n) || n < 20))

        if (possibleQty && possibleQty !== total) {
          quantity = possibleQty
          price = total / quantity
        } else {
          // No hay cantidad explícita, cantidad = 1
          quantity = 1
          price = total
        }
      } else {
        // Solo hay 1 número: es el precio total, cantidad = 1
        total = numbers[0]
        price = total
        quantity = 1
      }

      if (name && name.length > 2) {
        items.push({
          name: name.trim(),
          quantity: quantity,
          unit,
          price: Number(price.toFixed(2)),
          total: Number(total.toFixed(2))
        })
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
  name = name.replace(/[€$£]/g, ' ')

  // Remover todos los números con decimales (ej: 1,89 o 1.89)
  name = name.replace(/\d+[.,]\d+/g, ' ')

  // Remover números enteros que sean parte de precios/cantidades
  numbers.forEach(num => {
    // Crear patrón que capture el número con sus posibles decimales
    const numInt = Math.floor(num)
    name = name.replace(new RegExp(`\\b${numInt}\\b`, 'g'), ' ')
  })

  // Remover patrones de cantidad (ej: "6 Un x" o "Un x")
  name = name.replace(/\d+\s*Un\s*x\s*\d+[.,]\d+/gi, ' ')
  name = name.replace(/Un\s*x/gi, ' ')

  // Remover unidades comunes
  const units = ['kg', 'g', 'l', 'ml', 'ud', 'unidad', 'unidades', 'pcs', 'pz']
  units.forEach(unit => {
    name = name.replace(new RegExp(`\\b${unit}\\b`, 'gi'), ' ')
  })

  // Remover patrones comunes no deseados
  name = name.replace(/[C\-—]+\s*$/g, '') // Remover guiones y letras sueltas al final
  name = name.replace(/\s+[C\-—]+\s*/g, ' ') // Remover guiones y letras sueltas intermedias
  name = name.replace(/\s*\/\s*/g, ' ') // Remover barras

  // Limpiar espacios múltiples y espacios al inicio/final
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
