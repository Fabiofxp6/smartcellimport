import { PackageOpen } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
export function ProductGrid({
  products,
  emptyMessage = "Novidades a caminho",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (!products.length)
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <span className="mb-4 flex size-13 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
          <PackageOpen className="size-6" />
        </span>
        <h3 className="font-semibold">{emptyMessage}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Assim que os produtos forem publicados, você poderá explorar os
          detalhes e escolher seus favoritos por aqui.
        </p>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
