import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, queryProducts } from "@/features/products/service";
import {
  ProductGallery,
  ProductPurchase,
} from "@/components/products/product-detail";
import { ProductGrid } from "@/components/products/product-grid";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  return {
    title: p?.name || "Produto",
    description: p?.description.slice(0, 160),
    openGraph: { images: p?.images[0] ? [p.images[0].secureUrl] : [] },
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = await queryProducts({ category: product.category?.slug });
  return (
    <div className="container-shell py-8 sm:py-12">
      <nav
        aria-label="Caminho"
        className="mb-8 flex flex-wrap gap-2 text-xs text-muted-foreground"
      >
        <Link href="/">Início</Link>
        <span>/</span>
        <Link href="/catalogo">Catálogo</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/categoria/${product.category.slug}`}>
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span>{product.name}</span>
      </nav>
      <div className="grid gap-9 md:grid-cols-2 lg:gap-16">
        <ProductGallery product={product} />
        <div className="py-3">
          <p className="eyebrow mb-3 text-muted-foreground">
            {product.category?.name}
          </p>
          <h1 className="mb-5 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <ProductPurchase product={product} />
          <div className="mt-8 border-t border-border pt-7">
            <h2 className="mb-3 font-semibold">Sobre este produto</h2>
            <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
            {product.attributes.length > 0 && (
              <dl className="mt-6 divide-y divide-border">
                {product.attributes.map((a) => (
                  <div
                    key={a.name}
                    className="grid grid-cols-[100px_1fr] gap-3 py-3 text-sm"
                  >
                    <dt className="font-medium">{a.name}</dt>
                    <dd className="text-muted-foreground">
                      {a.values.join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
      {related.products.some((p) => p.id !== product.id) && (
        <section className="mt-16 mb-10">
          <h2 className="section-title mb-7">Você também pode gostar</h2>
          <ProductGrid
            products={related.products
              .filter((p) => p.id !== product.id)
              .slice(0, 4)}
          />
        </section>
      )}
    </div>
  );
}
