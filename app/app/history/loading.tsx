import { Skeleton } from "../../components/ui/Skeleton";

export default function HistoryLoading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary">
      <header className="pt-4 flex justify-between items-end">
        <div>
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </header>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2 w-full pt-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2 w-full pt-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
          <div className="flex flex-col gap-2 w-full pt-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
