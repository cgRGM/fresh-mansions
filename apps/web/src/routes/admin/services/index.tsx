import { Badge } from "@fresh-mansions/ui/components/badge";
import { Button } from "@fresh-mansions/ui/components/button";
import { Input } from "@fresh-mansions/ui/components/input";
import { Label } from "@fresh-mansions/ui/components/label";
import { Textarea } from "@fresh-mansions/ui/components/textarea";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { GripVertical, Pencil, Plus, Settings, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { deleteService } from "@/functions/admin/delete-service";
import { listServices } from "@/functions/admin/list-services";
import { upsertService } from "@/functions/admin/upsert-service";

const routeApi = getRouteApi("/admin/services/");

type ServiceRecord = Awaited<ReturnType<typeof listServices>>[number];

const emptyForm = {
  description: "",
  id: "",
  isActive: true,
  name: "",
  slug: "",
  sortOrder: 0,
};

const AdminServicesPage = () => {
  const services = routeApi.useLoaderData();
  const [editingService, setEditingService] = useState<null | typeof emptyForm>(
    null
  );

  const handleEdit = useCallback((svc: ServiceRecord) => {
    setEditingService({
      description: svc.description ?? "",
      id: svc.id,
      isActive: svc.isActive,
      name: svc.name,
      slug: svc.slug,
      sortOrder: svc.sortOrder,
    });
  }, []);

  const handleNew = useCallback(() => {
    setEditingService({ ...emptyForm, sortOrder: services.length });
  }, [services.length]);

  const handleCancel = useCallback(() => {
    setEditingService(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!editingService) {
        return;
      }

      try {
        await upsertService({
          data: {
            description: editingService.description || undefined,
            id: editingService.id || undefined,
            isActive: editingService.isActive,
            name: editingService.name,
            slug: editingService.slug,
            sortOrder: editingService.sortOrder,
          },
        });
        toast.success(
          editingService.id ? "Service updated" : "Service created"
        );
        setEditingService(null);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save service"
        );
      }
    },
    [editingService]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteService({ data: { id } });
      toast.success("Service deleted");
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete service"
      );
    }
  }, []);

  return (
    <div className="stagger-children space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Configuration
            </p>
            <h1 className="text-xl font-bold tracking-[-0.03em] text-black sm:text-2xl">
              Service types
            </h1>
          </div>
        </div>
        <Button
          className="h-10 gap-2 rounded-full bg-black px-4 text-white hover:bg-black/90"
          onClick={handleNew}
        >
          <Plus className="h-4 w-4" />
          Add service
        </Button>
      </div>

      {/* Edit form */}
      {editingService ? (
        <form
          className="rounded-3xl border border-violet-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
              {editingService.id ? "Edit service" : "New service"}
            </h2>
            <button
              className="rounded-xl p-2 text-black/30 transition hover:bg-black/5 hover:text-black"
              onClick={handleCancel}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="svc-name"
                onChange={(e) =>
                  setEditingService((s) =>
                    s ? { ...s, name: e.target.value } : s
                  )
                }
                placeholder="Mowing"
                value={editingService.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-slug">Slug</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="svc-slug"
                onChange={(e) =>
                  setEditingService((s) =>
                    s ? { ...s, slug: e.target.value } : s
                  )
                }
                placeholder="mowing"
                value={editingService.slug}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="svc-description">Description</Label>
              <Textarea
                className="min-h-20 rounded-2xl border-black/10"
                id="svc-description"
                onChange={(e) =>
                  setEditingService((s) =>
                    s ? { ...s, description: e.target.value } : s
                  )
                }
                placeholder="Weekly or bi-weekly lawn maintenance"
                value={editingService.description}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-order">Sort order</Label>
              <Input
                className="h-12 rounded-2xl border-black/10"
                id="svc-order"
                onChange={(e) =>
                  setEditingService((s) =>
                    s ? { ...s, sortOrder: Number(e.target.value) } : s
                  )
                }
                type="number"
                value={editingService.sortOrder}
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 px-4 py-3">
                <input
                  checked={editingService.isActive}
                  className="h-4 w-4 rounded accent-emerald-600"
                  onChange={(e) =>
                    setEditingService((s) =>
                      s ? { ...s, isActive: e.target.checked } : s
                    )
                  }
                  type="checkbox"
                />
                <span className="text-sm font-medium text-black">
                  Active in onboarding
                </span>
              </label>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button
              className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              type="submit"
            >
              {editingService.id ? "Save changes" : "Create service"}
            </Button>
            <Button
              className="h-11 rounded-full"
              onClick={handleCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {/* Service list */}
      <section className="rounded-3xl border border-black/6 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/8 bg-[#f4f2ec]/50 p-8 text-center">
            <p className="text-sm text-black/40">
              No services configured. Add your first service type above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((svc) => (
              <div
                className="group flex items-center gap-4 rounded-2xl border border-black/6 bg-[#f9f8f5] p-4 transition-all hover:border-black/12 hover:shadow-sm"
                key={svc.id}
              >
                <GripVertical className="h-4 w-4 flex-shrink-0 text-black/20" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold tracking-[-0.02em] text-black">
                      {svc.name}
                    </p>
                    <Badge
                      className={
                        svc.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-black/8 text-black/50"
                      }
                    >
                      {svc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-black/40">
                    {svc.slug}
                    {svc.description ? ` · ${svc.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="rounded-xl p-2 text-black/30 transition hover:bg-black/5 hover:text-black"
                    onClick={() => handleEdit(svc)}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="rounded-xl p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(svc.id)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const Route = createFileRoute("/admin/services/")({
  component: AdminServicesPage,
  loader: () => listServices(),
});
