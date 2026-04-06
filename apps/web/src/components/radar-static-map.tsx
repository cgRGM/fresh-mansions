import { env } from "@fresh-mansions/env/web";

interface StaticMapMarker {
  color?: string;
  latitude: number;
  longitude: number;
}

interface RadarStaticMapProps {
  readonly className?: string;
  readonly height?: number;
  readonly mapStyle?: "radar-dark-v1" | "radar-default-v1" | "radar-light-v1";
  readonly markers: StaticMapMarker[];
  readonly width?: number;
}

const RADAR_STATIC_MAP_MAX_DIMENSION = 2048;
const RADAR_STATIC_MAP_MIN_DIMENSION = 100;
const RADAR_STATIC_MAP_SCALE = 2;

const normalizeMarkerColor = (value: string): string => {
  if (value.startsWith("#")) {
    return `0x${value.slice(1)}`;
  }

  if (value.startsWith("0x")) {
    return value;
  }

  return `0x${value}`;
};

const RadarStaticMap = ({
  className = "",
  height = 400,
  mapStyle = "radar-default-v1",
  markers,
  width = 800,
}: RadarStaticMapProps) => {
  const radarKey = env.VITE_RADAR_PUBLISHABLE_KEY;
  const maxRequestedDimension = Math.floor(
    RADAR_STATIC_MAP_MAX_DIMENSION / RADAR_STATIC_MAP_SCALE
  );
  const safeHeight = Math.min(
    Math.max(height, RADAR_STATIC_MAP_MIN_DIMENSION),
    maxRequestedDimension
  );
  const safeWidth = Math.min(
    Math.max(width, RADAR_STATIC_MAP_MIN_DIMENSION),
    maxRequestedDimension
  );

  if (!radarKey || markers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-black/8 bg-[#f4f2ec] ${className}`}
        style={{ height, width: "100%" }}
      >
        <p className="text-sm text-black/40">
          {radarKey ? "No locations to display" : "Map not configured"}
        </p>
      </div>
    );
  }

  const markerParams = markers
    .map((m) => {
      const hexColor = normalizeMarkerColor(m.color ?? "0x0a1a10");
      return `markers=color:${hexColor}|${String(m.latitude)},${String(m.longitude)}`;
    })
    .join("&");

  const url = `https://api.radar.io/maps/static?${markerParams}&width=${String(safeWidth)}&height=${String(safeHeight)}&scale=${String(RADAR_STATIC_MAP_SCALE)}&style=${mapStyle}&publishableKey=${radarKey}`;

  return (
    <img
      alt="Route map"
      className={`w-full rounded-2xl border border-black/8 object-cover ${className}`}
      height={safeHeight}
      loading="lazy"
      src={url}
      width={safeWidth}
    />
  );
};

export { RadarStaticMap };
