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
