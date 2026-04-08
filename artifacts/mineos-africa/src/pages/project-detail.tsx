import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import {
  useGetProject, useGetProjectSummary, useListSurveys, useListAlerts, useListVolumes, useListProductionRecords,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Layers, MapPin, AlertTriangle, Mountain, Box, TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
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

type Tab = "overview" | "surveys" | "volumes" | "alerts" | "production";

function MiniMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let map: { remove(): void };

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      map = L.map(mapRef.current!, { center: [lat, lng], zoom: 10, zoomControl: false, attributionControl: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map as unknown as L.Map);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:#F59E0B;border-radius:50%;border:3px solid rgba(245,158,11,0.5);box-shadow:0 0 10px rgba(245,158,11,0.6)"></div>`,
        iconAnchor: [7, 7],
      });
      L.marker([lat, lng], { icon }).addTo(map as unknown as L.Map).bindPopup(name).openPopup();
      mapInstanceRef.current = map;
    };
    initMap();
    return () => {
      if (map) { map.remove(); mapInstanceRef.current = null; }
    };
  }, [lat, lng, name]);

  return <div ref={mapRef} className="absolute inset-0 rounded-lg" />;
}

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const [tab, setTab] = useState<Tab>("overview");

  const projectQuery = useGetProject(id, { query: { enabled: !!id, queryKey: ["project", id] } });
  const { data: project } = projectQuery;
  const summaryQuery = useGetProjectSummary(id, { query: { enabled: !!id, queryKey: ["project-summary", id] } });
  const { data: summary } = summaryQuery;
  const { data: surveys = [] } = useListSurveys({ projectId: id });
  const { data: volumes = [] } = useListVolumes({ projectId: id });
  const { data: alerts = [] } = useListAlerts({ projectId: id });
  const { data: production = [] } = useListProductionRecords({ projectId: id });

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading project...
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "surveys", label: "Surveys", count: surveys.length },
    { key: "volumes", label: "Volumes", count: volumes.length },
    { key: "alerts", label: "Alerts", count: alerts.filter((a) => a.status === "active").length },
    { key: "production", label: "Production", count: production.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link href="/projects">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5 cursor-pointer w-fit">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">All Projects</span>
        </div>
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <Layers className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono tracking-tight">{project.name}</h1>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase ${statusColors[project.status]}`}>
                {project.status}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5">
                {mineTypeLabels[project.mineType]}
              </Badge>
            </div>
            {project.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {project.location}
              </div>
            )}
          </div>
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground ml-8">{project.description}</p>
        )}
      </motion.div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Surveys", value: summary.totalSurveys, icon: Mountain },
            { label: "Volume (m³)", value: `${(summary.totalVolumeExcavated / 1000).toFixed(1)}k`, icon: Box },
            { label: "Active Alerts", value: summary.activeAlerts, icon: AlertTriangle },
            { label: "Production", value: `${(summary.totalProduction / 1000).toFixed(1)}k`, icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-mono">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-5 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-mono relative transition-colors ${
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-[10px] px-1 py-0.5 bg-muted rounded font-mono">{t.count}</span>
            )}
            {tab === t.key && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div>
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4">Project Details</h3>
              <dl className="space-y-3">
                {[
                  { label: "Mine Type", value: mineTypeLabels[project.mineType] },
                  { label: "Status", value: project.status },
                  { label: "Location", value: project.location ?? "Not set" },
                  { label: "Area", value: project.area ? `${parseFloat(String(project.area)).toFixed(1)} ha` : "Not set" },
                  { label: "Coordinates", value: project.latitude && project.longitude ? `${project.latitude}, ${project.longitude}` : "Not set" },
                  { label: "Created", value: new Date(project.createdAt).toLocaleDateString("pt-BR") },
                ].map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground text-xs font-mono">{d.label}</dt>
                    <dd className="font-medium text-xs">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {project.latitude && project.longitude && (
              <div className="bg-card border border-border rounded-lg overflow-hidden relative h-64">
                <MiniMap lat={project.latitude} lng={project.longitude} name={project.name} />
              </div>
            )}
          </div>
        )}

        {tab === "surveys" && (
          <div className="space-y-2">
            {surveys.length === 0 && <p className="text-muted-foreground text-sm">No surveys for this project</p>}
            {surveys.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-lg px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.surveyMethod.replace("_", " ")} · {new Date(s.surveyDate).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded uppercase">{s.fileType}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "volumes" && (
          <div className="space-y-3">
            {volumes.length === 0 && <p className="text-muted-foreground text-sm">No volume calculations for this project</p>}
            {volumes.map((v) => (
              <div key={v.id} className="bg-card border border-border rounded-lg p-4">
                <p className="font-medium text-sm mb-2">{v.name}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono">Excavated</p>
                    <p className="font-bold font-mono">{(v.excavatedVolume / 1000).toFixed(1)}k m³</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono">Fill</p>
                    <p className="font-bold font-mono">{(v.fillVolume / 1000).toFixed(1)}k m³</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono">Net</p>
                    <p className="font-bold font-mono text-primary">{(v.netVolume / 1000).toFixed(1)}k m³</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "alerts" && (
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-muted-foreground text-sm">No alerts for this project</p>}
            {alerts.map((a) => (
              <div key={a.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${a.severity === "critical" ? "text-red-400" : a.severity === "high" ? "text-orange-400" : "text-yellow-400"}`} />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">{a.severity.toUpperCase()} · {a.status} · {new Date(a.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "production" && (
          <div className="space-y-2">
            {production.length === 0 && <p className="text-muted-foreground text-sm">No production records for this project</p>}
            {[...production].reverse().slice(0, 20).map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-lg px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.material}</p>
                  <p className="text-xs text-muted-foreground">{r.area ?? r.shift} · {new Date(r.recordDate).toLocaleDateString("pt-BR")}</p>
                </div>
                <p className="font-bold font-mono text-primary">{r.quantity.toLocaleString()} {r.unit}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
