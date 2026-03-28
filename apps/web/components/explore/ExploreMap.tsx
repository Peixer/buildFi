"use client";

import {
  APIProvider,
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef } from "react";
import type { Project } from "@/lib/types";
import {
  isPrimaryPinStyle,
  latLngForProjectId,
  pinLabelForProjectId,
} from "@/lib/project-map";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
const DEFAULT_ZOOM = 11;

/** SVG data-URL pins when Map ID is unset (classic markers; no Advanced Marker / mapId required). */
function legacyPillIcon(
  label: string,
  primary: boolean,
  selected: boolean
): google.maps.Icon {
  const w = Math.min(120, Math.max(52, 10 + label.length * 9));
  const h = 30;
  const bg = primary ? "%23003345" : "%23ffffff";
  const fg = primary ? "%23ffffff" : "%23003345";
  const stroke = selected ? "%2314696d" : "%23c0c7cd";
  const sw = selected ? 2 : 1;
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" rx="${h / 2}" fill="${bg}" stroke="${stroke}" stroke-width="${sw}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${fg}" font-family="system-ui,sans-serif" font-size="12" font-weight="700">${safe}</text></svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return {
    url,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h),
  };
}

function MapBoundsFitter({ projects }: { projects: Project[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || projects.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const p of projects) {
      bounds.extend(latLngForProjectId(p.id));
    }
    map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
  }, [map, projects]);

  return null;
}

function LegacyMarkers({
  projects,
  selectedProjectId,
  onMarkerClick,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onMarkerClick: (projectId: string) => void;
}) {
  const map = useMap();
  if (!map) return null;

  return (
    <>
      {projects.map((p) => {
        const pos = latLngForProjectId(p.id);
        const label = pinLabelForProjectId(p.id);
        const selected = selectedProjectId === p.id;
        const primary = selected || isPrimaryPinStyle(p.id);
        return (
          <Marker
            key={p.id}
            position={pos}
            zIndex={selected ? 1000 : undefined}
            icon={legacyPillIcon(label, primary, selected)}
            onClick={() => onMarkerClick(p.id)}
          />
        );
      })}
    </>
  );
}

function MapChrome() {
  const map = useMap();
  const isSatelliteRef = useRef(false);

  const zoomBy = useCallback(
    (delta: number) => {
      if (!map) return;
      const z = map.getZoom() ?? DEFAULT_ZOOM;
      map.setZoom(Math.min(20, Math.max(3, z + delta)));
    },
    [map]
  );

  const toggleLayers = useCallback(() => {
    if (!map) return;
    isSatelliteRef.current = !isSatelliteRef.current;
    map.setMapTypeId(
      isSatelliteRef.current
        ? google.maps.MapTypeId.HYBRID
        : google.maps.MapTypeId.ROADMAP
    );
  }, [map]);

  return (
    <>
      <div className="pointer-events-auto absolute bottom-10 right-10 z-10 flex flex-col overflow-hidden rounded-lg border border-outline-variant/80 bg-white shadow-xl">
        <button
          type="button"
          aria-label="Zoom in"
          className="border-outline-variant/30 border-b p-3 text-on-surface transition-colors hover:bg-surface-container-low"
          onClick={() => zoomBy(1)}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className="p-3 text-on-surface transition-colors hover:bg-surface-container-low"
          onClick={() => zoomBy(-1)}
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
      <button
        type="button"
        className="pointer-events-auto absolute bottom-10 left-10 z-10 flex items-center gap-2 rounded-full border border-outline-variant/80 bg-white px-4 py-2.5 text-sm font-bold text-on-surface shadow-xl transition-colors hover:bg-surface-container-low"
        onClick={toggleLayers}
      >
        <span className="material-symbols-outlined text-lg">layers</span>
        Map layers
      </button>
    </>
  );
}

function ExploreMapInner({
  projects,
  selectedProjectId,
  onMarkerClick,
  useAdvancedMarkers,
  mapId,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onMarkerClick: (projectId: string) => void;
  useAdvancedMarkers: boolean;
  mapId: string;
}) {
  return (
    <div className="relative h-full min-h-[280px] w-full md:min-h-0">
      <Map
        className="h-full w-full"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        disableDefaultUI
        gestureHandling="greedy"
        mapTypeId="roadmap"
        {...(useAdvancedMarkers ? { mapId } : {})}
      >
        <MapBoundsFitter projects={projects} />
        {useAdvancedMarkers
          ? projects.map((p) => {
              const pos = latLngForProjectId(p.id);
              const label = pinLabelForProjectId(p.id);
              const selected = selectedProjectId === p.id;
              const primary = selected || isPrimaryPinStyle(p.id);
              return (
                <AdvancedMarker
                  key={p.id}
                  position={pos}
                  zIndex={selected ? 1000 : undefined}
                  anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}
                  onClick={() => onMarkerClick(p.id)}
                >
                  <div
                    className={[
                      "font-headline flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold shadow-[0_4px_12px_rgba(0,51,69,0.25)] transition-transform hover:scale-110",
                      primary
                        ? "bg-primary text-white"
                        : "border-outline-variant text-primary border bg-white",
                      selected ? "ring-secondary ring-2 ring-offset-2" : "",
                    ].join(" ")}
                  >
                    {label}
                  </div>
                </AdvancedMarker>
              );
            })
          : null}
        {!useAdvancedMarkers ? (
          <LegacyMarkers
            projects={projects}
            selectedProjectId={selectedProjectId}
            onMarkerClick={onMarkerClick}
          />
        ) : null}
        <MapChrome />
      </Map>
      <div
        className="map-gradient pointer-events-none absolute inset-0 z-1"
        aria-hidden
      />
    </div>
  );
}

export function ExploreMap({
  projects,
  selectedProjectId,
  onMarkerClick,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onMarkerClick: (projectId: string) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ?? "";
  const useAdvancedMarkers = Boolean(mapId);

  if (!apiKey) {
    return (
      <div className="bg-surface-container-low flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center md:min-h-0">
        <span className="material-symbols-outlined text-outline-variant text-4xl">
          map
        </span>
        <p className="text-on-surface-variant max-w-sm text-sm">
          Add{" "}
          <code className="text-primary font-mono text-xs">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          to your environment to load the map. Enable the Maps JavaScript API for
          your Google Cloud project.
        </p>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={useAdvancedMarkers ? ["marker"] : []}
    >
      <ExploreMapInner
        projects={projects}
        selectedProjectId={selectedProjectId}
        onMarkerClick={onMarkerClick}
        useAdvancedMarkers={useAdvancedMarkers}
        mapId={mapId}
      />
    </APIProvider>
  );
}
