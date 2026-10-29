import type { CartInput, CartLine, Product } from "@/lib/types";
import { lineKey, productPrice } from "./cart";

const attributesKey = (attributes: { name: string; value: string }[]) =>
  JSON.stringify(
    attributes
      .map((a) => [a.name, a.value])
      .sort((a, b) => a[0].localeCompare(b[0])),
  );

export function reconcileCart(input: CartInput[], products: Product[]) {
  const items: CartLine[] = [],
    issues: string[] = [],
    seen = new Set<string>();
  let changed = false;
  for (const line of input) {
    const key = lineKey(line);
    if (seen.has(key)) {
      issues.push(
        "O carrinho contém combinações repetidas. Atualize sua seleção.",
      );
      continue;
    }
    seen.add(key);
    const product = products.find(
      (p) => p.id === line.productId && p.published,
    );
    if (!product) {
      issues.push("Um produto foi retirado do catálogo e removido da seleção.");
      continue;
    }
    const variant = product.variants.find((v) => v.id === line.variantId);
    if (
      (product.variants.length &&
        (!variant ||
          attributesKey(variant.attributes) !==
            attributesKey(line.expectedAttributes || []))) ||
      (!product.variants.length && line.variantId)
    ) {
      issues.push(
        `A variação de ${product.name} foi alterada. Selecione o produto novamente.`,
      );
      continue;
    }
    const unitPrice = productPrice(product, line.variantId);
    if (unitPrice !== line.expectedPrice) changed = true;
    items.push({
      productId: product.id,
      variantId: variant?.id,
      quantity: line.quantity,
      name: product.name,
      slug: product.slug,
      image: (product.images.find((i) => i.isPrimary) || product.images[0])
        ?.secureUrl,
      unitPrice,
      attributes: variant?.attributes || [],
    });
  }
  return { items, issues, changed };
}
