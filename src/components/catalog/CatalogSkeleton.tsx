import { Skeleton } from "@/components/ui/Skeleton";

/** Suspense fallback while the URL state resolves — designed, not a spinner. */
export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="loading">
      <div className="container-x pt-10 pb-8 md:pt-16 md:pb-12">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-14 w-64 md:h-20 md:w-96" />
        <Skeleton className="mt-5 h-4 w-80 max-w-full" />
      </div>
      <div className="container-x lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
        <div className="hidden lg:flex flex-col gap-6">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i}>
              <Skeleton className="mb-3 h-3 w-16" />
              <div className="flex flex-wrap gap-1.5">{Array.from({ length: 5 }, (_, j) => <Skeleton key={j} className="h-7 w-16" />)}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-8 flex items-center justify-between border-b hairline pb-4"><Skeleton className="h-7 w-32" /><Skeleton className="h-8 w-36" /></div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}><Skeleton className="aspect-[10/13] w-full" /><Skeleton className="mt-4 h-3 w-16" /><Skeleton className="mt-2 h-5 w-32" /><Skeleton className="mt-2 h-3 w-24" /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
