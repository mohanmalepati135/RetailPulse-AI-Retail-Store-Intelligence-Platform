import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, Radar } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { APP_NAME } from "../../lib/constants";
import { cn } from "../../utils/cn";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-all duration-200 md:flex",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-secondary text-white shadow-sm">
          <Radar className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold text-text-primary">
              {APP_NAME}
            </div>
            <div className="truncate text-[11px] text-text-muted">
              Retail Intelligence
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-2 pt-1">
          <span className="label-caps text-[10px]">Workspace</span>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-2.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-all duration-150",
                collapsed && "justify-center",
                isActive
                  ? "bg-brand-soft text-brand-ink"
                  : "text-text-secondary hover:bg-[#f5f7ff] hover:text-text-primary",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand"
                    aria-hidden
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-brand"
                      : "text-text-muted group-hover:text-text-secondary",
                  )}
                  aria-hidden
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="mx-2.5 mb-2 rounded-xl border border-border bg-[#f9fafb] p-3">
          <div className="flex items-center gap-2 text-[12px] font-medium text-text-primary">
            <span className="relative flex h-2 w-2 text-emerald-500">
              <span className="live-ring absolute inline-flex h-2 w-2 rounded-full" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Pipeline live
          </div>
          <p className="mt-1 text-[11px] leading-snug text-text-muted">
            YOLOv8 + ByteTrack streaming at 25 fps
          </p>
        </div>
      )}

      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="m-2.5 flex items-center justify-center gap-2 rounded-lg border border-border px-2.5 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-[#f5f7ff]"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" aria-hidden />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-surface/90 px-1 py-1.5 backdrop-blur-md md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
              isActive ? "text-brand" : "text-text-muted",
            )
          }
        >
          <item.icon className="h-5 w-5" aria-hidden />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
