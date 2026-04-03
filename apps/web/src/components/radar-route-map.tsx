import { env } from "@fresh-mansions/env/web";
import { useEffect, useRef, useState } from "react";

type MapMarker = {
  address: string;
  color?: string;
  id: string;
  label?: string;
  latitude: number;
  longitude: number;
};

type RadarRouteMapProps = {
  readonly className?: string;
  readonly markers: MapMarker[];
  readonly onMarkerClick?: (marker: MapMarker) => void;
  readonly selectedMarkerId?: null | string;
  readonly style?: "radar-dark-v1" | "radar-default-v1" | "radar-light-v1";
};

const DEFAULT_CENTER: [number, number] = [-79.4428, 38.4496];
const DEFAULT_ZOOM = 11;

const RadarRouteMap = ({
  className = "",
  markers,
  onMarkerClick,
  selectedMarkerId,
  style = "radar-default-v1",
}: RadarRouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const radarKey = env.VITE_RADAR_PUBLISHABLE_KEY;

    if (!radarKey || !containerRef.current) {
      if (!radarKey) {
        setError("Radar API key not configured");
      }
      return;
    }

    let cancelled = false;

    const initMap = async () => {
      try {
        const { default: Radar } = await import("radar-sdk-js");

        if (cancelled) {
          return;
        }

        try {
          const { createMapsPlugin } = await import("@radarlabs/plugin-maps");
          Radar.registerPlugin(createMapsPlugin());
        } catch {
          // Maps plugin may already be registered
        }

        Radar.initialize(radarKey);

        const center =
          markers.length > 0
            ? ([markers[0].longitude, markers[0].latitude] as [number, number])
            : DEFAULT_CENTER;

        const map = Radar.ui.map({
          center,
          container: containerRef.current!,
          style,
          zoom: DEFAULT_ZOOM,
        });

        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) {
            return;
          }

          for (const m of markers) {
            const isSelected = m.id === selectedMarkerId;
            const marker = Radar.ui
              .marker({
                color: isSelected ? "#d6f18b" : (m.color ?? "#0a1a10"),
                popup: {
                  text: `${m.label ?? "Stop"}\n${m.address}`,
                },
              })
              .setLngLat([m.longitude, m.latitude])
              .addTo(map);

            if (onMarkerClick) {
              const el = (
                marker as { getElement?: () => HTMLElement }
              ).getElement?.();
              if (el) {
                el.style.cursor = "pointer";
                el.addEventListener("click", () => {
                  onMarkerClick(m);
                });
              }
            }

            markersRef.current.push(marker);
          }

          if (markers.length > 1) {
            map.fitToMarkers({ maxZoom: 15, padding: 60 });
          }

          setIsLoaded(true);
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load map");
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, [markers, onMarkerClick, selectedMarkerId, style]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-black/8 bg-[#f4f2ec] p-8 ${className}`}
      >
        <div className="text-center">
          <p className="text-sm font-medium text-black/50">Map unavailable</p>
          <p className="mt-1 text-xs text-black/30">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f4f2ec]">
          <div className="animate-shimmer h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export { RadarRouteMap };
export type { MapMarker };
