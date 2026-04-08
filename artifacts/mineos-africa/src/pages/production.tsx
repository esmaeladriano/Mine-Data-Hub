import { useState } from "react";
import { useListProductionRecords, useCreateProductionRecord, useListProjects, useGetProductionChart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, TrendingUp } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function NewProductionDialog() {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useListProjects();
  const [form, setForm] = useState({
    projectId: "",
    recordDate: new Date().toISOString().split("T")[0],
    material: "",
    quantity: "",
    unit: "tons" as const,
    area: "",
    shift: "full" as const,
    notes: "",
  });
  const qc = useQueryClient();
  const createRecord = useCreateProductionRecord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRecord.mutateAsync({
      data: {
        projectId: parseInt(form.projectId),
        recordDate: new Date(form.recordDate).toISOString(),
        material: form.material,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        area: form.area || null,
        shift: form.shift,
        notes: form.notes || null,
      },
    });
    qc.invalidateQueries({ queryKey: ["/api/production"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono text-xs"><Plus className="h-4 w-4" />New Record</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-mono">Production Record</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Project *</Label>
            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input type="date" value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Shift</Label>
              <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v as typeof form.shift })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="full">Full Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Material *</Label>
            <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} required className="mt-1" placeholder="e.g. Diamond Ore, Gold Ore" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Quantity *</Label>
              <Input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as typeof form.unit })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tons">Tons</SelectItem>
                  <SelectItem value="m3">m³</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Area / Zone</Label>
            <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="mt-1" placeholder="e.g. North Face, Level 3" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createRecord.isPending || !form.projectId}>
              {createRecord.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Production() {
  const { data: records = [] } = useListProductionRecords({});
  const { data: projects = [] } = useListProjects();
  const { data: chartData = [] } = useGetProductionChart({});
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const formattedChart = chartData.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    quantity: d.quantity,
  }));

  const totalProduction = records.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Production</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {records.length} records · Total: {(totalProduction / 1000).toFixed(1)}k units
          </p>
        </div>
        <NewProductionDialog />
      </div>

      <motion.div initial="hidden" animate="show" variants={container}>
        {formattedChart.length > 0 && (
          <motion.div variants={item} className="bg-card border border-border rounded-lg p-5 mb-6">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">Daily Output — Last 14 Days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={formattedChart} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 5% 8%)", border: "1px solid hsl(240 5% 15%)", borderRadius: "6px", fontSize: 12 }}
                  labelStyle={{ color: "hsl(0 0% 98%)" }}
                  itemStyle={{ color: "hsl(38 92% 50%)" }}
                />
                <Bar dataKey="quantity" fill="hsl(38 92% 50%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <div className="space-y-2">
          {[...records].reverse().map((record) => (
            <motion.div key={record.id} variants={item}
              className="bg-card border border-border rounded-lg px-5 py-4 flex items-center justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{record.material}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {projectMap[record.projectId] ?? `Project ${record.projectId}`} · {record.area ?? record.shift} shift
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-primary">{record.quantity.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{record.unit}</p>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{new Date(record.recordDate).toLocaleDateString("pt-BR")}</p>
              </div>
            </motion.div>
          ))}
          {records.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No production records yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
