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

// Limpia espacios y caracteres "|" al inicio de cada línea
// Esto mejora significativamente la precisión del parsing
function cleanLinePrefix(line: string): string {
  // Eliminar espacios y "|" del inicio de la línea hasta encontrar el primer carácter válido
  let cleaned = line
  let index = 0

  while (index < cleaned.length) {
    const char = cleaned[index]
    if (char !== ' ' && char !== '|') {
      break
    }
    index++
  }

  return cleaned.substring(index)
}

// Normaliza el texto del OCR para corregir errores comunes
function normalizeOCRText(text: string): string {
  let normalized = text

  // Corregir símbolos de moneda confundidos por el OCR
  normalized = normalized.replace(/[¢¤©]/g, '€')  // ¢ © ¤ → €
  normalized = normalized.replace(/(\d+[.,]\d+)\s*e\s/gi, '$1 € ')  // "0,15e " → "0,15 € "
  normalized = normalized.replace(/(\d+[.,]\d+)e([^a-z]|$)/gi, '$1€$2')  // "0,15e" → "0,15€"

  // Corregir ceros confundidos con letras O
  normalized = normalized.replace(/([0-9])O([0-9])/g, '$10$2')

  // Corregir precios mal escaneados: "283€" probablemente es "2.83€"
  // Si un precio tiene 3+ dígitos enteros sin decimales, insertar punto decimal
  normalized = normalized.replace(/(\s|^)(\d{3,})€/g, (match, space, num) => {
    // Si es un número grande como 283, convertir a 2.83
    if (num.length === 3 && parseInt(num) > 100) {
      return `${space}${num.slice(0, -2)}.${num.slice(-2)}€`
    }
    return match
  })

  return normalized
}

