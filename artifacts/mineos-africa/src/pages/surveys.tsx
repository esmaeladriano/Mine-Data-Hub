import { useState } from "react";
import { useListSurveys, useCreateSurvey, useDeleteSurvey, useListProjects } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Mountain, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const fileTypeColors: Record<string, string> = {
  dwg: "bg-orange-900/30 text-orange-400 border-orange-800/30",
  dxf: "bg-orange-900/20 text-orange-300 border-orange-800/20",
  shp: "bg-blue-900/30 text-blue-400 border-blue-800/30",
  csv: "bg-green-900/30 text-green-400 border-green-800/30",
  orthomosaic: "bg-purple-900/30 text-purple-400 border-purple-800/30",
  point_cloud: "bg-cyan-900/30 text-cyan-400 border-cyan-800/30",
  dem: "bg-yellow-900/30 text-yellow-400 border-yellow-800/30",
  geotiff: "bg-pink-900/30 text-pink-400 border-pink-800/30",
};

const statusIcons = {
  completed: <CheckCircle className="h-3.5 w-3.5 text-green-400" />,
  processing: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  error: <XCircle className="h-3.5 w-3.5 text-red-400" />,
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function NewSurveyDialog() {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useListProjects();
  const [form, setForm] = useState({
    projectId: "",
    name: "",
    surveyDate: new Date().toISOString().split("T")[0],
    fileType: "dem" as const,
    fileName: "",
    surveyMethod: "drone" as const,
    notes: "",
    status: "completed" as const,
  });
  const qc = useQueryClient();
  const createSurvey = useCreateSurvey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSurvey.mutateAsync({
      data: {
        projectId: parseInt(form.projectId),
        name: form.name,
        surveyDate: new Date(form.surveyDate).toISOString(),
        fileType: form.fileType,
        fileName: form.fileName || null,
        surveyMethod: form.surveyMethod,
        notes: form.notes || null,
        status: form.status,
      },
    });
    qc.invalidateQueries({ queryKey: ["/api/surveys"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-mono text-xs"><Plus className="h-4 w-4" />New Survey</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-mono">Register Survey</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Project *</Label>
            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Survey Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Survey Date *</Label>
              <Input type="date" value={form.surveyDate} onChange={(e) => setForm({ ...form, surveyDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">File Type *</Label>
              <Select value={form.fileType} onValueChange={(v) => setForm({ ...form, fileType: v as typeof form.fileType })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["dwg", "dxf", "shp", "csv", "orthomosaic", "point_cloud", "dem", "geotiff"].map((t) => (
                    <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Survey Method *</Label>
              <Select value={form.surveyMethod} onValueChange={(v) => setForm({ ...form, surveyMethod: v as typeof form.surveyMethod })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="drone">Drone</SelectItem>
                  <SelectItem value="gps">GPS</SelectItem>
                  <SelectItem value="total_station">Total Station</SelectItem>
                  <SelectItem value="lidar">LiDAR</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">File Name</Label>
            <Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} className="mt-1" placeholder="survey_file.tif" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createSurvey.isPending || !form.projectId}>
              {createSurvey.isPending ? "Saving..." : "Save Survey"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Surveys() {
  const [search, setSearch] = useState("");
  const { data: surveys = [] } = useListSurveys({});
  const { data: projects = [] } = useListProjects();
  const qc = useQueryClient();
  const deleteSurvey = useDeleteSurvey();

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const filtered = surveys.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (projectMap[s.projectId] ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm("Delete this survey?")) {
      await deleteSurvey.mutateAsync({ id });
      qc.invalidateQueries({ queryKey: ["/api/surveys"] });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Topographic Surveys</h1>
          <p className="text-muted-foreground text-sm mt-1">{surveys.length} survey{surveys.length !== 1 ? "s" : ""} registered</p>
        </div>
        <NewSurveyDialog />
      </div>

      <div className="mb-5">
        <Input placeholder="Search surveys..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <motion.div initial="hidden" animate="show" variants={container} className="space-y-2">
        {filtered.map((survey) => (
          <motion.div key={survey.id} variants={item}
            className="group bg-card border border-border rounded-lg px-5 py-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Mountain className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{survey.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {projectMap[survey.projectId] ?? `Project ${survey.projectId}`} · {survey.surveyMethod.replace("_", " ")} · {new Date(survey.surveyDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${fileTypeColors[survey.fileType] ?? "bg-muted text-muted-foreground border-border"}`}>
                {survey.fileType}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {statusIcons[survey.status]}
                <span className="hidden sm:inline capitalize">{survey.status}</span>
              </div>
              <button onClick={() => handleDelete(survey.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Mountain className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No surveys found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
