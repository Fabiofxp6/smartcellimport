import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { getCategories, getProduct } from "@/features/products/service";
import { ProductForm } from "@/components/admin/product-form";
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id, true),
    getCategories(true),
  ]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} />;
}
