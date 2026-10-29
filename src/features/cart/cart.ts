import type { CartLine, Product } from "@/lib/types";
import { money } from "@/lib/utils";

export const lineKey = (item: { productId: string; variantId?: string }) =>
  `${item.productId}:${item.variantId || "base"}`;
export function productPrice(
  product: Pick<Product, "basePrice" | "promotionalPrice" | "variants">,
  variantId?: string,
) {
  return (
    product.variants.find((v) => v.id === variantId)?.priceOverride ??
    product.promotionalPrice ??
    product.basePrice
  );
}
export function addLine(items: CartLine[], incoming: CartLine): CartLine[] {
  const existing = items.find((i) => lineKey(i) === lineKey(incoming));
  if (existing)
    return items.map((i) =>
      lineKey(i) === lineKey(incoming)
        ? {
            ...incoming,
            quantity: Math.min(99, i.quantity + incoming.quantity),
          }
        : i,
    );
  if (items.length >= 50)
    throw new Error("O carrinho aceita até 50 combinações diferentes.");
  return [...items, incoming];
}
export const cartTotal = (items: CartLine[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
export function whatsappLink(
  number: string,
  message: string,
  items: CartLine[],
) {
  if (!/^\d{10,15}$/.test(number)) throw new Error("WhatsApp inválido.");
  const body = [
    message,
    ...items.map((item, i) =>
      [
        `*${i + 1}. ${item.name}*`,
        ...item.attributes.map((a) => `${a.name}: ${a.value}`),
        `Quantidade desejada: ${item.quantity}`,
        `Preço unitário: ${money(item.unitPrice)}`,
        `Subtotal: ${money(item.quantity * item.unitPrice)}`,
      ].join("\n"),
    ),
    `*Total estimado: ${money(cartTotal(items))}*`,
    "Gostaria de confirmar os produtos e combinar a compra!",
    "A seleção é uma consulta de interesse. Disponibilidade, pagamento e entrega serão combinados pelo WhatsApp.",
  ].join("\n\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(body)}`;
}
