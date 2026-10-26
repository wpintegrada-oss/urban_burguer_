import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { unitPriceOf, round2 } from "@shared/pricing";
import { ITEM_BY_ID } from "@shared/menu";

export interface CartLine {
  key: string;
  itemId: string;
  qty: number;
  addonIds: string[];
  obs: string;
}

type Action =
  | { type: "add"; line: Omit<CartLine, "key"> }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

const STORAGE_KEY = "ub_cart_v1";

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Descarta linhas de itens que não existem mais no cardápio.
    return (parsed as CartLine[]).filter(
      (l) => ITEM_BY_ID[l.itemId] && unitPriceOf(l.itemId, l.addonIds ?? []) !== null,
    );
  } catch {
    return [];
  }
}

const sig = (l: Omit<CartLine, "key" | "qty">) =>
  `${l.itemId}|${[...l.addonIds].sort().join(",")}|${l.obs.trim().toLowerCase()}`;

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "add": {
      const existing = state.find((l) => sig(l) === sig(action.line));
      if (existing) {
        return state.map((l) =>
          l.key === existing.key ? { ...l, qty: Math.min(20, l.qty + action.line.qty) } : l,
        );
      }
      return [...state, { ...action.line, key: Math.random().toString(36).slice(2) + Date.now().toString(36) }];
    }
    case "setQty":
      return state
        .map((l) => (l.key === action.key ? { ...l, qty: Math.min(20, action.qty) } : l))
        .filter((l) => l.qty > 0);
    case "remove":
      return state.filter((l) => l.key !== action.key);
    case "clear":
      return [];
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: Omit<CartLine, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* armazenamento indisponível: o carrinho vive só em memória */
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const total = round2(
      lines.reduce((s, l) => s + (unitPriceOf(l.itemId, l.addonIds) ?? 0) * l.qty, 0),
    );
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total,
      add: (line) => dispatch({ type: "add", line }),
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
      open,
      setOpen,
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fora do CartProvider");
  return ctx;
}
