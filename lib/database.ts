import { supabase } from './supabase'

// Types for our database tables
export interface Supplier {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  website?: string
  contact_person?: string
  category?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  name: string
  symbol: string
  category_id: string
  base_unit: boolean
  conversion_factor: number
  description?: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface FoodCategory {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
  updated_at: string
}

export interface Allergen {
  id: string
  name: string
  description?: string
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  name: string
  category?: string // Legacy field - will be deprecated
  unit: string // Legacy field - will be deprecated
  unit_id?: string
  default_unit_id?: string
  food_category_id?: string // Added
  sku?: string // Added
  image_url?: string // Optional image URL (limited to 1 per article)
  image_updated_at?: string // Timestamp of last image update
  cost_per_unit?: number
  current_stock?: number
  min_stock?: number
  allergens?: string[] // Legacy field - will be deprecated
  supplier_id?: string
  created_at: string
  updated_at: string
  unit_info?: Unit
  default_unit_info?: Unit
  food_category?: FoodCategory // Joined food category info
  article_allergens?: Array<{allergen: Allergen}> // Joined allergens
}

// Legacy alias for backwards compatibility
export type Ingredient = Article

export interface Recipe {
  id: string
  name: string
  description?: string
  category?: string
  servings?: number
  cooking_time?: number
  difficulty?: string
  sale_price?: number
  instructions?: string
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  name: string
  description?: string
  category?: string
  status?: string
  created_at: string
  updated_at: string
}

// Database operations
export class DatabaseService {
  static supabase = supabase
  
  // Categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as Category[]
  }

