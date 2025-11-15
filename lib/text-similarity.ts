/**
 * Text similarity utilities for ingredient matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  const len1 = s1.length
  const len2 = s2.length

  // Create matrix
  const matrix: number[][] = []

  // Initialize first column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity score (0-1, where 1 is identical)
 */
export function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1.0

  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Normalize text for better matching
 * - Convert to lowercase
 * - Remove accents
 * - Remove extra spaces
 * - Remove special characters
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

/**
 * Check if one string contains another (fuzzy)
 */
export function fuzzyContains(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeText(haystack)
  const normalizedNeedle = normalizeText(needle)

  return normalizedHaystack.includes(normalizedNeedle)
}

/**
 * Advanced similarity with multiple strategies
 */
export function advancedSimilarity(ocrText: string, ingredientName: string): number {
  const norm1 = normalizeText(ocrText)
  const norm2 = normalizeText(ingredientName)

  // Strategy 1: Exact match (normalized)
  if (norm1 === norm2) return 1.0

  // Strategy 2: One contains the other
  if (fuzzyContains(norm1, norm2) || fuzzyContains(norm2, norm1)) {
    const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length)
    return 0.8 + (0.2 * lengthRatio) // 0.8 to 1.0
  }

  // Strategy 3: Word-level matching
  const words1 = norm1.split(' ')
  const words2 = norm2.split(' ')

  let matchingWords = 0
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchingWords++
        break
      }
    }
  }

  const wordScore = matchingWords / Math.max(words1.length, words2.length)

  // Strategy 4: Character-level similarity
  const charScore = similarityScore(norm1, norm2)

  // Combine scores (word matching weighted higher)
  return Math.max(wordScore * 0.6 + charScore * 0.4, charScore)
}

/**
 * Get top N matching ingredients based on OCR text
 */
export interface IngredientMatch {
  ingredient: any
  score: number
  matchReason: string
}

export function findBestMatches(
  ocrText: string,
  ingredients: any[],
  topN: number = 5,
  minScore: number = 0.3
): IngredientMatch[] {
  const matches: IngredientMatch[] = []

  for (const ingredient of ingredients) {
    const score = advancedSimilarity(ocrText, ingredient.name)

    if (score >= minScore) {
      let matchReason = ''
      if (score >= 0.9) {
        matchReason = 'Coincidencia exacta'
      } else if (score >= 0.7) {
        matchReason = 'Muy similar'
      } else if (score >= 0.5) {
        matchReason = 'Similar'
      } else {
        matchReason = 'Posible coincidencia'
      }

      matches.push({
        ingredient,
        score,
        matchReason
      })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Return top N
  return matches.slice(0, topN)
}

/**
 * Extract product name from OCR line
 * Common invoice formats:
 * - "Tomate 2kg 5.50€"
 * - "Aceite de oliva - 12.00"
 * - "Queso manchego (500g) 8.50"
 */
export function extractProductName(ocrLine: string): string {
  // Remove common patterns
  let cleaned = ocrLine
    .replace(/\d+(\.\d+)?\s*(kg|g|l|ml|ud|unid|paq|€|EUR)/gi, '') // Remove quantities and units
    .replace(/\d+[\.,]\d+/g, '') // Remove prices
    .replace(/[\(\)]/g, '') // Remove parentheses
    .trim()

  // Take first part if separated by dash or comma
  const parts = cleaned.split(/[-,]/)
  if (parts.length > 0) {
    cleaned = parts[0].trim()
  }

  return cleaned
}

/**
 * Convierte texto a formato título (Primera Letra Mayúscula)
 * Ejemplo: "ZANAHORIA BOLSA" -> "Zanahoria Bolsa"
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      // Excepciones comunes (artículos, preposiciones)
      const exceptions = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'en', 'con', 'sin', 'para', 'por']
      if (exceptions.includes(word)) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    // Capitalizar la primera palabra siempre
    .replace(/^./, str => str.toUpperCase())
}

/**
 * Algoritmo mejorado de matching que prioriza las primeras 2-3 palabras
 * Útil para casos como "ZANAHORTA BOLSA 1K" vs "Zanahoria"
 */
export function productMatchingScore(invoiceProduct: string, inventoryProduct: string): number {
  const norm1 = normalizeText(invoiceProduct)
  const norm2 = normalizeText(inventoryProduct)

  // Estrategia 1: Coincidencia exacta normalizada
  if (norm1 === norm2) return 1.0

  // Estrategia 2: Uno contiene al otro
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length)
    return 0.85 + (0.15 * lengthRatio)
  }

  // Estrategia 3: Análisis de primeras palabras (MUY IMPORTANTE)
  const words1 = norm1.split(' ').filter(w => w.length > 0)
  const words2 = norm2.split(' ').filter(w => w.length > 0)

  if (words1.length === 0 || words2.length === 0) return 0

  // Tomar las primeras 3 palabras de cada uno
  const firstWords1 = words1.slice(0, 3)
  const firstWords2 = words2.slice(0, 3)

  // Calcular similitud de la primera palabra (peso alto: 50%)
  const firstWordScore = similarityScore(firstWords1[0] || '', firstWords2[0] || '')

  // Si la primera palabra es muy similar (>0.7), ya tenemos un buen match
  if (firstWordScore >= 0.7) {
    // Dar score base alto y mejorar con palabras adicionales
    let score = 0.7 + (firstWordScore - 0.7) * 0.5 // 0.7 a 0.85

    // Revisar segunda palabra si existe (peso medio: 20%)
    if (firstWords1.length > 1 && firstWords2.length > 1) {
      const secondWordScore = similarityScore(firstWords1[1], firstWords2[1])
      score += secondWordScore * 0.1
    }

    // Revisar tercera palabra si existe (peso bajo: 10%)
    if (firstWords1.length > 2 && firstWords2.length > 2) {
      const thirdWordScore = similarityScore(firstWords1[2], firstWords2[2])
      score += thirdWordScore * 0.05
    }

    return Math.min(score, 0.95) // Máximo 0.95 para este método
  }

  // Estrategia 4: Matching de palabras en general
  let matchingWords = 0
  const minWords = Math.min(firstWords1.length, firstWords2.length)

  for (let i = 0; i < minWords; i++) {
    const word1 = firstWords1[i]
    const word2 = firstWords2[i]

    // Similitud exacta
    if (word1 === word2) {
      matchingWords += 1.0
    }
    // Similitud por contención
    else if (word1.includes(word2) || word2.includes(word1)) {
      matchingWords += 0.7
    }
    // Similitud por Levenshtein
    else {
      const sim = similarityScore(word1, word2)
      if (sim >= 0.6) {
        matchingWords += sim * 0.5
      }
    }
  }

  const wordScore = matchingWords / Math.max(firstWords1.length, firstWords2.length, 1)

  // Estrategia 5: Similitud de caracteres como fallback
  const charScore = similarityScore(norm1, norm2)

  // Combinar scores dando más peso al matching de palabras
  return Math.max(wordScore * 0.7 + charScore * 0.3, charScore * 0.6)
}
