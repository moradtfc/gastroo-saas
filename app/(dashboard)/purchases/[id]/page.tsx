import PurchaseForm from "@/components/purchases/PurchaseForm"

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  return <PurchaseForm purchaseId={params.id} />
}
