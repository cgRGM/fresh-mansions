import { createFileRoute, Outlet } from "@tanstack/react-router";

const GetQuoteLayout = () => (
  <div className="min-h-svh bg-[#0b0b0b] bg-[radial-gradient(circle_at_top_left,_rgba(121,166,59,0.18),_transparent_22%),radial-gradient(circle_at_70%_20%,_rgba(255,255,255,0.08),_transparent_18%)]">
    <Outlet />
  </div>
);

export const Route = createFileRoute("/get-quote")({
  component: GetQuoteLayout,
});
