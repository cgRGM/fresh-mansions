import { env } from "@fresh-mansions/env/web";

type StaticMapMarker = {
  color?: string;
  latitude: number;
  longitude: number;
};

type RadarStaticMapProps = {
  readonly className?: string;
  readonly height?: number;
  readonly markers: StaticMapMarker[];
  readonly style?: "radar-dark-v1" | "radar-default-v1" | "radar-light-v1";
  readonly width?: number;
};

const RadarStaticMap = ({
  className = "",
  height = 400,
  markers,
  style = "radar-default-v1",
  width = 800,
}: RadarStaticMapProps) => {
  const radarKey = env.VITE_RADAR_PUBLISHABLE_KEY;

  if (!radarKey || markers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-black/8 bg-[#f4f2ec] ${className}`}
        style={{ height, width: "100%" }}
      >
        <p className="text-sm text-black/40">
          {!radarKey ? "Map not configured" : "No locations to display"}
        </p>
      </div>
    );
  }

  const markerParams = markers
    .map((m) => {
      const color = m.color ?? "0x0a1a10";
      const hexColor = color.startsWith("#")
        ? `0x${color.slice(1)}`
        : color.startsWith("0x")
          ? color
          : `0x${color}`;
      return `markers=color:${hexColor}|${String(m.latitude)},${String(m.longitude)}`;
    })
    .join("&");

  const url = `https://api.radar.io/maps/static?${markerParams}&width=${String(width)}&height=${String(height)}&scale=2&style=${style}&publishableKey=${radarKey}`;

  return (
    <img
      alt="Route map"
      className={`w-full rounded-2xl border border-black/8 object-cover ${className}`}
      height={height}
      loading="lazy"
      src={url}
      width={width}
    />
  );
};

export { RadarStaticMap };
