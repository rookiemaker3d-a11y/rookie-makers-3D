import { create } from "zustand";

type Material = "PLA" | "PETG" | "RESIN";

type State = {
  material: Material;
  infill: number;
  price: number;
  setMaterial: (m: Material) => void;
  setInfill: (n: number) => void;
  calculatePrice: () => void;
};

function computePrice(material: Material, infill: number): number {
  const base = material === "PLA" ? 12.5 : material === "PETG" ? 18.0 : 35.0;
  return Math.round((base + (infill / 100) * 42) * 100) / 100;
}

export const useQuoteStore = create<State>((set, get) => ({
  material: "PLA",
  infill: 20,
  price: computePrice("PLA", 20),
  setMaterial: (m) => {
    set({ material: m });
    get().calculatePrice();
  },
  setInfill: (n) => {
    set({ infill: n });
    get().calculatePrice();
  },
  calculatePrice: () => {
    const { material, infill } = get();
    set({ price: computePrice(material, infill) });
  },
}));
