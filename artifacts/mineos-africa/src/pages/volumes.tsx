import { useState } from "react";
import { useListVolumes, useCreateVolumeCalculation, useListProjects, useListSurveys } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Box, ArrowDown, ArrowUp } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function NewVolumeDialog() {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useListProjects();
  const { data: surveys = [] } = useListSurveys({});
  const [form, setForm] = useState({
    projectId: "",
    name: "",
    survey1Id: "",
    survey2Id: "",
    excavatedVolume: "",
    fillVolume: "",
    netVolume: "",
    method: "tin" as const,
    notes: "",
  });
  const qc = useQueryClient();
  const createVolume = useCreateVolumeCalculation();

  const projectSurveys = surveys.filter((s) => s.projectId === parseInt(form.projectId) && !isNaN(parseInt(form.projectId)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVolume.mutateAsync({
      data: {
        projectId: parseInt(form.projectId),
        name: form.name,
        survey1Id: parseInt(form.survey1Id),
        survey2Id: parseInt(form.survey2Id),
        excavatedVolume: parseFloat(form.excavatedVolume),
        fillVolume: parseFloat(form.fillVolume),
        netVolume: parseFloat(form.netVolume),
        method: form.method,
        notes: form.notes || null,
      },
    });
    qc.invalidateQueries({ queryKey: ["/api/volumes"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono text-xs"><Plus className="h-4 w-4" />New Calculation</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-mono">New Volume Calculation</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Project *</Label>
            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v, survey1Id: "", survey2Id: "" })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Calculation Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Survey 1 (Before) *</Label>
              <Select value={form.survey1Id} onValueChange={(v) => setForm({ ...form, survey1Id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select survey" /></SelectTrigger>
                <SelectContent>{projectSurveys.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Survey 2 (After) *</Label>
              <Select value={form.survey2Id} onValueChange={(v) => setForm({ ...form, survey2Id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select survey" /></SelectTrigger>
                <SelectContent>{projectSurveys.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Excavated (m³) *</Label>
              <Input type="number" step="any" value={form.excavatedVolume} onChange={(e) => setForm({ ...form, excavatedVolume: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Fill (m³) *</Label>
              <Input type="number" step="any" value={form.fillVolume} onChange={(e) => setForm({ ...form, fillVolume: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Net (m³) *</Label>
              <Input type="number" step="any" value={form.netVolume} onChange={(e) => setForm({ ...form, netVolume: e.target.value })} required className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as typeof form.method })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tin">TIN (Triangulated Irregular Network)</SelectItem>
                <SelectItem value="grid">Grid Method</SelectItem>
                <SelectItem value="cross_section">Cross Section</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createVolume.isPending || !form.projectId || !form.survey1Id || !form.survey2Id}>
              {createVolume.isPending ? "Calculating..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Volumes() {
  const { data: volumes = [] } = useListVolumes({});
  const { data: projects = [] } = useListProjects();
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const methodLabels: Record<string, string> = {
    tin: "TIN",
    grid: "Grid",
    cross_section: "Cross Section",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Volume Calculations</h1>
          <p className="text-muted-foreground text-sm mt-1">{volumes.length} calculation{volumes.length !== 1 ? "s" : ""} registered</p>
        </div>
        <NewVolumeDialog />
      </div>

      {volumes.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Box className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No volume calculations yet</p>
        </div>
      )}

      <motion.div initial="hidden" animate="show" variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {volumes.map((vol) => (
          <motion.div key={vol.id} variants={item}
            className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-sm">{vol.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{projectMap[vol.projectId] ?? `Project ${vol.projectId}`}</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded uppercase">
                {methodLabels[vol.method]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                  <ArrowDown className="h-3 w-3" />
                  <span className="text-[10px] font-mono uppercase">Excavated</span>
                </div>
                <p className="text-lg font-bold font-mono">{(vol.excavatedVolume / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-muted-foreground">m³</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                  <ArrowUp className="h-3 w-3" />
                  <span className="text-[10px] font-mono uppercase">Fill</span>
                </div>
                <p className="text-lg font-bold font-mono">{(vol.fillVolume / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-muted-foreground">m³</p>
              </div>
              <div className="text-center border-l border-border">
                <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Net</p>
                <p className="text-lg font-bold font-mono text-primary">{(vol.netVolume / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-muted-foreground">m³</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-3">
              {new Date(vol.calculatedAt).toLocaleDateString("pt-BR")}
              {vol.notes && <span> · {vol.notes}</span>}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
