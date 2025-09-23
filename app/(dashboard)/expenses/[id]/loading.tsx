import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ExpenseDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
