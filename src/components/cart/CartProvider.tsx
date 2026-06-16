"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { CartItem, PMInfo, RateInfo } from "@/types";

const STORAGE_KEY = "mrf:cart:v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  totalUSD: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string, kind: CartItem["kind"]) => void;
  setQuantity: (id: string, kind: CartItem["kind"], qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Datos para el paso de pago, precargados desde el servidor. */
  whatsappPhone?: string;
  paymentMethods: PMInfo[];
  rates: RateInfo[];
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

function sameLine(a: CartItem, id: string, kind: CartItem["kind"]) {
  return a.id === id && a.kind === kind;
}

export function CartProvider({
  whatsappPhone,
  paymentMethods,
  rates,
  children,
}: {
  whatsappPhone?: string;
  paymentMethods: PMInfo[];
  rates: RateInfo[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage tras montar (evita mismatch SSR)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => sameLine(p, item.id, item.kind));
      if (existing) {
        return prev.map((p) =>
          sameLine(p, item.id, item.kind) ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string, kind: CartItem["kind"]) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, id, kind)));
  }, []);

  const setQuantity = useCallback((id: string, kind: CartItem["kind"], qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => !sameLine(p, id, kind))
        : prev.map((p) => (sameLine(p, id, kind) ? { ...p, quantity: qty } : p))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const totalUSD = useMemo(
    () => items.reduce((sum, i) => sum + i.price_usd * i.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    count,
    totalUSD,
    addItem,
    removeItem,
    setQuantity,
    clear,
    isOpen,
    open,
    close,
    whatsappPhone,
    paymentMethods,
    rates,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