  // Units
  static async getUnits() {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        category:categories(*)
      `)
      .order('category_id, name')
    
    if (error) throw error
    return data as Unit[]
  }

  static async getUnitsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('category_id', categoryId)
      .order('name')
    
    if (error) throw error
    return data as Unit[]
  }

  // Food Categories methods
  static async getFoodCategories() {
    const { data, error } = await supabase
      .from('food_categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as FoodCategory[]
  }

  static async createFoodCategory(category: Omit<FoodCategory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('food_categories')
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data as FoodCategory
  }

  // Allergens methods
  static async getAllergens() {
    const { data, error } = await supabase
      .from('allergens')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as Allergen[]
  }

  static async createAllergen(allergen: Omit<Allergen, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('allergens')
      .insert(allergen)
      .select()
      .single()
    
    if (error) throw error
    return data as Allergen
  }

  // Article-Allergen relationship methods
  static async addAllergenToArticle(articleId: string, allergenId: string) {
    const { data, error } = await supabase
      .from('article_allergens')
      .insert({
        article_id: articleId,
        allergen_id: allergenId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateArticleAllergens(articleId: string, allergenIds: string[]) {
    const { error } = await supabase
      .from('article_allergens')
      .delete()
      .eq('article_id', articleId)

    if (error) throw error

    if (allergenIds.length === 0) return

    const { error: insertError } = await supabase
      .from('article_allergens')
      .insert(allergenIds.map((allergenId) => ({ article_id: articleId, allergen_id: allergenId })))

    if (insertError) throw insertError
  }

  static async removeAllergenFromArticle(articleId: string, allergenId: string) {
    const { error } = await supabase
      .from('article_allergens')
      .delete()
      .eq('article_id', articleId)
      .eq('allergen_id', allergenId)
    
    if (error) throw error
  }

  static async getArticleAllergens(articleId: string) {
    const { data, error } = await supabase
      .from('article_allergens')
      .select(`
        *,
        allergen:allergens(*)
      `)
      .eq('article_id', articleId)
    
    if (error) throw error
    return data
  }

  // Legacy aliases for backwards compatibility
  static addAllergenToIngredient = this.addAllergenToArticle
  static updateIngredientAllergens = this.updateArticleAllergens
  static removeAllergenFromIngredient = this.removeAllergenFromArticle
  static getIngredientAllergens = this.getArticleAllergens

  static async canConvertUnits(fromUnitId: string, toUnitId: string): Promise<{canConvert: boolean, error?: string}> {
    try {
      const { data: units, error } = await supabase
        .from('units')
        .select(`
          id,
          name,
          symbol,
          category_id,
          category:categories(name)
        `)
        .in('id', [fromUnitId, toUnitId])
      
      if (error) throw error
      
      if (!units || units.length !== 2) {
        return { canConvert: false, error: 'Una o ambas unidades no existen' }
      }
      
      const fromUnit = units.find(u => u.id === fromUnitId)
      const toUnit = units.find(u => u.id === toUnitId)
      
      if (!fromUnit || !toUnit) {
        return { canConvert: false, error: 'Una o ambas unidades no existen' }
      }
      
      // Check if units are from the same category
      if (fromUnit.category_id !== toUnit.category_id) {
        const fromCategoryName = (fromUnit.category as any)?.name || 'desconocida'
        const toCategoryName = (toUnit.category as any)?.name || 'desconocida'
        
        return { 
          canConvert: false, 
          error: `No se puede convertir ${fromUnit.name} (${fromCategoryName.toLowerCase()}) a ${toUnit.name} (${toCategoryName.toLowerCase()})` 
        }
      }
      
      return { canConvert: true }
    } catch (error) {
      console.error('Error checking unit conversion:', error)
      return { canConvert: false, error: 'Error al verificar la conversión' }
    }
  }

  static async convertUnits(value: number, fromUnitId: string, toUnitId: string): Promise<{success: boolean, convertedValue?: number, error?: string}> {
    try {
      const conversionCheck = await this.canConvertUnits(fromUnitId, toUnitId)
      
      if (!conversionCheck.canConvert) {
        return { success: false, error: conversionCheck.error }
      }
      
      // Get conversion factors
      const { data: units, error } = await supabase
        .from('units')
        .select('id, name, conversion_factor')
        .in('id', [fromUnitId, toUnitId])
      
      if (error) throw error
      
      const fromUnit = units?.find(u => u.id === fromUnitId)
      const toUnit = units?.find(u => u.id === toUnitId)
      
      if (!fromUnit || !toUnit) {
        return { success: false, error: 'Error al obtener factores de conversión' }
      }
      
      // Convert: value * fromFactor / toFactor
      const convertedValue = (value * fromUnit.conversion_factor) / toUnit.conversion_factor
      
      return { success: true, convertedValue }
    } catch (error) {
      console.error('Error converting units:', error)
      return { success: false, error: 'Error en la conversión' }
    }
  }

  // Suppliers
  static async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    // If no suppliers exist, create some default ones
    if (!data || data.length === 0) {
      console.log('No suppliers found, creating default suppliers...')
      await this.createDefaultSuppliers()
      // Retry getting suppliers
      const { data: newData, error: newError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')
      
      if (newError) throw newError
      return newData as Supplier[]
    }
    
    return data as Supplier[]
  }

  static async createDefaultSuppliers() {
    const defaultSuppliers = [
      {
        name: "Mercado Central",
        address: "Calle Mayor 123, Madrid",
        phone: "+34 91 123 4567",
        email: "contacto@mercadocentral.es",
        contact_person: "Juan García",
        category: "Mayorista",
        notes: "Proveedor principal de frutas y verduras"
      },
      {
        name: "Oleícola San José",
        address: "Av. Andalucía 45, Sevilla",
        phone: "+34 95 456 7890",
        email: "ventas@oleicola-sj.com",
        contact_person: "María López",
        category: "Aceites y Vinagres",
        notes: "Especialista en aceites de oliva premium"
      },
      {
        name: "Quesería La Mancha",
        address: "Plaza del Queso 8, Toledo",
        phone: "+34 92 789 0123",
        email: "info@queseria-lamancha.es",
        contact_person: "Carlos Ruiz",
        category: "Lácteos",
        notes: "Quesos artesanales de La Mancha"
      },
      {
        name: "Pescadería Marina",
        address: "Puerto Pesquero s/n, Valencia",
        phone: "+34 96 234 5678",
        email: "pedidos@pescaderia-marina.com",
        contact_person: "Ana Martín",
        category: "Pescados y Mariscos",
        notes: "Pescado fresco diario del Mediterráneo"
      }
    ]

    const { error } = await supabase
      .from('suppliers')
      .insert(defaultSuppliers)

    if (error) {
      console.error('Error creating default suppliers:', error)
      throw error
    }

    console.log('Default suppliers created successfully')
  }

  static async deletePurchase(id: string) {
    try {
      // First get the purchase with its items to update inventory
      const purchase = await this.getPurchase(id)
      
      if (!purchase) {
        throw new Error('Compra no encontrada')
      }

      // Update inventory by subtracting the purchased quantities
      for (const item of purchase.purchase_items || []) {
        if (item.articles?.id) {
          await this.subtractFromArticleStock(
            item.articles.id,
            item.quantity,
            item.unit_info?.id || item.unit
          )
        }
      }

      // Delete purchase items first (due to foreign key constraint)
      const { error: itemsError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id)

      if (itemsError) throw itemsError

      // Delete associated expense (will be deleted automatically due to CASCADE)
      // But we want to get the expense info first for logging
      const { data: associatedExpense } = await supabase
        .from('expenses')
        .select('id, amount')
        .eq('purchase_id', id)
        .single()

      // Delete the purchase (this will also delete associated expense due to CASCADE)
      const { error: purchaseError } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (purchaseError) throw purchaseError

      if (associatedExpense) {
        console.log(`Deleted associated expense: ${associatedExpense.id} (€${associatedExpense.amount})`)
        // TODO: Update company capital by adding back the expense amount
        // This would require a company_capital table or similar
      }

      return { 
        success: true, 
        deletedExpenseAmount: associatedExpense?.amount || 0 
      }
    } catch (error: any) {
      console.error('Error deleting purchase:', error)
      throw new Error(error.message || 'Error al eliminar la compra')
    }
  }

  static async subtractFromArticleStock(articleId: string, quantity: number, unitId: string) {
    try {
      // Get current article data
      const { data: article, error: getError } = await supabase
        .from('articles')
        .select('current_stock, cost_per_unit, unit_id, default_unit_id')
        .eq('id', articleId)
        .single()

      if (getError) throw getError

      if (!article) {
        throw new Error('Artículo no encontrado')
      }

      // Convert quantity to article's base unit if necessary
      let quantityToSubtract = quantity
      if (unitId !== article.unit_id && unitId !== article.default_unit_id) {
        const conversion = await this.convertUnits(quantity, unitId, article.unit_id || article.default_unit_id)
        if (!conversion.success) {
          console.warn(`Cannot convert units for article ${articleId}, using original quantity`)
        } else {
          quantityToSubtract = conversion.convertedValue || quantity
        }
      }

      const newStock = Math.max(0, (article.current_stock || 0) - quantityToSubtract)

      // Update article stock
      const { error: updateError } = await supabase
        .from('articles')
        .update({ current_stock: newStock })
        .eq('id', articleId)

      if (updateError) throw updateError

      console.log(`Updated article ${articleId}: ${article.current_stock} - ${quantityToSubtract} = ${newStock}`)
      
      return { success: true, newStock }
    } catch (error: any) {
      console.error('Error subtracting from article stock:', error)
      throw error
    }
  }

  // Legacy alias
  static subtractFromIngredientStock = this.subtractFromArticleStock

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single()
    
    if (error) throw error
    return data as Supplier
  }

  // Articles (Inventory items)
  static async getArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        suppliers (
          name
        ),
        food_category:food_categories(
          id,
          name,
          description,
          icon
        ),
        unit_info:units!articles_unit_id_fkey(
          id,
          name,
          symbol,
          category_id,
          base_unit,
          category:categories(id, name)
        ),
        default_unit_info:units!articles_default_unit_id_fkey(
          id,
          name,
          symbol,
          category_id,
          base_unit,
          category:categories(id, name)
        ),
        article_allergens(
          allergen:allergens(
            id,
            name,
            description,
            severity_level
          )
        )
      `)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single()
    
