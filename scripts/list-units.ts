import { supabaseAdmin } from "@/lib/supabase"

const main = async () => {
  const { data, error } = await supabaseAdmin
    .from("units")
    .select("id, name, symbol")
    .order("name")

  if (error) throw error

  console.table(data?.map(unit => ({ id: unit.id, name: unit.name, symbol: unit.symbol })))
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

