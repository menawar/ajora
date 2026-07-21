import { Skeleton } from "../../components/ui/Skeleton";

export default function BoardLoading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary">
      <header className="pt-4">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </header>
      
      <div className="flex gap-2 my-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      
      <div className="flex flex-col gap-3 mt-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
