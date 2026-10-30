import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_MENU, DEFAULT_SETTINGS } from "@shared/menu";
import { EMPTY_INDEX, indexMenu, type MenuIndex } from "@shared/pricing";
import type { Menu, Settings } from "@shared/types";
import { apiGet } from "./api";

export interface MenuState {
  /** null enquanto carrega. Se o servidor estiver fora, cai no cardápio padrão. */
  menu: Menu | null;
  index: MenuIndex;
  settings: Settings;
  source: "loading" | "api" | "default";
}

/** Cardápio público (só o que está ativo), atualizado sozinho a cada minuto. */
export function useMenu(): MenuState {
  const q = useQuery({
    queryKey: ["menu"],
    queryFn: () => apiGet<Menu>("/menu"),
    staleTime: 15_000,
    refetchInterval: 60_000,
    retry: 1,
    retryDelay: 800,
  });

  const menu: Menu | null = q.data ?? (q.isError ? DEFAULT_MENU : null);
  const index = useMemo(() => (menu ? indexMenu(menu) : EMPTY_INDEX), [menu]);

  return {
    menu,
    index,
    settings: menu?.settings ?? DEFAULT_SETTINGS,
    source: q.data ? "api" : q.isError ? "default" : "loading",
  };
}
