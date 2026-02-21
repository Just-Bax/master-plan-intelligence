import { Skeleton } from "@/components/ui/Skeleton";

/** Loading placeholder for the master plan label + select block in the sidebar. */
export function SidebarPlansSkeleton() {
  return (
    <div className="mb-3 space-y-3" aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}
