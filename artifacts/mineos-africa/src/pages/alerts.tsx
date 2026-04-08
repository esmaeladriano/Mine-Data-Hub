import { useState } from "react";
import { useListAlerts, useCreateAlert, useUpdateAlert, useListProjects } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const severityColors: Record<string, string> = {
  low: "bg-blue-900/30 text-blue-400 border-blue-800/30",
  medium: "bg-yellow-900/30 text-yellow-400 border-yellow-800/30",
  high: "bg-orange-900/30 text-orange-400 border-orange-800/30",
  critical: "bg-red-900/30 text-red-400 border-red-800/30",
};

const severityBorders: Record<string, string> = {
  low: "border-l-blue-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

const categoryLabels: Record<string, string> = {
  slope_instability: "Slope Instability",
  deformation: "Deformation",
  seismic: "Seismic Activity",
  flooding: "Flooding",
  equipment: "Equipment",
  other: "Other",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function NewAlertDialog() {
  const [open, setOpen] = useState(false);
  const { data: projects } = useListProjects();
  const projectsAny = projects as unknown as { data?: Array<{ id: number; name: string }> } | undefined;
  const projectRows = Array.isArray(projects)
    ? projects
    : Array.isArray(projectsAny?.data)
      ? projectsAny.data
      : [];
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    severity: "medium" as const,
    category: "other" as const,
    status: "active" as const,
    latitude: "",
    longitude: "",
  });
  const qc = useQueryClient();
  const createAlert = useCreateAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAlert.mutateAsync({
      data: {
        projectId: parseInt(form.projectId),
        title: form.title,
        description: form.description,
        severity: form.severity,
        category: form.category,
        status: form.status,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      },
    });
    qc.invalidateQueries({ queryKey: ["/api/alerts"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono text-xs"><Plus className="h-4 w-4" />New Alert</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-mono">Create Safety Alert</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Project *</Label>
            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projectRows.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Alert Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description *</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Severity *</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as typeof form.severity })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createAlert.isPending || !form.projectId}>
              {createAlert.isPending ? "Creating..." : "Create Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Alerts() {
  const [filter, setFilter] = useState<"all" | "active" | "resolved" | "dismissed">("all");
  const { data: allAlerts } = useListAlerts({});
  const { data: projects } = useListProjects();
  const projectsAny = projects as unknown as { data?: Array<{ id: number; name: string }> } | undefined;
  const alertsAny = allAlerts as unknown as {
    data?: Array<{
      id: number;
      projectId: number;
      title: string;
      description: string;
      severity: "low" | "medium" | "high" | "critical";
      category: keyof typeof categoryLabels;
      status: "active" | "resolved" | "dismissed";
      createdAt: string;
    }>;
  } | undefined;
  const projectRows = Array.isArray(projects)
    ? projects
    : Array.isArray(projectsAny?.data)
      ? projectsAny.data
      : [];
  const alertRows = Array.isArray(allAlerts)
    ? allAlerts
    : Array.isArray(alertsAny?.data)
      ? alertsAny.data
      : [];
  const qc = useQueryClient();
  const updateAlert = useUpdateAlert();
  const projectMap = Object.fromEntries(projectRows.map((p) => [p.id, p.name]));

  const filtered = filter === "all" ? alertRows : alertRows.filter((a) => a.status === filter);
  const active = alertRows.filter((a) => a.status === "active").length;
  const critical = alertRows.filter((a) => a.severity === "critical" && a.status === "active").length;

  const handleStatus = async (id: number, status: "resolved" | "dismissed") => {
    await updateAlert.mutateAsync({ id, data: { status } });
    qc.invalidateQueries({ queryKey: ["/api/alerts"] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Safety Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {active} active · {critical} critical
          </p>
        </div>
        <NewAlertDialog />
      </div>

      <div className="flex gap-2 mb-5">
        {(["all", "active", "resolved", "dismissed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded border font-mono transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <motion.div initial="hidden" animate="show" variants={container} className="space-y-3">
        {filtered.map((alert) => (
          <motion.div key={alert.id} variants={item}
            className={`bg-card border border-border border-l-2 ${severityBorders[alert.severity]} rounded-lg p-5 hover:bg-card/80 transition-colors`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground ml-6 mb-2">{alert.description}</p>
                <div className="flex items-center gap-3 ml-6 text-[10px] font-mono text-muted-foreground">
                  <span>{projectMap[alert.projectId] ?? `Project ${alert.projectId}`}</span>
                  <span>·</span>
                  <span>{categoryLabels[alert.category]}</span>
                  <span>·</span>
                  <span>{new Date(alert.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              {alert.status === "active" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStatus(alert.id, "resolved")}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1 border border-green-800/50 text-green-400 hover:bg-green-900/20 rounded font-mono transition-colors"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Resolve
                  </button>
                  <button
                    onClick={() => handleStatus(alert.id, "dismissed")}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1 border border-border text-muted-foreground hover:bg-muted rounded font-mono transition-colors"
                  >
                    <XCircle className="h-3 w-3" />
                    Dismiss
                  </button>
                </div>
              )}
              {alert.status !== "active" && (
                <span className={`text-[10px] px-2 py-1 rounded font-mono ${alert.status === "resolved" ? "text-green-400" : "text-muted-foreground"}`}>
                  {alert.status}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
