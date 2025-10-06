import { supabaseAdmin } from "@/lib/supabase"

interface UnitMapEntry {
  id: string
  name: string
  symbol: string
  aliases: string[]
}

interface CategoryMapEntry {
  id: string
  name: string
  keywords: string[]
}

const UNIT_MAP: UnitMapEntry[] = [
  { id: "158e6ea1-fe2e-46b9-bdad-82bfd9f2e428", name: "kilogramo", symbol: "kg", aliases: ["kg", "kilogramo", "kilo", "kilos", "kilogramos"] },
  { id: "11b0687a-c31d-45e5-b023-86a846cd2b88", name: "gramo", symbol: "g", aliases: ["gramo", "gramos", "g"] },
  { id: "c52ef0dd-1987-4b89-9bbf-611020f01eae", name: "litro", symbol: "L", aliases: ["litro", "litros", "l"] },
  { id: "e0a52012-a449-42f1-becd-7a9914454ecc", name: "mililitro", symbol: "ml", aliases: ["ml", "mililitro", "mililitros"] },
  { id: "5e373da1-0b63-4c6f-b6f2-100c52810eda", name: "unidad", symbol: "ud", aliases: ["unidad", "unidades", "ud", "u"] },
  { id: "0fc0c4b2-b1bb-4b58-9775-3cffd23426d4", name: "libra", symbol: "lb", aliases: ["lb", "libra", "libras"] },
  { id: "bb4f7d19-bb60-4595-9e0c-4828ef93ae28", name: "onza", symbol: "oz", aliases: ["oz", "onza", "onzas"] },
  { id: "17297613-0752-4cd6-9a03-abf1bc92e03d", name: "bolsa", symbol: "bls", aliases: ["bolsa", "bolsas", "bls"] },
  { id: "3d16a360-78d9-4994-90fd-faf3cc7ac560", name: "caja", symbol: "cja", aliases: ["caja", "cajas", "cja"] },
  { id: "15745c3c-908f-44b0-8fef-f40a97b14c1f", name: "paquete", symbol: "paq", aliases: ["paquete", "paquetes", "paq"] },
  { id: "0e04a26b-7da1-4af0-8b4d-268515ca22c0", name: "docena", symbol: "dz", aliases: ["docena", "docenas", "dz"] },
  { id: "4632e685-d043-4d7c-b48a-c60f4d80bc19", name: "ciento", symbol: "cto", aliases: ["ciento", "cento", "cto"] },
  { id: "cd0b06dd-e481-4bf7-94d3-077b711fe148", name: "par", symbol: "par", aliases: ["par", "pares"] },
]

