import {
  createFileRoute,
  getRouteApi,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  Home,
  Wrench,
  HardHat,
} from "lucide-react";

import { SuperUserViewSwitcher } from "@/components/super-user-view-switcher";
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

  return (
    <div className="flex h-screen bg-[#ece9e1]">
      <aside className="hidden w-72 flex-col bg-black text-white md:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <LayoutDashboard className="mr-2 h-5 w-5 text-[#d6f18b]" />
          <span className="text-lg font-semibold tracking-[-0.04em]">
            FreshMansions Admin
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center rounded-2xl px-3 py-3 text-sm font-medium text-white/72 hover:bg-white/8 hover:text-white"
              activeProps={{
                className: "bg-[#d6f18b] text-black",
              }}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-black/8 bg-white px-6">
          <h1 className="text-lg font-semibold md:hidden">
            FreshMansions Admin
          </h1>
          <div className="hidden md:block">
            <SuperUserViewSwitcher session={session} />
          </div>
          <div className="flex items-center gap-2 text-sm text-black/60">
            <span>{session.user.email}</span>
          </div>
        </header>

        <div className="border-b border-black/8 bg-white px-4 pb-2 pt-2 md:hidden">
          <div className="pb-2">
            <SuperUserViewSwitcher session={session} />
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-black/68 hover:bg-black/5"
                activeProps={{
                  className: "bg-black text-white",
                }}
              >
                <item.icon className="mr-1 h-3 w-3" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
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
