import CreatePurchasePage from "../create/page"

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  return <CreatePurchasePage purchaseId={params.id} />
}
