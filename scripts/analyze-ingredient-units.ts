import { supabaseAdmin } from "@/lib/supabase"

const main = async () => {
  const { data, error } = await supabaseAdmin
    .from("ingredients")
    .select("id, name, unit, unit_id, default_unit_id, food_category_id")

  if (error) throw error

  const fallback = data?.filter((ingredient) => !ingredient.unit_id || !ingredient.default_unit_id)
  console.log(`Ingredientes sin unit_id/default_unit_id: ${fallback?.length}`)
  fallback?.forEach((ingredient) => {
    console.log(`- ${ingredient.name} (unit: ${ingredient.unit})`)
  })

  const missingCategory = data?.filter((ingredient) => !ingredient.food_category_id)
  console.log(`Ingredientes sin food_category_id: ${missingCategory?.length}`)
  missingCategory?.forEach((ingredient) => {
    console.log(`- ${ingredient.name}`)
  })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