    if (error) throw error
    return data as Article
  }

  static async updateArticle(id: string, updates: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Article
  }

  // Legacy aliases for backwards compatibility
  static getIngredients = this.getArticles
  static createIngredient = this.createArticle
  static updateIngredient = this.updateArticle

  // Recipes
  static async getRecipes() {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          quantity,
          unit,
          cost,
          articles (
            name,
            unit
          )
        )
      `)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async getRecipe(id: string) {
    const { data, error} = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          quantity,
          unit,
          cost,
          articles (
            name,
            unit,
            cost_per_unit
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single()
    
    if (error) throw error
    return data as Recipe
  }

  // Menus
  static async getMenus() {
    const { data, error } = await supabase
      .from('menus')
      .select(`
        *,
        menu_recipes (
          position,
          recipes (
            name,
            sale_price
          )
        )
      `)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async createMenu(menu: Omit<Menu, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('menus')
      .insert(menu)
      .select()
      .single()
    
    if (error) throw error
    return data as Menu
  }

  // Sales
  static async getSales() {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          quantity,
          unit_price,
          total_price,
          recipes (
            name
          )
        )
      `)
      .order('sale_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Purchases
  static async getPurchases() {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (
          name
        ),
        purchase_items (
          quantity,
          unit,
          unit_cost,
          total_cost,
          articles (
            name,
            unit
          )
        )
      `)
      .order('purchase_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getPurchase(id: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (
          id,
          name,
          phone,
          email,
          address
        ),
        purchase_items (
          id,
          quantity,
          unit,
          unit_cost,
          total_cost,
          articles (
            id,
            name,
            unit,
            category
          ),
          unit_info:units!purchase_items_unit_id_fkey (
            id,
            name,
            symbol,
            category:categories(name)
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createPurchase(purchaseData: {
    supplier_id?: string
    purchase_date: string
    total_amount: number
    status?: string
    notes?: string
    items: Array<{
      article_id?: string
      ingredient_id?: string // Legacy field for backwards compatibility
      quantity: number
      unit: string
      unit_cost: number
      total_cost: number
    }>
  }) {
    try {
      console.log('Creating purchase with data:', purchaseData)
      
      // Validate required data
      if (!purchaseData.purchase_date) {
        throw new Error('Fecha de compra es requerida')
      }
      
      if (!purchaseData.items || purchaseData.items.length === 0) {
        throw new Error('Debe incluir al menos un artículo en la compra')
      }
      
      if (!purchaseData.total_amount || purchaseData.total_amount <= 0) {
        throw new Error('El monto total debe ser mayor a 0')
      }

      // Validate all articles exist
      for (const item of purchaseData.items) {
        const articleId = item.article_id || item.ingredient_id // Support legacy field
        const { data: article, error } = await supabase
          .from('articles')
          .select('id')
          .eq('id', articleId)
          .single()
        
        if (error || !article) {
          throw new Error(`Artículo con ID ${articleId} no existe`)
        }
      }

      // Create the purchase
      const purchaseToInsert: any = {
        purchase_date: purchaseData.purchase_date,
        total_amount: purchaseData.total_amount,
        status: purchaseData.status || 'completed'
      }
      
      if (purchaseData.notes) {
        purchaseToInsert.notes = purchaseData.notes
      }
      
      // Only add supplier_id if it's a valid UUID
      if (purchaseData.supplier_id && purchaseData.supplier_id.length > 10) {
        purchaseToInsert.supplier_id = purchaseData.supplier_id
      }

      console.log('Inserting purchase:', purchaseToInsert)

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseToInsert)
        .select()
        .single()

      if (purchaseError) {
        console.error('Purchase creation error:', purchaseError)
        throw new Error(`Error al crear la compra: ${purchaseError.message}`)
      }

      console.log('Purchase created successfully:', purchase)

      // Create purchase items
      const purchaseItems = purchaseData.items.map(item => ({
        purchase_id: purchase.id,
        article_id: item.article_id || item.ingredient_id, // Support legacy field
        quantity: item.quantity,
        unit_id: item.unit, // Guardar en unit_id para el JOIN
        unit_cost: item.unit_cost,
        total_cost: item.total_cost
      }))

      console.log('Creating purchase items:', purchaseItems)

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems)

      if (itemsError) {
        console.error('Purchase items creation error:', itemsError)
        throw new Error(`Error al crear los artículos de la compra: ${itemsError.message}`)
      }

      console.log('Purchase items created successfully')

      return purchase
    } catch (error: any) {
      console.error('Error creating purchase:', error)
      throw new Error(error.message || 'Error desconocido al crear la compra')
    }
  }

  // Expenses
  static async getExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createExpense(expense: {
    description: string
    amount: number
    category?: string
    expense_date: string
    payment_method?: string
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
