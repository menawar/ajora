import { Skeleton } from "../../components/ui/Skeleton";

export default function WalletLoading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary">
      <header className="pt-4">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </header>
      
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center gap-2 mt-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-10 w-full mt-4 rounded-2xl" />
      </div>
      
      <div className="flex gap-4 mt-2">
        <Skeleton className="h-24 w-1/2 rounded-2xl" />
        <Skeleton className="h-24 w-1/2 rounded-2xl" />
      </div>
    </div>
  );
}
