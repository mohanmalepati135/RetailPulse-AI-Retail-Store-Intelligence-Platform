import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BottomNav, Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DemoModeBanner } from "../DemoModeBanner";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-5 md:px-6 md:pb-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[14px] text-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
