import {
  createFileRoute,
  getRouteApi,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import {
  FileText,
  HardHat,
  Home,
  LayoutDashboard,
  Menu,
  Sprout,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { getUser } from "@/functions/get-user";

const navItems = [
  { href: "/admin/quotes", icon: FileText, label: "Quotes" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/properties", icon: Home, label: "Properties" },
  { href: "/admin/work-orders", icon: Wrench, label: "Work Orders" },
  { href: "/admin/routes", icon: LayoutDashboard, label: "Routes" },
  { href: "/admin/billing", icon: FileText, label: "Billing" },
  { href: "/admin/contractors", icon: HardHat, label: "Contractors" },
];

const adminRouteApi = getRouteApi("/admin");

const AdminLayout = () => {
  const { session } = adminRouteApi.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((current) => !current);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#f4f2ec] md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-[#0a1a10] px-4 py-3 text-white md:hidden">
        <button
          aria-label="Toggle menu"
          className="rounded-xl p-2 transition-colors hover:bg-white/10"
          onClick={toggleSidebar}
          type="button"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-[#d6f18b]" />
          <span className="text-lg font-bold tracking-[-0.04em]">
            FM Admin
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSidebar}
            type="button"
          />
          <div className="animate-fade-in fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0a1a10] to-[#0f0f0f] text-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/8 px-5 py-5">
                <div className="flex items-center gap-2.5">
                  <Sprout className="h-5 w-5 text-[#d6f18b]" />
                  <span className="text-lg font-bold tracking-[-0.04em]">
                    FreshMansions Admin
                  </span>
                </div>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-all hover:bg-white/8 hover:text-white"
                    activeProps={{
                      className:
                        "bg-[#d6f18b]/15 text-[#d6f18b] hover:bg-[#d6f18b]/15 hover:text-[#d6f18b]",
                    }}
                    onClick={closeSidebar}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-white/8 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d6f18b]/15 text-xs font-semibold text-[#d6f18b]">
                    {(session.user.email ?? "A").charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[180px] truncate text-sm text-white/60">
                    {session.user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-[272px] flex-shrink-0 bg-gradient-to-b from-[#0a1a10] to-[#0f0f0f] text-white md:flex md:flex-col">
        <div className="border-b border-white/8 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Sprout className="h-5 w-5 text-[#d6f18b]" />
            <span className="text-xl font-bold tracking-[-0.05em]">
              FM Admin
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-all hover:bg-white/8 hover:text-white"
              activeProps={{
                className:
                  "bg-[#d6f18b]/15 text-[#d6f18b] hover:bg-[#d6f18b]/15 hover:text-[#d6f18b]",
              }}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6f18b]/15 text-sm font-semibold text-[#d6f18b]">
              {(session.user.email ?? "A").charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[160px] truncate text-sm text-white/60">
              {session.user.email}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getUser();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    if (!["admin", "super_user"].includes(session.appUser.role)) {
      throw redirect({ to: "/app" });
    }

    return { session };
  },
  component: AdminLayout,
});
