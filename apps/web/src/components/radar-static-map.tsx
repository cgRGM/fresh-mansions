import { env } from "@fresh-mansions/env/web";

interface StaticMapMarker {
  color?: string;
  latitude: number;
  longitude: number;
}

interface StaticMapPath {
  borderColor?: string;
  borderWidth?: number;
  color?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  width?: number;
}

interface RadarStaticMapProps {
  readonly className?: string;
  readonly height?: number;
  readonly mapStyle?: "radar-dark-v1" | "radar-default-v1" | "radar-light-v1";
  readonly markers: StaticMapMarker[];
  readonly paths?: StaticMapPath[];
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

const normalizePathColor = (value: string): string =>
  normalizeMarkerColor(value);

const RadarStaticMap = ({
  className = "",
  height = 400,
  mapStyle = "radar-default-v1",
  markers,
  paths = [],
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

  const validPaths = paths.filter((path) => path.coordinates.length >= 2);

  if (!radarKey || (markers.length === 0 && validPaths.length === 0)) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-black/8 bg-[#f4f2ec] ${className}`}
        style={{ height, width: "100%" }}
      >
        <p className="text-sm text-black/40">
          {radarKey ? "No route geometry to display" : "Map not configured"}
        </p>
      </div>
    );
  }

  const searchParams = new URLSearchParams();

  for (const marker of markers) {
    const color = normalizeMarkerColor(marker.color ?? "0x0a1a10");
    searchParams.append(
      "markers",
      `color:${color}|${String(marker.latitude)},${String(marker.longitude)}`
    );
  }

  for (const path of validPaths) {
    const stroke = normalizePathColor(path.color ?? "0x0a1a10");
    const borderColor = normalizePathColor(path.borderColor ?? "0xffffff");
    const widthValue = Math.max(1, Math.floor(path.width ?? 3));
    const borderWidthValue = Math.max(0, Math.floor(path.borderWidth ?? 2));
    const pathCoordinates = path.coordinates
      .map(
        (coordinate) =>
          `${String(coordinate.latitude)},${String(coordinate.longitude)}`
      )
      .join("|");

    searchParams.append(
      "path",
      `stroke:${stroke}|width:${String(widthValue)}|border:${borderColor}|borderWidth:${String(borderWidthValue)}|${pathCoordinates}`
    );
  }

  searchParams.set("width", String(safeWidth));
  searchParams.set("height", String(safeHeight));
  searchParams.set("scale", String(RADAR_STATIC_MAP_SCALE));
  searchParams.set("style", mapStyle);
  searchParams.set("publishableKey", radarKey);

  const url = `https://api.radar.io/maps/static?${searchParams.toString()}`;

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
export type { StaticMapPath };
