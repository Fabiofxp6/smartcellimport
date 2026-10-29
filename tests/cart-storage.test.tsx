// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useCart } from "@/features/cart/store";
import { JSDOM } from "jsdom";
import { fixture } from "./fixtures";
beforeEach(() => {
  cleanup();
  vi.stubGlobal(
    "localStorage",
    new JSDOM("", { url: "http://localhost" }).window.localStorage,
  );
});
it("persiste, restaura, altera quantidade e remove no LocalStorage", () => {
  const { result, unmount } = renderHook(() => useCart());
  const item = {
    productId: fixture.id,
    name: fixture.name,
    slug: fixture.slug,
    unitPrice: 3990,
    attributes: [],
    quantity: 2,
  };
  act(() => result.current.add(item));
  expect(result.current.count).toBe(2);
  expect(
    JSON.parse(localStorage.getItem("smartcell:cart:v1") || "[]"),
  ).toHaveLength(1);
  unmount();
  const second = renderHook(() => useCart());
  expect(second.result.current.items[0].quantity).toBe(2);
  act(() => second.result.current.quantity(item, 4));
  expect(second.result.current.count).toBe(4);
  act(() => second.result.current.remove(item));
  expect(second.result.current.items).toHaveLength(0);
});
it("ignora conteúdo corrompido e reage a mudanças em outra aba", () => {
  localStorage.setItem("smartcell:cart:v1", '{"injetado":true}');
  const { result } = renderHook(() => useCart());
  expect(result.current.items).toEqual([]);
  act(() => {
    localStorage.setItem(
      "smartcell:cart:v1",
      JSON.stringify([
        {
          productId: fixture.id,
          name: fixture.name,
          slug: fixture.slug,
          unitPrice: 3990,
          attributes: [],
          quantity: 3,
        },
      ]),
    );
    window.dispatchEvent(new StorageEvent("storage"));
  });
  expect(result.current.count).toBe(3);
});
