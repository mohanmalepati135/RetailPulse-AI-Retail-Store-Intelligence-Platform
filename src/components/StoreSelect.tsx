import { ChevronDown } from "lucide-react";
import { STORES } from "../lib/constants";

interface StoreSelectProps {
  value: string; // "" = all stores
  onChange: (value: string) => void;
  includeAll?: boolean;
}

export function StoreSelect({ value, onChange, includeAll = true }: StoreSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select store"
        className="appearance-none rounded-lg border border-border bg-surface py-1.5 pl-3 pr-8 text-[13px] font-medium text-text-primary transition-colors hover:bg-zinc-50 focus:outline-none"
      >
        {includeAll && <option value="">All stores</option>}
        {STORES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        aria-hidden
      />
    </div>
  );
}
