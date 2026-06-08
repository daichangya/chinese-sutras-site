import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function CanonLoading() {
  return (
    <div className="jx-page">
      <LoadingSkeleton className="mb-4 h-4 w-16" />
      <LoadingSkeleton className="mb-8 h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
