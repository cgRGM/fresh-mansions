import {
  Outlet,
  createFileRoute,
  getRouteApi,
  redirect,
} from "@tanstack/react-router";

import { SuperUserViewSwitcher } from "@/components/super-user-view-switcher";
import { getUser } from "@/functions/get-user";

const contractorRouteApi = getRouteApi("/contractor");

const ContractorLayout = () => {
  const { session } = contractorRouteApi.useRouteContext();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-green-700">FreshMansions</h1>
            <SuperUserViewSwitcher className="mt-2" session={session} />
          </div>
          <span className="text-sm text-gray-600">{session.user.name}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export const Route = createFileRoute("/contractor")({
  beforeLoad: async () => {
    const session = await getUser();

    if (!session) {
      throw redirect({ to: "/" });
    }

    if (!["contractor", "super_user"].includes(session.appUser.role)) {
      throw redirect({ to: "/app/dashboard" });
    }

    return { session };
  },
  component: ContractorLayout,
});
