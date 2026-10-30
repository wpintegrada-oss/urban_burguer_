import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Menu } from "@shared/types";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";

export type Resource = "products" | "categories" | "addons";

/** Cardápio COMPLETO (inclusive itens desativados), só para o painel. */
export function useAdminMenu(pin: string, onUnauthorized: () => void) {
  const query = useQuery({
    queryKey: ["admin-menu", pin],
    queryFn: () => apiGet<Menu>("/admin/menu", { "x-admin-pin": pin }),
    retry: (count, err) => !(err instanceof ApiError && err.status === 401) && count < 2,
  });
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) onUnauthorized();
  }, [query.error, onUnauthorized]);
  return query;
}

export function useAdminActions(pin: string) {
  const qc = useQueryClient();
  const headers = { "x-admin-pin": pin };

  // Depois de qualquer mudança, atualiza o painel E o cardápio que o cliente vê.
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-menu"] });
    void qc.invalidateQueries({ queryKey: ["menu"] });
  };
  const fail = (err: Error) => {
    toast.error(err.message);
  };

  const save = useMutation({
    mutationFn: ({ resource, id, data }: { resource: Resource; id?: string; data: unknown }) =>
      id
        ? apiPut<unknown>(`/admin/${resource}?id=${encodeURIComponent(id)}`, data, headers)
        : apiPost<unknown>(`/admin/${resource}`, data, headers),
    onSuccess: () => {
      refresh();
      toast.success("Salvo!");
    },
    onError: fail,
  });

  const toggle = useMutation({
    mutationFn: ({ resource, id, active }: { resource: Resource; id: string; active: boolean }) =>
      apiPatch<unknown>(`/admin/${resource}?id=${encodeURIComponent(id)}`, { active }, headers),
    onSuccess: refresh,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: ({ resource, id }: { resource: Resource; id: string }) =>
      apiDelete<unknown>(`/admin/${resource}?id=${encodeURIComponent(id)}`, headers),
    onSuccess: () => {
      refresh();
      toast.success("Excluído");
    },
    onError: fail,
  });

  const saveSettings = useMutation({
    mutationFn: (data: unknown) => apiPut<unknown>("/admin/settings", data, headers),
    onSuccess: () => {
      refresh();
      toast.success("Dados da loja salvos!");
    },
    onError: fail,
  });

  return { save, toggle, remove, saveSettings };
}
