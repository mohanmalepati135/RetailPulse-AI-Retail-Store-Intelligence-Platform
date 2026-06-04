import {
  Activity,
  AlertTriangle,
  Filter,
  Grid3x3,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Funnel", to: "/funnel", icon: Filter },
  { label: "Heatmap", to: "/heatmap", icon: Grid3x3 },
  { label: "Anomalies", to: "/anomalies", icon: AlertTriangle },
  { label: "System health", to: "/system-health", icon: Activity },
];
