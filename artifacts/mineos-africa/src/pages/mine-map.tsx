import { useEffect, useRef } from "react";
import { useListProjects, useListAlerts } from "@workspace/api-client-react";
import { Map as MapIcon } from "lucide-react";

export default function MineMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const { data: projects } = useListProjects();
  const { data: alerts } = useListAlerts({});

  const projectsAny = projects as unknown as {
    data?: Array<{
      latitude: number | null;
      longitude: number | null;
      status: string;
      name: string;
      mineType: string;
      location?: string | null;
    }>;
  } | undefined;
  const alertsAny = alerts as unknown as {
    data?: Array<{
      status: string;
      latitude: number | null;
      longitude: number | null;
      title: string;
      severity: string;
      category: string;
    }>;
  } | undefined;

  const projectRows = Array.isArray(projects)
    ? projects
    : Array.isArray(projectsAny?.data)
      ? projectsAny.data
      : [];
  const alertRows = Array.isArray(alerts)
    ? alerts
    : Array.isArray(alertsAny?.data)
      ? alertsAny.data
      : [];

  useEffect(() => {
    const container = mapRef.current;
    if (!container || mapInstanceRef.current) return;

    let cancelled = false;

    let map: {
      remove(): void;
      setView(latlng: [number, number], zoom: number): void;
    };

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !container.isConnected || mapRef.current !== container) {
        return;
      }

      map = L.map(container, {
        center: [0, 20],
        zoom: 3,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map as unknown as L.Map);

      const activeIcon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;background:#F59E0B;border-radius:50%;border:2px solid rgba(245,158,11,0.4);box-shadow:0 0 8px rgba(245,158,11,0.5)"></div>`,
        iconAnchor: [6, 6],
      });
      const explorationIcon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;background:#60A5FA;border-radius:50%;border:2px solid rgba(96,165,250,0.4)"></div>`,
        iconAnchor: [6, 6],
      });
      const inactiveIcon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;background:#6B7280;border-radius:50%;border:2px solid rgba(107,114,128,0.4)"></div>`,
        iconAnchor: [5, 5],
      });

      const alertIcon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;background:#EF4444;border-radius:2px;border:2px solid rgba(239,68,68,0.4);box-shadow:0 0 6px rgba(239,68,68,0.6)"></div>`,
        iconAnchor: [5, 5],
      });

      for (const project of projectRows) {
        const lat = project.latitude;
        const lng = project.longitude;
        if (!lat || !lng) continue;

        const icon = project.status === "active" ? activeIcon
          : project.status === "exploration" ? explorationIcon
          : inactiveIcon;

        const marker = L.marker([lat, lng], { icon });
        marker.addTo(map as unknown as L.Map);
        marker.bindPopup(`
          <div style="font-family:monospace;font-size:12px;color:#f9fafb;background:#0d0d12;padding:8px;border-radius:4px;min-width:160px">
            <strong style="color:#F59E0B">${project.name}</strong><br/>
            <span style="color:#9ca3af">${project.mineType.replace("_", " ")} · ${project.status}</span><br/>
            ${project.location ? `<span style="color:#6b7280">${project.location}</span>` : ""}
          </div>
        `);
      }

      for (const alert of alertRows.filter((a) => a.status === "active" && a.latitude && a.longitude)) {
        const lat = alert.latitude;
        const lng = alert.longitude;
        if (!lat || !lng) continue;
        const marker = L.marker([lat, lng], { icon: alertIcon });
        marker.addTo(map as unknown as L.Map);
        marker.bindPopup(`
          <div style="font-family:monospace;font-size:12px;color:#f9fafb;background:#0d0d12;padding:8px;border-radius:4px;min-width:160px">
            <strong style="color:#EF4444">ALERT: ${alert.title}</strong><br/>
            <span style="color:#9ca3af">${alert.severity.toUpperCase()} · ${alert.category.replace("_", " ")}</span>
          </div>
        `);
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [projectRows, alertRows]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight">Mine Map</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {projectRows.length} project{projectRows.length !== 1 ? "s" : ""} ·{" "}
            {alertRows.filter((a) => a.status === "active").length} active alerts
          </p>
        </div>
        <div className="flex gap-4 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Active Mine
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            Exploration
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-500" />
            Alert
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" style={{ background: "#0d0d12" }} />
      </div>
    </div>
  );
}