// Parser inteligente para extraer datos de facturas
function parseInvoiceText(text: string): InvoiceData {
  // Normalizar texto primero
  const normalizedText = normalizeOCRText(text)

  console.log('=== LIMPIEZA DE LÍNEAS ===')

  // Limpiar cada línea: eliminar espacios y "|" del inicio antes de procesarlas
  // Esto mejora significativamente la detección de productos
  const rawLines = normalizedText.split('\n')
  const lines = rawLines
    .map((line, index) => {
      const cleaned = cleanLinePrefix(line)
      if (line !== cleaned && line.trim().length > 0) {
        console.log(`Línea ${index + 1} LIMPIADA:`)
        console.log(`  Antes:   "${line}"`)
        console.log(`  Después: "${cleaned}"`)
      }
      return cleaned
    })
    .filter(line => line.trim().length > 0)

  console.log(`Total de líneas procesadas: ${rawLines.length}`)
  console.log(`Líneas válidas después de limpieza: ${lines.length}`)
  console.log('\n=== TEXTO LIMPIO COMPLETO ===')
  console.log(lines.join('\n'))
  console.log('=== FIN LIMPIEZA ===\n')

  // Extraer proveedor (usualmente en las primeras líneas)
  const supplier = extractSupplier(lines)

  // Extraer fecha
  const date = extractDate(normalizedText)

  // Extraer moneda
  const currency = extractCurrency(normalizedText)

  // Extraer items (productos con cantidades y precios)
  const items = extractItems(lines, currency)

  // Extraer el total de la factura (TOTAL ENTREGADO, TOTAL A PAGAR, etc.)
  const total = extractTotal(normalizedText)

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
  // Buscar líneas que contengan TOTAL (no SUBTOTAL) seguido de números grandes
  let totalIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const upperLine = line.toUpperCase()

    // Ignorar SUBTOTAL
    if (/SUBTOTAL/i.test(upperLine)) continue

    // Buscar TOTAL seguido de números (puede tener basura en medio)
    // Ejemplos: "TOTAL 12: Tn a > 34€", "TOTAL: 25.50€", "TOTAL 71,84 €"
    if (/\bTOTAL\b/i.test(upperLine)) {
      // Extraer todos los números de esa línea
      const numbers = line.match(/\d+[.,]\d+/g)
      if (numbers && numbers.length > 0) {
        // Si hay números grandes (>= 10€), probablemente es el total final
        const maxNum = Math.max(...numbers.map(n => parseFloat(n.replace(',', '.'))))
        if (maxNum >= 10) {
          totalIndex = i
          console.log(`TOTAL detectado en línea ${i + 1}: "${line.trim()}"`)
          break
        }
      }
    }
  }

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
    // Ejemplo: "0,615 kg x 2,69 €/kg G 1,68 € | Eo"
    // Más flexible para tolerar ruido del OCR
    const weightPriceMatch = line.match(/(\d+[.,]\d+)\s*(kg|g|l|ml|un)\s*x\s*(\d+[.,]\d+)\s*[€¢¤©]?\s*[\/]?\s*(?:kg|g|l|ml|un)?/i)

    if (weightPriceMatch) {
      const quantity = parseFloat(weightPriceMatch[1].replace(',', '.'))
      const unit = weightPriceMatch[2].toLowerCase()
      const unitPrice = parseFloat(weightPriceMatch[3].replace(',', '.'))

      // Buscar el precio total en la misma línea
      const restOfLine = line.substring(line.indexOf(weightPriceMatch[0]) + weightPriceMatch[0].length)
      const totalMatch = restOfLine.match(/(\d+[.,]\d+)\s*[€¢¤©]/i)

      let total = 0
      if (totalMatch) {
        total = parseFloat(totalMatch[1].replace(',', '.'))
      } else {
        // Si no hay total explícito, calcularlo
        total = quantity * unitPrice
      }

      // Nombre del producto: todo lo que está antes del patrón de peso
      let name = line.substring(0, line.indexOf(weightPriceMatch[1]))

      // Si el nombre está en la línea anterior (producto multi-línea)
      if (name.trim().length < 3 && i > 0 && !processedLines.has(i - 1)) {
        name = productLines[i - 1]
        processedLines.add(i - 1)
      }

      name = cleanProductName(name)

      if (name.length > 2 && total > 0) {
        items.push({
          name,
          quantity,
          unit,
          price: unitPrice,
          total: parseFloat(total.toFixed(2))
        })
        processedLines.add(i)
        continue
      }
    }

    // PATRÓN 2: Productos con cantidad explícita (unidades)
    // Ejemplo: "4 Un x 1,75 €/n A 7,00€"
    // Más flexible para tolerar ruido
    const quantityPriceMatch = line.match(/(\d+)\s*Un\s*x\s*(\d+[.,]\d+).*?(\d+[.,]\d+)\s*[€¢¤]/i)

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
    // Ejemplo: "ATÚN CLARO ALIPENDE P6 NATI A 4.20 €" o "CHORIZO SARTA PICANTE ALIPE A 2.83€"
    // Más flexible: acepta € ¢ ¤ ©, tolera espacios y caracteres extra
    const simplePriceMatch = line.match(/(\d+[.,]\d+)\s*[€¢¤©]/i)

    if (simplePriceMatch && numbers.length >= 1) {
      const total = parseFloat(simplePriceMatch[1].replace(',', '.'))

      // Evitar líneas que son claramente totales, descuentos, o impuestos
      const upperLine = line.toUpperCase()
      if (/TOTAL|SUBTOTAL|IVA|IMPUESTO|DESCUENTO|PROMOCION|CAMBIO|ENTREGADO|EFECTIVA|-\d+[.,]\d+/i.test(upperLine)) {
        continue
      }

      let name = cleanProductName(line.substring(0, line.indexOf(simplePriceMatch[0])))

      // Si el nombre es muy corto, buscar en la línea anterior
      if (name.length < 5 && i > 0 && !processedLines.has(i - 1)) {
        const prevLine = productLines[i - 1]
        const prevHasPrice = /\d+[.,]\d+\s*[€¢¤©]/i.test(prevLine)

        if (!prevHasPrice) {
          const prevName = cleanProductName(prevLine)
          if (prevName.length > 3) {
            name = prevName
            processedLines.add(i - 1)
          }
        }
      }

      if (name.length > 2 && total > 0.01) {  // Ignorar precios muy pequeños (ruido)
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

  // Remover símbolos de moneda (incluyendo caracteres confundidos por OCR)
  name = name.replace(/[€$£¢¤©]/g, ' ')

  // Remover números con decimales (precios)
  name = name.replace(/\d+[.,]\d+/g, ' ')

  // Remover patrones de cantidad y peso
  name = name.replace(/\d+\s*(kg|g|l|ml|un|unidad|unidades)/gi, ' ')
  name = name.replace(/x\s*\d+/gi, ' ')

  // Remover códigos y letras sueltas comunes del OCR (2 caracteres o menos)
  name = name.replace(/\s+[A-Z]{1,2}(\s+|$)/gi, ' ')  // A, B, C, EA, EU, etc.

  // Remover palabras cortas sin sentido (ruido del OCR) - más agresivo
  name = name.replace(/\b(Ea|Eo|Hi|EU|NA|Po|Noid|WE|Cr|oe|Fr|ko|cre|Rory|Guar)\b/gi, ' ')

  // Remover guiones, barras y caracteres especiales
  name = name.replace(/[\-—_|]+/g, ' ')
  name = name.replace(/[\.]+\s*$/g, '')  // Puntos al final

  // Remover símbolos y números al final (patrones como "1" "20%" al final)
  name = name.replace(/\s+\d+\s*%?\s*$/g, '')
  name = name.replace(/\s+\d+\s*$/g, '')

  // Limpiar comas extrañas (ej: "PA,ATA" → "PA ATA")
  name = name.replace(/,/g, ' ')

  // Remover puntos sueltos
  name = name.replace(/\s+\.\s+/g, ' ')

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

  // Buscar líneas que contengan al menos un precio (formato con decimales y símbolo de moneda)
  for (const line of lines) {
    // Más flexible: acepta €, ¢, ¤, ©
    const priceMatch = line.match(/(\d+[.,]\d+)\s*[€¢¤©]/i)

    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'))

      // Filtrar líneas no deseadas
      const upperLine = line.toUpperCase()
      const invalidKeywords = ['SUBTOTAL', 'IMPUESTO', 'IVA', 'TAX', 'DESCUENTO', 'ENTREGADO', 'CAMBIO', 'TOTAL', 'PROMOCION', 'EFECTIVA']
      const hasInvalidKeyword = invalidKeywords.some(keyword => upperLine.includes(keyword))

      // También filtrar líneas con números negativos (descuentos)
      if (hasInvalidKeyword || /-\d+[.,]\d+/.test(line)) continue

      const name = cleanProductName(line.substring(0, line.indexOf(priceMatch[0])))

      if (name.length > 2 && price > 0.01) {
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
