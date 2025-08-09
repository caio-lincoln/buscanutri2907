import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="container-custom py-16">
          <div className="text-center max-w-3xl mx-auto">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Categories Filter Skeleton */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>

        {/* Featured Post Skeleton */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <Skeleton className="w-full h-64 md:h-80" />
              </div>
              <div className="md:w-1/2 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-8 w-full mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </Card>
        </div>

        {/* Regular Posts Grid Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Load More Button Skeleton */}
        <div className="text-center mt-12">
          <Skeleton className="h-12 w-48 mx-auto" />
        </div>
      </div>

      {/* Newsletter Section Skeleton */}
      <div className="bg-[#1E1D40] py-16">
        <div className="container-custom text-center">
          <Skeleton className="h-8 w-96 mx-auto mb-4 bg-white/20" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto mb-8 bg-white/20" />
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Skeleton className="flex-1 h-12 bg-white/20" />
            <Skeleton className="h-12 w-24 bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

