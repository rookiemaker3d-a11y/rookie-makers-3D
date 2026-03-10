"use client";

import { create } from "zustand";
import type { Pedido } from "@/lib/types";

type PedidosState = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  drawerNuevoOpen: boolean;
  setDrawerNuevoOpen: (v: boolean) => void;
  optimisticPedidos: Map<string, Partial<Pedido>>;
  setOptimisticPedido: (id: string, data: Partial<Pedido>) => void;
  clearOptimistic: (id: string) => void;
};

export const usePedidosStore = create<PedidosState>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  drawerNuevoOpen: false,
  setDrawerNuevoOpen: (v) => set({ drawerNuevoOpen: v }),
  optimisticPedidos: new Map(),
  setOptimisticPedido: (id, data) =>
    set((s) => {
      const m = new Map(s.optimisticPedidos);
      m.set(id, { ...m.get(id), ...data });
      return { optimisticPedidos: m };
    }),
  clearOptimistic: (id) =>
    set((s) => {
      const m = new Map(s.optimisticPedidos);
      m.delete(id);
      return { optimisticPedidos: m };
    }),
}));
