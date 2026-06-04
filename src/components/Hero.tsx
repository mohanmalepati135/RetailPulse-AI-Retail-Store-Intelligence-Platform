import { motion } from "framer-motion";
import { Camera, Radio, Store, Wifi } from "lucide-react";
import { useFleetSummary } from "../hooks/queries";
import { formatPercent } from "../lib/format";

function SummaryStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Store;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/90 ring-1 ring-white/10">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-white">{value}</div>
        <div className="text-[12px] text-white/60">{label}</div>
      </div>
    </div>
  );
}

export function Hero() {
  const { data } = useFleetSummary();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-[#1e1b4b]/30 p-6 shadow-card md:p-8"
      style={{
        background:
          "radial-gradient(120% 140% at 0% 0%, #4338ca 0%, #312e81 42%, #1e1b4b 100%)",
      }}
    >
      {/* subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "#818cf8" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium text-emerald-300 ring-1 ring-white/15 backdrop-blur">
            <span className="relative flex h-2 w-2 text-emerald-400">
              <span className="live-ring absolute inline-flex h-2 w-2 rounded-full" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live · all systems operational
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Retail Intelligence Command Center
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/65">
            Monitor store performance, visitor behavior, and operational anomalies
            across your fleet in real time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:flex lg:gap-8">
          <SummaryStat
            icon={Store}
            value={`${data?.stores_active ?? 5}`}
            label="Stores active"
          />
          <SummaryStat
            icon={Camera}
            value={`${data?.cameras_online ?? 12}/${data?.cameras_total ?? 12}`}
            label="Cameras online"
          />
          <SummaryStat
            icon={Wifi}
            value={data ? formatPercent(data.feed_health, 1) : "98.4%"}
            label="Feed health"
          />
          <SummaryStat icon={Radio} value="25 fps" label="Pipeline" />
        </div>
      </div>
    </motion.section>
  );
}
