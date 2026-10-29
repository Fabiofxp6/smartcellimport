import { requireAdminPage } from "@/lib/auth";
import { getCategories } from "@/features/products/service";
import { ProductForm } from "@/components/admin/product-form";
export default async function NewProduct() {
  await requireAdminPage();
  return <ProductForm categories={await getCategories(true)} />;
}
