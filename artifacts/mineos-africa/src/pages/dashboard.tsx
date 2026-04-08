import { useGetDashboardSummary, useGetRecentActivity, useGetProductionChart } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { AlertTriangle, Layers, Mountain, Users, TrendingUp, Box, Activity, Shield } from "lucide-react";
import { Link } from "wouter";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <motion.div
      variants={item}
      className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent || "text-muted-foreground"}`} />
      </div>
      <div>
        <p className="text-3xl font-bold font-mono tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

const activityIcons: Record<string, React.ElementType> = {
  survey_uploaded: Mountain,
  alert_created: AlertTriangle,
  volume_calculated: Box,
  project_created: Layers,
  user_added: Users,
  production_recorded: TrendingUp,
};

const activityColors: Record<string, string> = {
  survey_uploaded: "text-blue-400",
  alert_created: "text-red-400",
  volume_calculated: "text-primary",
  project_created: "text-green-400",
  user_added: "text-purple-400",
  production_recorded: "text-amber-400",
};

export default function Dashboard() {
  const { data: summary } = useGetDashboardSummary();
  const { data: activity } = useGetRecentActivity();
  const { data: chartData } = useGetProductionChart({});
  const activityAny = activity as unknown as {
    data?: Array<{ id: number; type: string; description: string; projectName?: string; createdAt: string }>;
  } | undefined;
  const chartDataAny = chartData as unknown as { data?: Array<{ date: string; quantity: number; material: string }> } | undefined;

  const activityRows = Array.isArray(activity)
    ? activity
    : Array.isArray(activityAny?.data)
      ? activityAny.data
      : [];

  const chartRows = Array.isArray(chartData)
    ? chartData
    : Array.isArray(chartDataAny?.data)
      ? chartDataAny.data
      : [];

  const formattedChart = chartRows.map((d) => ({
    date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    quantity: d.quantity,
    material: d.material,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial="hidden" animate="show" variants={container}>
        <motion.div variants={item} className="mb-8">
          <h1 className="text-2xl font-bold font-mono tracking-tight">Control Room</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform overview — all active operations</p>
        </motion.div>

        <motion.div variants={container} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Active Mines"
            value={summary?.activeProjects ?? "—"}
            sub={`${summary?.totalProjects ?? 0} total projects`}
            icon={Layers}
            accent="text-primary"
          />
          <StatCard
            label="Active Alerts"
            value={summary?.activeAlerts ?? "—"}
            sub={`${summary?.criticalAlerts ?? 0} critical`}
            icon={AlertTriangle}
            accent={summary?.criticalAlerts ? "text-red-400" : "text-muted-foreground"}
          />
          <StatCard
            label="Total Volume"
            value={summary ? `${(summary.totalVolumeExcavated / 1000).toFixed(1)}k` : "—"}
            sub="m³ excavated"
            icon={Box}
            accent="text-primary"
          />
          <StatCard
            label="Monthly Prod."
            value={summary ? `${(summary.monthlyProduction / 1000).toFixed(1)}k` : "—"}
            sub={summary?.productionUnit ?? "tons"}
            icon={TrendingUp}
            accent="text-green-400"
          />
        </motion.div>

        <motion.div variants={container} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Surveys"
            value={summary?.totalSurveys ?? "—"}
            sub={`${summary?.pendingSurveys ?? 0} processing`}
            icon={Mountain}
            accent="text-blue-400"
          />
          <StatCard
            label="Field Team"
            value={summary?.totalUsers ?? "—"}
            sub="registered users"
            icon={Users}
            accent="text-purple-400"
          />
          <StatCard
            label="Safety Status"
            value={summary?.criticalAlerts === 0 ? "Nominal" : "Alert"}
            sub="geotechnical monitoring"
            icon={Shield}
            accent={summary?.criticalAlerts === 0 ? "text-green-400" : "text-red-400"}
          />
          <StatCard
            label="System Status"
            value="Online"
            sub="all services operational"
            icon={Activity}
            accent="text-green-400"
          />
        </motion.div>

        <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={item} className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Production — Last 30 Days
            </h2>
            {formattedChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={formattedChart}>
                  <defs>
                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(240 5% 8%)", border: "1px solid hsl(240 5% 15%)", borderRadius: "6px", fontSize: 12 }}
                    labelStyle={{ color: "hsl(0 0% 98%)" }}
                    itemStyle={{ color: "hsl(38 92% 50%)" }}
                  />
                  <Area type="monotone" dataKey="quantity" stroke="hsl(38 92% 50%)" strokeWidth={2} fill="url(#prodGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No production data yet
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="bg-card border border-border rounded-lg p-5 overflow-hidden">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[220px]">
              {activityRows.length === 0 && (
                <p className="text-muted-foreground text-sm">No activity recorded yet</p>
              )}
              {activityRows.map((act) => {
                const Icon = activityIcons[act.type] ?? Activity;
                const color = activityColors[act.type] ?? "text-muted-foreground";
                return (
                  <div key={act.id} className="flex gap-3 items-start">
                    <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-foreground">{act.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {act.projectName && <span className="text-primary">{act.projectName} · </span>}
                        {new Date(act.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {summary && summary.criticalAlerts > 0 && (
          <motion.div
            variants={item}
            className="mt-6 border border-red-900/50 bg-red-950/20 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">
                  {summary.criticalAlerts} critical alert{summary.criticalAlerts > 1 ? "s" : ""} require immediate attention
                </p>
                <p className="text-xs text-red-400/70 mt-0.5">Review safety alerts and take corrective action</p>
              </div>
            </div>
            <Link href="/alerts">
              <button className="text-xs px-3 py-1.5 bg-red-900/40 text-red-300 border border-red-800/50 rounded hover:bg-red-900/60 transition-colors font-mono">
                View Alerts
              </button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
