import { Button } from "@fresh-mansions/ui/components/button";
import {
  createFileRoute,
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
  User,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

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
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/quotes", icon: FileText, label: "Quotes" },
  { href: "/app/properties", icon: Home, label: "Properties" },
  { href: "/app/profile", icon: User, label: "Profile" },
] as const;

const AppLayout = () => {
  const { data: session } = authClient.useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userName = session?.user?.name ?? "User";

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
    <div className="flex h-screen flex-col bg-[#ece9e1] md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-3 text-white md:hidden">
        <button
          aria-label="Toggle menu"
          className="rounded-full p-2 hover:bg-white/10"
          onClick={toggleSidebar}
          type="button"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        <span className="text-lg font-semibold tracking-[-0.04em]">
          FreshMansions
        </span>
        <div className="w-9" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/30"
            onClick={closeSidebar}
            type="button"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-black text-white shadow-lg">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/10 px-4 py-4">
                <span className="text-lg font-semibold tracking-[-0.04em]">
                  FreshMansions
                </span>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-white/72 hover:bg-white/8"
                    activeProps={{
                      className: "bg-[#d6f18b] text-black font-medium",
                    }}
                    onClick={closeSidebar}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-72 flex-shrink-0 bg-black text-white md:flex md:flex-col">
        <div className="border-b border-white/10 px-6 py-5">
          <span className="text-xl font-semibold tracking-[-0.06em]">
            FreshMansions
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-white/72 hover:bg-white/8"
              activeProps={{
                className: "bg-[#d6f18b] text-black font-medium",
              }}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-sm font-medium text-[#d6f18b]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[140px] truncate text-sm font-medium text-white/80">
                {userName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
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
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black text-white md:hidden">
        <div className="flex items-center justify-around py-2">
          {mobileLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex flex-col items-center gap-1 px-3 py-1 text-white/42"
              activeProps={{ className: "text-[#d6f18b]" }}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-xs">{link.label}</span>
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
