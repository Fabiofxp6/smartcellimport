import { notFound } from "next/navigation";
import { getCategories } from "@/features/products/service";
import { Catalog, type SearchParams } from "@/components/products/catalog";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  return {
    title: category?.name || "Categoria",
    description: category?.description,
  };
}
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) notFound();
  return <Catalog category={category} params={await searchParams} />;
}
