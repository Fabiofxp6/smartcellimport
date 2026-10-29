import type { Metadata } from "next";
import { Catalog, type SearchParams } from "@/components/products/catalog";
export const metadata: Metadata = { title: "Catálogo" };
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <Catalog params={await searchParams} />;
}
