import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function KgLoading() {
  return (
    <div className="jx-page">
      <LoadingSkeleton className="mb-4 h-4 w-16" />
      <LoadingSkeleton className="mb-8 h-8 w-40" />
      <LoadingSkeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
