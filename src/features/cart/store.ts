"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { CartLine } from "@/lib/types";
import { addLine, lineKey } from "./cart";
const key = "smartcell:cart:v1";
const stored = z
  .array(
    z.object({
      productId: z.string().regex(/^[a-f\d]{24}$/i),
      variantId: z.string().max(80).optional(),
      quantity: z.number().int().min(1).max(99),
      name: z.string().max(160),
      slug: z.string().max(140),
      image: z
        .string()
        .url()
        .refine(
          (url) =>
            new URL(url).protocol === "https:" &&
            new URL(url).hostname === "res.cloudinary.com",
        )
        .optional(),
      unitPrice: z.number().int().min(0).max(100_000_000),
      attributes: z
        .array(
          z.object({ name: z.string().max(60), value: z.string().max(100) }),
        )
        .max(15),
    }),
  )
  .max(50);
let rawCache: string | null | undefined;
let snapshot: CartLine[] = [];
const empty: CartLine[] = [];
const listeners = new Set<() => void>();
function getSnapshot() {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return snapshot;
  }
  if (raw !== rawCache) {
    rawCache = raw;
    try {
      const parsed = stored.safeParse(JSON.parse(raw || "[]"));
      snapshot = parsed.success ? parsed.data : [];
    } catch {
      snapshot = [];
    }
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const handle = () => listener();
  window.addEventListener("storage", handle);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handle);
  };
}
function setItems(items: CartLine[]) {
  snapshot = items;
  rawCache = JSON.stringify(items);
  try {
    localStorage.setItem(key, rawCache);
  } catch {
    /* Current tab still works when browser storage is disabled. */
  }
  listeners.forEach((l) => l());
}
export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  return {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    add: (line: CartLine) => setItems(addLine(getSnapshot(), line)),
    remove: (line: CartLine) =>
      setItems(getSnapshot().filter((i) => lineKey(i) !== lineKey(line))),
    quantity: (line: CartLine, value: number) =>
      setItems(
        getSnapshot().map((i) =>
          lineKey(i) === lineKey(line)
            ? {
                ...i,
                quantity: Math.max(1, Math.min(99, Math.trunc(value) || 1)),
              }
            : i,
        ),
      ),
    replace: setItems,
    clear: () => setItems([]),
  };
}
