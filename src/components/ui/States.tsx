import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  label,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-zinc-300" strokeWidth={1.5} aria-hidden />
      <p className="text-[14px] text-text-secondary">{label}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-zinc-100"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  inline?: boolean;
}

export function ErrorState({ message, onRetry, inline }: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 py-10 text-center ${
        inline ? "opacity-70" : ""
      }`}
    >
      <AlertTriangle
        className="h-9 w-9 text-warning"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-[14px] text-text-secondary">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand transition-colors hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-zinc-100 ${className}`} />
  );
}
