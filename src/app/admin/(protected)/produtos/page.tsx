import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Star, Package } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { queryProducts } from "@/features/products/service";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductActions } from "@/components/admin/product-actions";
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const result = await queryProducts(
    {
      q: typeof params.q === "string" ? params.q : "",
      page: Number(params.pagina) || 1,
    },
    true,
  );
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Produtos</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Cadastre, organize e publique seus produtos.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus />
            Novo produto
          </Link>
        </Button>
      </div>
      <section className="panel">
        <form className="mb-6 flex max-w-md gap-2">
          <label htmlFor="product-search" className="sr-only">
            Pesquisar produtos
          </label>
          <Input
            id="product-search"
            name="q"
            placeholder="Buscar produto, modelo ou palavra-chave"
            defaultValue={params.q}
          />
          <Button type="submit" variant="outline" aria-label="Pesquisar">
            <Search />
          </Button>
        </form>
        {result.products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="py-4 font-medium">Produto</th>
                  <th className="px-4 font-medium">Categoria</th>
                  <th className="px-4 font-medium">Preço</th>
                  <th className="px-4 font-medium">Visibilidade</th>
                  <th className="text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.products.map((p) => (
                  <tr key={p.id}>
                    <td className="min-w-56 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.images[0] && (
                            <Image
                              src={p.images[0].secureUrl}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/produtos/${p.id}/editar`}
                            className="font-medium"
                          >
                            {p.name}
                          </Link>
                          {p.featured && (
                            <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Star className="size-2.5" />
                              Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 text-xs text-muted-foreground">
                      {p.category?.name}
                    </td>
                    <td className="px-4 whitespace-nowrap">
                      {money(p.promotionalPrice ?? p.basePrice)}
                    </td>
                    <td className="px-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${p.published ? "bg-green-50 text-green-800" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.published ? "Publicado" : "Oculto"}
                      </span>
                    </td>
                    <td>
                      <ProductActions
                        id={p.id}
                        published={p.published}
                        name={p.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-4 size-9 text-primary/25" />
            <h2 className="font-semibold">Nenhum produto encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre seu primeiro produto ou ajuste a pesquisa.
            </p>
          </div>
        )}
        {result.pages > 1 && (
          <nav
            aria-label="Paginação de produtos"
            className="mt-7 flex justify-center gap-5 text-sm"
          >
            {result.page > 1 && (
              <Link
                href={`?q=${encodeURIComponent(params.q || "")}&pagina=${result.page - 1}`}
              >
                Anterior
              </Link>
            )}
            <span className="text-muted-foreground">
              {result.page} / {result.pages}
            </span>
            {result.page < result.pages && (
              <Link
                href={`?q=${encodeURIComponent(params.q || "")}&pagina=${result.page + 1}`}
              >
                Próxima
              </Link>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
