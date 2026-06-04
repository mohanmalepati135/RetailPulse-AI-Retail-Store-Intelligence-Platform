import type { ReactNode } from "react";
import { EmptyState, ErrorState, Skeleton } from "./States";
import type { LucideIcon } from "lucide-react";

interface AsyncSectionProps<T> {
  loading: boolean;
  error: string | null;
  data: T | null | undefined;
  isEmpty?: (data: T) => boolean;
  onRetry?: () => void;
  emptyLabel?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: { label: string; onClick: () => void };
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

export function AsyncSection<T>({
  loading,
  error,
  data,
  isEmpty,
  onRetry,
  emptyLabel = "No live data yet",
  emptyIcon,
  emptyAction,
  skeleton,
  children,
}: AsyncSectionProps<T>) {
  if (loading && !data) {
    return (
      <>{skeleton ?? <Skeleton className="h-40 w-full" />}</>
    );
  }
  if (error && !data) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <EmptyState
        label={emptyLabel}
        icon={emptyIcon}
        actionLabel={emptyAction?.label}
        onAction={emptyAction?.onClick}
      />
    );
  }
  return <>{children(data)}</>;
}
