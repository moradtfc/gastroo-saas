import { supabaseAdmin } from "@/lib/supabase"

const main = async () => {
  const { data, error } = await supabaseAdmin
    .from("allergens")
    .select("id, name, severity_level")
    .order("name")

  if (error) throw error

  console.table(data)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

