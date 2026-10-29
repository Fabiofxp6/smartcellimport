import { requireAdminPage } from "@/lib/auth";
import { getCategories } from "@/features/products/service";
import { CategoriesManager } from "@/components/admin/categories-manager";
export default async function CategoriesPage() {
  await requireAdminPage();
  return <CategoriesManager categories={await getCategories(true)} />;
}
