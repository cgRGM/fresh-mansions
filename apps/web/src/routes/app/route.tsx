import { Button } from "@fresh-mansions/ui/components/button";
import {
  createFileRoute,
  getRouteApi,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import {
  Briefcase,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Sprout,
  User,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { SuperUserViewSwitcher } from "@/components/super-user-view-switcher";
import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";

const sidebarLinks = [
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/quotes", icon: FileText, label: "Quotes" },
  { href: "/app/properties", icon: Home, label: "Properties" },
  { href: "/app/orders", icon: Briefcase, label: "Orders" },
  { href: "/app/payments", icon: CreditCard, label: "Payments" },
  { href: "/app/profile", icon: User, label: "Profile" },
] as const;

const mobileLinks = [
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/app/quotes", icon: FileText, label: "Quotes" },
  { href: "/app/properties", icon: Home, label: "Properties" },
  { href: "/app/orders", icon: Briefcase, label: "Orders" },
  { href: "/app/profile", icon: User, label: "Profile" },
] as const;

const appRouteApi = getRouteApi("/app");

const AppLayout = () => {
  const { data: session } = authClient.useSession();
  const routeContext = appRouteApi.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userName = session?.user?.name ?? "User";
  const appSession = routeContext.user;

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    window.location.href = "/login";
  }, []);

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
            FreshMansions
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
                    FreshMansions
                  </span>
                </div>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/60 transition-all hover:bg-white/8 hover:text-white"
                    activeProps={{
                      className:
                        "bg-[#d6f18b]/15 text-[#d6f18b] hover:bg-[#d6f18b]/15 hover:text-[#d6f18b]",
                    }}
                    onClick={closeSidebar}
                  >
                    <link.icon className="h-[18px] w-[18px]" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-white/8 p-4">
                <SuperUserViewSwitcher
                  className="mb-3 rounded-2xl border border-white/10 p-3 text-white"
                  session={appSession}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6f18b]/15 text-sm font-semibold text-[#d6f18b]">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[140px] truncate text-sm font-medium text-white/70">
                      {userName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/40 hover:bg-white/8 hover:text-white"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
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
              FreshMansions
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-all hover:bg-white/8 hover:text-white"
              activeProps={{
                className:
                  "bg-[#d6f18b]/15 text-[#d6f18b] hover:bg-[#d6f18b]/15 hover:text-[#d6f18b]",
              }}
            >
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/8 p-4">
          <SuperUserViewSwitcher
            className="mb-3 rounded-2xl border border-white/10 p-3 text-white"
            session={appSession}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d6f18b]/15 text-sm font-semibold text-[#d6f18b]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[140px] truncate text-sm font-medium text-white/70">
                {userName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/40 hover:bg-white/8 hover:text-white"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/8 bg-[#0a1a10]/95 backdrop-blur-lg text-white md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)] pt-1">
          {mobileLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex flex-col items-center gap-0.5 px-2 py-2 text-white/35 transition-colors"
              activeProps={{ className: "text-[#d6f18b]" }}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({ to: "/login" });
    }

    if (session.appUser.role === "admin") {
      throw redirect({ to: "/admin/quotes" });
    }

    if (session.appUser.role === "contractor") {
      throw redirect({ to: "/contractor" });
    }

    return { user: session };
  },
  component: AppLayout,
});
