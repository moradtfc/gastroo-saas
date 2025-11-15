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
        let year = match[3]

        // Corregir errores comunes del OCR en el año
        if (year.startsWith('20') && parseInt(year) > 2050) {
          // Si es 2075, probablemente es 2025 (error OCR de 7 por 2)
          year = '20' + year.slice(2).replace(/7/g, '2')
        }

        return `${year}-${month}-${day}`
      } else if (match[1].length === 4) {
        // Formato: YYYY/MM/DD
        let year = match[1]

        // Corregir errores comunes del OCR en el año
        if (year.startsWith('20') && parseInt(year) > 2050) {
          year = '20' + year.slice(2).replace(/7/g, '2')
        }

        return `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else {
        // Formato: DD/MM/YYYY
        let year = match[3]

        // Corregir errores comunes del OCR en el año (ej: 2075 → 2025)
        if (year.startsWith('20') && parseInt(year) > 2050) {
          year = '20' + year.slice(2).replace(/7/g, '2')
        }

        return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
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
    /TOTAL\s+ENTREGADO.*?(\d+[.,]\d{2})/i,
    /TOTAL\s+A\s+PAGAR.*?(\d+[.,]\d{2})/i,
    /IMPORTE\s+TOTAL.*?(\d+[.,]\d{2})/i,
    /(?:^|\s)TOTAL\s*[:\.]?\s*(\d+[.,]\d{2})\s*€?\s*$/i,
    /TOTAL.*?(\d+[.,]\d{2})\s*€\s*$/i
  ]

  for (const line of lines) {
    // Ignorar líneas con "SUBTOTAL"
    if (/SUBTOTAL/i.test(line)) continue

    for (const pattern of totalKeywords) {
      const match = line.match(pattern)
      if (match) {
        const totalStr = match[1].replace(',', '.')
        const total = parseFloat(totalStr)
        if (!isNaN(total) && total > 0) {
          console.log(`Total extraído: ${total} € de línea: "${line.trim()}"`)
          return total
        }
      }
    }
  }

  // Buscar cualquier línea con "TOTAL" seguida de un número grande (> 10€)
  for (const line of lines) {
    if (/\bTOTAL\b/i.test(line) && !/SUBTOTAL/i.test(line)) {
      const numbers = line.match(/(\d+[.,]\d{2})/g)
      if (numbers) {
        // Tomar el número más grande de la línea
        const totals = numbers.map(n => parseFloat(n.replace(',', '.')))
        const maxTotal = Math.max(...totals)
        if (maxTotal > 10) {
          console.log(`Total extraído (fallback): ${maxTotal} € de línea: "${line.trim()}"`)
          return maxTotal
        }
      }
    }
  }

  // Si no encontramos el total, devolver 0
  return 0
}

// Extrae los items de la factura con detección mejorada de patrones
function extractItems(lines: string[], currency: string): InvoiceItem[] {
  const items: InvoiceItem[] = []

  // Buscar el índice donde termina la lista de productos
  // Buscamos "TOTAL" pero ignoramos "TOTAL:" o líneas que son claramente subtotales
  const totalIndex = lines.findIndex((line, idx) => {
    const upperLine = line.toUpperCase()
    // Debe contener "TOTAL" y un número, pero no ser "SUBTOTAL" ni tener ":"
    return /\bTOTAL\b/.test(upperLine) &&
           !/\bSUBTOTAL\b/.test(upperLine) &&
           /\d+[.,]\d{2}/.test(line) &&
           !/TOTAL\s*:/.test(upperLine)
  })

  const productLines = totalIndex !== -1 ? lines.slice(0, totalIndex) : lines
  console.log(`Procesando ${productLines.length} líneas de productos (antes de TOTAL en línea ${totalIndex + 1})`)

  const processedLines = new Set<number>()

  for (let i = 0; i < productLines.length; i++) {
    if (processedLines.has(i)) continue

    const line = productLines[i]
    const cleanLine = line.trim()

    // Saltar líneas vacías o muy cortas
    if (cleanLine.length < 3) continue

    // Saltar líneas que son claramente headers o separadores
    if (/^[\-=_\s]+$/.test(cleanLine) || /^(DESCRIPCION|PRODUCTO|CANTIDAD|PRECIO|TOTAL)/i.test(cleanLine)) {
      continue
    }

    // Extraer todos los números de la línea
    const numbers = extractNumbers(line)

    // PATRÓN 1: Productos con peso/cantidad y precio unitario
    // Ejemplo: "0,615 kg x 2,69 €/kg G 1,66€"
    const weightPriceMatch = line.match(/(\d+[.,]\d+)\s*(kg|g|l|ml|un)\s*x\s*(\d+[.,]\d+)\s*€?\s*[\/]?\s*(?:kg|g|l|ml|un)?.*?(\d+[.,]\d{2})\s*€?\s*$/i)

    if (weightPriceMatch) {
      const quantity = parseFloat(weightPriceMatch[1].replace(',', '.'))
      const unit = weightPriceMatch[2].toLowerCase()
      const unitPrice = parseFloat(weightPriceMatch[3].replace(',', '.'))
      const total = parseFloat(weightPriceMatch[4].replace(',', '.'))

      // Nombre del producto: todo lo que está antes del patrón de peso
      let name = line.substring(0, line.indexOf(weightPriceMatch[1]))

      // Si el nombre está en la línea anterior (producto multi-línea)
      if (name.trim().length < 3 && i > 0 && !processedLines.has(i - 1)) {
        name = productLines[i - 1]
        processedLines.add(i - 1)
      }

      name = cleanProductName(name)

      if (name.length > 2) {
        items.push({
          name,
          quantity,
          unit,
          price: unitPrice,
          total
        })
        processedLines.add(i)
        continue
      }
    }

    // PATRÓN 2: Productos con cantidad explícita (unidades)
    // Ejemplo: "4 Un x 1,75 €/n A 7,00€"
    const quantityPriceMatch = line.match(/(\d+)\s*Un\s*x\s*(\d+[.,]\d+).*?(\d+[.,]\d{2})\s*€?\s*$/i)

    if (quantityPriceMatch) {
      const quantity = parseInt(quantityPriceMatch[1])
      const unitPrice = parseFloat(quantityPriceMatch[2].replace(',', '.'))
      const total = parseFloat(quantityPriceMatch[3].replace(',', '.'))

      let name = line.substring(0, line.indexOf(quantityPriceMatch[0]))

      if (name.trim().length < 3 && i > 0 && !processedLines.has(i - 1)) {
        name = productLines[i - 1]
        processedLines.add(i - 1)
      }

      name = cleanProductName(name)

      if (name.length > 2) {
        items.push({
          name,
          quantity,
          unit: 'unidad',
          price: unitPrice,
          total
        })
        processedLines.add(i)
        continue
      }
    }

    // PATRÓN 3: Productos simples con precio al final
    // Ejemplo: "ATÚN CLARO ALIPENDE P6 NATI A 4,20€" o "PA,ATA BLANCA BOLSA 1K GUAR C—1,09€"
    const simplePriceMatch = line.match(/(\d+[.,]\d{2})\s*€?\s*$/i)

    if (simplePriceMatch && numbers.length >= 1) {
      const total = numbers[numbers.length - 1]

      // Evitar líneas que son claramente totales, descuentos, o impuestos
      const upperLine = line.toUpperCase()
      if (/TOTAL|SUBTOTAL|IVA|IMPUESTO|DESCUENTO|PROMOCION|CAMBIO|ENTREGADO/.test(upperLine)) {
        continue
      }

      let name = cleanProductName(line.substring(0, line.indexOf(simplePriceMatch[0])))

      // Si el nombre es muy corto, buscar en la línea anterior
      if (name.length < 5 && i > 0 && !processedLines.has(i - 1)) {
        const prevLine = productLines[i - 1]
        const prevHasPrice = /\d+[.,]\d{2}\s*€?\s*$/.test(prevLine)

        if (!prevHasPrice) {
          const prevName = cleanProductName(prevLine)
          if (prevName.length > 3) {
            name = prevName
            processedLines.add(i - 1)
          }
        }
      }

      if (name.length > 2) {
        items.push({
          name,
          quantity: 1,
          unit: extractUnit(line),
          price: total,
          total
        })
        processedLines.add(i)
        continue
      }
    }
  }

  console.log(`Extraídos ${items.length} productos`)

  // Si no se encontraron items, intentar parsing de fallback
  if (items.length === 0) {
    return fallbackItemExtraction(productLines, currency)
  }

  return items
}

// Función mejorada para limpiar el nombre del producto
function cleanProductName(rawName: string): string {
  let name = rawName

  // Remover símbolos de moneda
  name = name.replace(/[€$£]/g, ' ')

  // Remover números con decimales (precios)
  name = name.replace(/\d+[.,]\d+/g, ' ')

  // Remover patrones de cantidad y peso
  name = name.replace(/\d+\s*(kg|g|l|ml|un|unidad|unidades)/gi, ' ')
  name = name.replace(/x\s*\d+/gi, ' ')

  // Remover códigos y letras sueltas al final (A, B, C, E, etc.)
  name = name.replace(/\s+[A-Z](\s+|$)/g, ' ')

  // Remover guiones, barras y caracteres especiales al final o intermedios
  name = name.replace(/[\-—_|]+/g, ' ')
  name = name.replace(/\s*[C]\s*$/g, '') // Letra C suelta al final

  // Remover puntos finales extraños
  name = name.replace(/\.+\s*$/g, '')

  // Remover espacios múltiples
  name = name.replace(/\s+/g, ' ').trim()

  return name
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
        // Extraer el precio (último número) y limpiar el nombre
        const priceMatch = line.match(/(\d+[.,]\d{2})\s*€?\s*$/i)
        if (!priceMatch) continue

        const name = cleanProductName(line.substring(0, line.indexOf(priceMatch[0])))

        // Filtrar nombres que sean demasiado cortos o contengan palabras clave no deseadas
        const invalidKeywords = ['subtotal', 'impuesto', 'iva', 'tax', 'descuento', 'entregado', 'cambio', 'total', 'promocion']
        const hasInvalidKeyword = invalidKeywords.some(keyword =>
          name.toLowerCase().includes(keyword)
        )

        if (name.length > 2 && !hasInvalidKeyword) {
          // El último número suele ser el precio total del producto
          const price = numbers[numbers.length - 1]

          items.push({
            name: name.trim(),
            quantity: 1,
            unit: extractUnit(line),
            price: price,
            total: price
          })
        }
      }
    }
  }

  console.log(`Fallback extrajo ${items.length} productos`)

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

    // Procesar imagen con Tesseract.js con configuración optimizada para facturas
    const { data } = await Tesseract.recognize(
      buffer,
      'spa+eng', // Idioma español e inglés para mejor detección de marcas/códigos
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`)
          }
        },
        // Configuración optimizada para documentos estructurados como facturas
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Detección automática del layout
        preserve_interword_spaces: '1', // Preservar espacios entre palabras
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