const CATEGORY_MAP: CategoryMapEntry[] = [
  { id: "a5555555-5555-5555-5555-555555555555", name: "Frutas y Verduras", keywords: ["tomate", "lechuga", "cebolla", "zanahoria", "fruta", "verdura", "vegetal", "pepino", "ajo", "pimiento", "patata", "papa", "verduras", "frutas", "cilantro"] },
  { id: "a1111111-1111-1111-1111-111111111111", name: "Carnes y Aves", keywords: ["carne", "pollo", "res", "cerdo", "pavo", "conejo", "carnes", "ave", "aves", "chuleta", "lomo", "chuletón"] },
  { id: "a2222222-2222-2222-2222-222222222222", name: "Pescados y Mariscos", keywords: ["pescado", "atun", "atún", "salmon", "salmón", "marisco", "camaron", "camarón", "pulpo", "calamar", "gamba", "langostino"] },
  { id: "a3333333-3333-3333-3333-333333333333", name: "Lácteos y Huevos", keywords: ["leche", "queso", "yogur", "yoghurt", "yogurt", "mantequilla", "huevo", "nata", "crema", "lacteo", "lácteo", "lácteos"] },
  { id: "a4444444-4444-4444-4444-444444444444", name: "Cereales y Granos", keywords: ["arroz", "harina", "trigo", "avena", "cereal", "grano", "pasta", "fideo", "fideos", "cuscús", "quinoa", "pan rallado"] },
  { id: "a6666666-6666-6666-6666-666666666666", name: "Aceites y Grasas", keywords: ["aceite", "manteca", "margarina", "grasa", "aceituna", "oliva", "aceite vegetal", "aceite de oliva"] },
  { id: "a7777777-7777-7777-7777-777777777777", name: "Condimentos y Especias", keywords: ["sal", "pimienta", "especia", "condimento", "hierba", "oregano", "orégano", "curry", "comino", "paprika", "azafrán", "mostaza", "anís", "canela"] },
  { id: "a8888888-8888-8888-8888-888888888888", name: "Bebidas", keywords: ["agua", "vino", "cerveza", "refresco", "bebida", "jugo", "zumo", "soda", "licor", "te", "té", "café"] },
  { id: "a9999999-9999-9999-9999-999999999999", name: "Panadería y Repostería", keywords: ["pan", "panadería", "repostería", "bizcocho", "pastel", "pasteles", "tarta", "galleta", "galletas", "masa", "bollería", "croissant", "magdalena"] },
  { id: "b2222222-2222-2222-2222-222222222222", name: "Envases y Embalajes", keywords: ["envase", "embalaje", "bolsa", "caja", "vaso", "plato", "empaque", "film", "envoltorio", "recipiente", "tupper"] },
  { id: "b3333333-3333-3333-3333-333333333333", name: "Productos de Limpieza", keywords: ["limpieza", "detergente", "desinfectante", "jabón", "lavavajillas", "lejía", "cloro", "ambientador", "desengrasante"] },
  { id: "b6666666-6666-6666-6666-666666666666", name: "Suministros de Mesa", keywords: ["plato", "platos", "copa", "copas", "tenedor", "cuchara", "servilleta", "mantel", "vajilla", "cubierto", "cubiertos", "vaso", "vasos"] },
  { id: "b4444444-4444-4444-4444-444444444444", name: "Utensilios de Cocina", keywords: ["olla", "sartén", "sarten", "cuchillo", "utensilio", "cazo", "espátula", "espátula", "espumadera", "batidor", "pelador", "cucharón"] },
  { id: "b5555555-5555-5555-5555-555555555555", name: "Equipos y Maquinaria", keywords: ["horno", "batidora", "equipo", "maquina", "máquina", "maquinaria", "refrigerador", "nevera", "congelador", "plancha", "freidora"] },
  { id: "b9999999-9999-9999-9999-999999999999", name: "Papelería y Oficina", keywords: ["papel", "bolígrafo", "boligrafo", "cuaderno", "factura", "tinta", "cartucho", "impresora", "oficina", "papelería"] },
  { id: "b7777777-7777-7777-7777-777777777777", name: "Productos Químicos", keywords: ["químico", "quimico", "aditivo", "colorante", "conservante", "ácido", "base", "alcohol", "solvente"] },
  { id: "b8888888-8888-8888-8888-888888888888", name: "Combustibles y Energía", keywords: ["gas", "carbón", "carbon", "leña", "combustible", "butano", "propano"] },
]

const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() || ""

const findUnitId = (unitValue: string | null | undefined): string | null => {
  const normalized = normalize(unitValue)
  if (!normalized) return null
  const match = UNIT_MAP.find((entry) => entry.aliases.includes(normalized) || entry.symbol === normalized)
  return match?.id || null
}

const findCategoryId = (name: string | null | undefined, category: string | null | undefined): string | null => {
  const normalizedName = normalize(name)
  const normalizedCategory = normalize(category)
  if (!normalizedName && !normalizedCategory) return null

  const match = CATEGORY_MAP.find((entry) =>
    entry.keywords.some((keyword) => normalizedName.includes(keyword) || normalizedCategory.includes(keyword))
  )
  return match?.id || null
}

const migrateIngredients = async () => {
  console.log("🔄 Iniciando migración de ingredientes...")

  const { data: ingredients, error } = await supabaseAdmin
    .from("ingredients")
    .select("id, name, unit, unit_id, default_unit_id, food_category_id, category")

  if (error) throw error
  if (!ingredients || ingredients.length === 0) {
    console.log("ℹ️ No se encontraron ingredientes para migrar.")
    return
  }

  let updatedCount = 0

  for (const ingredient of ingredients) {
    const updates: Record<string, string> = {}

    if (!ingredient.unit_id || !ingredient.default_unit_id) {
      const unitId = findUnitId(ingredient.unit)
      if (unitId) {
        updates.unit_id = unitId
        updates.default_unit_id = unitId
      }
    }

    if (!ingredient.food_category_id) {
      const categoryId = findCategoryId(ingredient.name, ingredient.category)
      if (categoryId) {
        updates.food_category_id = categoryId
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("ingredients")
        .update(updates)
        .eq("id", ingredient.id)

      if (updateError) {
        console.error(`❌ Error actualizando ingrediente ${ingredient.id}:`, updateError.message)
      } else {
        updatedCount += 1
        console.log(`✅ Ingrediente ${ingredient.name} actualizado con`, updates)
      }
    }
  }

  console.log(`🎉 Migración completada. Ingredientes actualizados: ${updatedCount}`)
}

migrateIngredients()
  .then(() => {
    console.log("✅ Proceso finalizado correctamente")
    process.exit(0)
  })
  .catch((err) => {
    console.error("❌ Error en la migración:", err)
    process.exit(1)
  })

