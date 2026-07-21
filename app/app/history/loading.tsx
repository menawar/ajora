import { Skeleton } from "../../components/ui/Skeleton";

export default function HistoryLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary">
      <div className="pt-4">
        <Skeleton variant="text" className="h-4 w-28 mb-4" />
        <Skeleton variant="text" className="h-9 w-48 mb-2" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>
      <Skeleton variant="rectangular" className="h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton variant="rectangular" className="h-16 rounded-2xl" />
        <Skeleton variant="rectangular" className="h-16 rounded-2xl" />
        <Skeleton variant="rectangular" className="h-16 rounded-2xl" />
      </div>
      <Skeleton variant="rectangular" className="h-24 w-full rounded-3xl" />
      <Skeleton variant="rectangular" className="h-12 w-full rounded-2xl" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rectangular" className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
