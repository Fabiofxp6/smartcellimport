import { normalize } from "@/lib/utils";
import type { ProductInput } from "@/lib/validations";
export function searchTerms(text: string) {
  return [
    ...new Set(
      normalize(text)
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  ].slice(0, 15);
}
export function buildSearchTokens(product: ProductInput, categoryName: string) {
  const words = searchTerms(
    [
      product.name,
      product.description,
      categoryName,
      ...product.keywords,
      ...product.attributes.flatMap((a) => [a.name, ...a.values]),
      ...product.variants.flatMap((v) =>
        v.attributes.flatMap((a) => [a.name, a.value]),
      ),
    ].join(" "),
  );
  // Name/description can have many words; bounded prefixes enable indexed partial lookup.
  const allWords = [
    ...new Set(
      normalize(
        [
          product.name,
          product.description,
          categoryName,
          ...product.keywords,
          ...product.attributes.flatMap((a) => [a.name, ...a.values]),
        ].join(" "),
      )
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  ].slice(0, 500);
  return [
    ...new Set([
      ...words,
      ...allWords.flatMap((w) =>
        Array.from({ length: Math.min(w.length, 40) }, (_, i) =>
          w.slice(0, i + 1),
        ),
      ),
    ]),
  ];
}
