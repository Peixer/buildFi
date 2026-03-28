import { hashProjectId } from "@/lib/project-hero-images";

/** NYC metro bounding box for deterministic placeholder pins (no on-chain geo yet). */
const SW = { lat: 40.65, lng: -74.05 };
const NE = { lat: 40.82, lng: -73.85 };

/**
 * Stable pseudo-coordinates per project id. Replace with real lat/lng metadata when available.
 */
export function latLngForProjectId(id: string): { lat: number; lng: number } {
  const h = hashProjectId(id);
  const h2 = hashProjectId(`${id}:map-lng`);
  const latT = (h % 10_000) / 10_000;
  const lngT = (h2 % 10_000) / 10_000;
  return {
    lat: SW.lat + latT * (NE.lat - SW.lat),
    lng: SW.lng + lngT * (NE.lng - SW.lng),
  };
}

/** ROI-style label for map pins (deterministic, matches hero hash family). */
export function pinLabelForProjectId(id: string): string {
  const h = hashProjectId(`${id}:pin`);
  const pct = 10 + (h % 900) / 100;
  return `${pct.toFixed(1)}%`;
}

export function isPrimaryPinStyle(id: string): boolean {
  return hashProjectId(`${id}:pin-style`) % 4 === 0;
}
