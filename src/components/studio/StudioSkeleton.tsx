import { Skeleton } from "@/components/ui/Skeleton";

/** Designed placeholders while the persisted store arrives: a header line, a row of boards, a sidebar. */
export function StudioSkeleton({ embedded = false, detail = false }: { embedded?: boolean; detail?: boolean }) {
  if (embedded) {
    return (
      <div className="grid gap-4 px-4 py-4" aria-hidden>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-20 w-3/4" />
      </div>
    );
  }
  return (
    <div className="container-x pt-10 md:pt-16" aria-hidden>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-14 w-2/3 max-w-xl md:h-20" />
      <Skeleton className="mt-6 h-5 w-96 max-w-full" />
      {detail ? (
        <div className="mt-12 grid gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      )}
    </div>
  );
}
