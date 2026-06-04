import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { useDemoMode } from "../hooks/useDemoMode";

export function DemoModeBanner() {
  const demo = useDemoMode();
  return (
    <AnimatePresence>
      {demo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden border-b border-warning/30 bg-warning-soft"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 md:px-6">
            <Info className="h-4 w-4 shrink-0 text-warning" aria-hidden />
            <p className="text-[13px] leading-tight">
              <span className="font-semibold text-warning">Demo Mode Active</span>
              <span className="ml-2 text-text-secondary">
                Backend unavailable — using simulated retail analytics.
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
