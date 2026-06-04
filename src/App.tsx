import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { StoreDetail } from "./pages/StoreDetail";
import { Funnel } from "./pages/Funnel";
import { Heatmap } from "./pages/Heatmap";
import { Anomalies } from "./pages/Anomalies";
import { SystemHealth } from "./pages/SystemHealth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 2000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/store/:id" element={<StoreDetail />} />
            <Route path="/funnel" element={<Funnel />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
