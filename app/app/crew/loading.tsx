import { Skeleton } from "../../components/ui/Skeleton";

export default function CrewLoading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary">
      <header className="pt-4">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </header>
      
      <div className="glass-panel rounded-3xl p-6 mt-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
        </div>
      </div>
      
      <div className="flex flex-col gap-3 mt-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
