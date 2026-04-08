import { useState } from "react";
import { useListProjects, useCreateProject, useDeleteProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Layers, MapPin, Trash2 } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const mineTypeLabels: Record<string, string> = {
  open_pit: "Open Pit",
  underground: "Underground",
  quarry: "Quarry",
  alluvial: "Alluvial",
};

const statusColors: Record<string, string> = {
  active: "bg-green-900/30 text-green-400 border-green-800/30",
  inactive: "bg-muted text-muted-foreground border-border",
  exploration: "bg-blue-900/30 text-blue-400 border-blue-800/30",
  closed: "bg-red-900/30 text-red-400 border-red-800/30",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", location: "", latitude: "", longitude: "",
    mineType: "open_pit" as const, status: "active" as const, area: "",
  });
  const qc = useQueryClient();
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({
      data: {
        name: form.name,
        description: form.description || null,
        location: form.location || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        mineType: form.mineType,
        status: form.status,
        area: form.area ? parseFloat(form.area) : null,
      },
    });
    qc.invalidateQueries({ queryKey: ["/api/projects"] });
    setOpen(false);
    setForm({ name: "", description: "", location: "", latitude: "", longitude: "", mineType: "open_pit", status: "active", area: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono text-xs">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">New Mine Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Project Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1" placeholder="Country, Region" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Latitude</Label>
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="mt-1" placeholder="-9.532" />
            </div>
            <div>
              <Label className="text-xs">Longitude</Label>
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="mt-1" placeholder="20.215" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mine Type *</Label>
              <Select value={form.mineType} onValueChange={(v) => setForm({ ...form, mineType: v as typeof form.mineType })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_pit">Open Pit</SelectItem>
                  <SelectItem value="underground">Underground</SelectItem>
                  <SelectItem value="quarry">Quarry</SelectItem>
                  <SelectItem value="alluvial">Alluvial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="exploration">Exploration</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Area (hectares)</Label>
            <Input type="number" step="any" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const [search, setSearch] = useState("");
  const { data: projects = [] } = useListProjects();
  const qc = useQueryClient();
  const deleteProject = useDeleteProject();

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this project? All associated data will be lost.")) {
      await deleteProject.mutateAsync({ id });
      qc.invalidateQueries({ queryKey: ["/api/projects"] });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Mine Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} registered</p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="mb-5">
        <Input
          placeholder="Search projects or locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <motion.div initial="hidden" animate="show" variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <motion.div key={project.id} variants={item}>
            <Link href={`/projects/${project.id}`}>
              <div className="group bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/40 transition-all hover:bg-card/80 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="font-semibold text-sm leading-tight">{project.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description ?? "No description"}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location ?? "Location not set"}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    {mineTypeLabels[project.mineType]}
                  </Badge>
                </div>
                {project.area && (
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">{parseFloat(String(project.area)).toFixed(1)} ha</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
