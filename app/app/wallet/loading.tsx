import { Skeleton } from "../../components/ui/Skeleton";

export default function WalletLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary">
      <header className="text-center pt-4">
        <Skeleton variant="text" className="h-9 w-24 mx-auto mb-2" />
        <Skeleton variant="text" className="h-4 w-56 mx-auto" />
      </header>

      <Skeleton variant="rectangular" className="h-14 w-full rounded-2xl" />

      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="rectangular" className="h-24 w-full rounded-3xl" />
        <Skeleton variant="rectangular" className="h-24 w-full rounded-3xl" />
      </div>

      <Skeleton variant="rectangular" className="h-16 w-full rounded-2xl" />

      <div className="flex flex-col gap-3">
        <Skeleton variant="text" className="h-4 w-28 mb-1" />
        <Skeleton variant="rectangular" className="h-16 w-full rounded-2xl" />
        <Skeleton variant="rectangular" className="h-16 w-full rounded-2xl" />
        <Skeleton variant="rectangular" className="h-16 w-full rounded-2xl" />
      </div>
    </main>
  );
}
