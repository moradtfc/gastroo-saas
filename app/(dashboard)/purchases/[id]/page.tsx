import PurchaseForm from "@/components/purchases/PurchaseForm"

export default async function EditPurchasePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PurchaseForm purchaseId={id} />
}
