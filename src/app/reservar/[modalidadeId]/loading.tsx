import { Skeleton } from "@/components/ui/skeleton";

export default function ReservarModalidadeLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <Skeleton className="aspect-[4/3] w-full rounded-xl sm:aspect-video" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-14 shrink-0 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
