import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/contractor")({
  beforeLoad: async () => {
    const session = await getUser();

    if (!session) {
      throw redirect({ to: "/" });
    }

    if (session.appUser.role !== "contractor") {
      throw redirect({ to: "/app/dashboard" });
    }

    return { session };
  },
  component: ContractorLayout,
});

function ContractorLayout() {
  const { session } = Route.useRouteContext();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-lg font-bold text-green-700">FreshMansions</h1>
          <span className="text-sm text-gray-600">{session.user.name}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
