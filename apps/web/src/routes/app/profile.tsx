import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Mail, Sprout, User } from "lucide-react";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-full bg-[#f4f2ec] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5 stagger-children">
        {/* Header */}
        <div className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-black sm:text-3xl">
            Your profile
          </h1>
        </div>

        {/* Profile card */}
        <div className="relative overflow-hidden rounded-3xl border border-black/6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {/* Decorative header band */}
          <div className="relative h-28 bg-gradient-to-br from-[#0a1a10] via-[#132b1a] to-[#0f0f0f]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_oklch(0.6_0.15_140_/_0.15),_transparent_60%)]" />
            <div className="absolute bottom-3 right-4">
              <Sprout className="h-5 w-5 text-[#d6f18b]/30" />
            </div>
          </div>

          {/* Avatar */}
          <div className="relative px-6">
            <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#d6f18b] text-2xl font-bold text-[#0a1a10] shadow-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Info */}
          <div className="px-6 pb-6 pt-4">
            <h2 className="text-xl font-bold tracking-[-0.03em] text-black">
              {userName}
            </h2>
            <p className="mt-0.5 text-sm text-black/45">Customer account</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#f9f8f5] px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                  <User className="h-4 w-4 text-black/40" />
                </div>
                <div>
                  <p className="text-xs font-medium text-black/35">Name</p>
                  <p className="text-sm font-medium text-black">{userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#f9f8f5] px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                  <Mail className="h-4 w-4 text-black/40" />
                </div>
                <div>
                  <p className="text-xs font-medium text-black/35">Email</p>
                  <p className="text-sm font-medium text-black">{userEmail}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-black/6 pt-6">
              <button
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
