import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { queryProducts, getCategories } from "@/features/products/service";
import { ProductGrid } from "./product-grid";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { parseMoney } from "@/lib/utils";
import type { Category } from "@/lib/types";

export type SearchParams = Record<string, string | string[] | undefined>;
const value = (params: SearchParams, key: string) =>
  typeof params[key] === "string" ? (params[key] as string) : "";
export async function Catalog({
  params,
  category,
}: {
  params: SearchParams;
  category?: Category;
}) {
  const categories = await getCategories();
  const selectedCategory = category?.slug || value(params, "categoria");
  const attrs = Object.fromEntries(
    Object.entries(params)
      .filter(([k, v]) => k.startsWith("a_") && typeof v === "string" && v)
      .map(([k, v]) => [k.slice(2), v as string]),
  );
  const min = parseMoney(value(params, "min")),
    max = parseMoney(value(params, "max"));
  const q = value(params, "q").slice(0, 200),
    sort = value(params, "ordem");
  const result = await queryProducts({
    q,
    category: selectedCategory,
    min: Number.isSafeInteger(min) ? min : undefined,
    max: Number.isSafeInteger(max) ? max : undefined,
    sort,
    page: Number(value(params, "pagina")) || 1,
    attributes: attrs,
  });
  const urlFor = (page: number) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === "string" && v && k !== "pagina") search.set(k, v);
    });
    search.set("pagina", String(page));
    return `?${search}`;
  };
  const hasFilters = !!(
    q ||
    selectedCategory ||
    Object.keys(attrs).length ||
    min !== undefined ||
    max !== undefined
  );
  return (
    <div className="container-shell py-8 sm:py-12">
      <nav
        aria-label="Caminho"
        className="mb-7 flex gap-2 text-xs text-muted-foreground"
      >
        <Link href="/">Início</Link>
        <span>/</span>
        <span>{category?.name || "Catálogo"}</span>
      </nav>
      <div className="mb-9">
        <p className="eyebrow mb-3 text-muted-foreground">
          Encontre seus próximos favoritos
        </p>
        <h1 className="section-title">{category?.name || "Nosso catálogo"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {category?.description ||
            "Explore, escolha e monte uma seleção com a sua cara. Depois, é só conversar com a gente."}
        </p>
      </div>
      <form
        action={category ? `/categoria/${category.slug}` : "/catalogo"}
        className="grid gap-7 lg:grid-cols-[225px_1fr]"
      >
        <aside className="rounded-2xl border border-border bg-muted/35 p-5 lg:self-start">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="size-4" />
              Filtros
            </h2>
            {hasFilters && (
              <Link
                href={category ? `/categoria/${category.slug}` : "/catalogo"}
                className="text-xs text-primary underline"
              >
                Limpar
              </Link>
            )}
          </div>
          <label htmlFor="search" className="field-label">
            Pesquisar
          </label>
          <div className="relative">
            <Input
              id="search"
              name="q"
              defaultValue={q}
              maxLength={200}
              placeholder="Nome, modelo, cor…"
              className="pr-9"
            />
            <Search className="absolute top-3.5 right-3 size-3.5 text-muted-foreground" />
          </div>
          {!category && (
            <div className="mt-5">
              <label htmlFor="category" className="field-label">
                Categoria
              </label>
              <Select
                id="category"
                name="categoria"
                defaultValue={selectedCategory}
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <fieldset className="mt-5">
            <legend className="field-label">Preço estimado</legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="min" className="sr-only">
                  Preço mínimo em reais
                </label>
                <Input
                  id="min"
                  name="min"
                  inputMode="decimal"
                  placeholder="De R$"
                  defaultValue={value(params, "min")}
                />
              </div>
              <div>
                <label htmlFor="max" className="sr-only">
                  Preço máximo em reais
                </label>
                <Input
                  id="max"
                  name="max"
                  inputMode="decimal"
                  placeholder="Até R$"
                  defaultValue={value(params, "max")}
                />
              </div>
            </div>
          </fieldset>
          {result.facets.map((f) => (
            <div key={f.name} className="mt-5">
              <label htmlFor={`attr-${f.name}`} className="field-label">
                {f.name}
              </label>
              <Select
                id={`attr-${f.name}`}
                name={`a_${f.name}`}
                defaultValue={attrs[f.name] || ""}
              >
                <option value="">Todas as opções</option>
                {f.values.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </div>
          ))}
          <Button type="submit" className="mt-6 w-full">
            Aplicar filtros
          </Button>
        </aside>
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {result.total}
              </span>{" "}
              {result.total === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="order" className="sr-only">
                Ordenar produtos
              </label>
              <Select
                id="order"
                name="ordem"
                defaultValue={sort}
                className="max-w-48"
              >
                <option value="">
                  {q ? "Mais relevantes" : "Mais recentes"}
                </option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="name">Nome: A a Z</option>
              </Select>
              <Button variant="outline" type="submit" size="sm">
                Ordenar
              </Button>
            </div>
          </div>
          {hasFilters && (
            <div className="mb-5 flex flex-wrap gap-2">
              {q && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-primary">
                  Busca: {q}
                </span>
              )}
              {Object.entries(attrs).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full bg-secondary px-3 py-1 text-xs text-primary"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
          {result.total ? (
            <ProductGrid products={result.products} />
          ) : (
            <div className="flex min-h-70 flex-col items-center justify-center rounded-2xl bg-muted/60 p-8 text-center">
              <Search className="mb-4 size-8 text-primary/40" />
              <h2 className="text-lg font-semibold">
                {hasFilters ? "Nenhum produto por aqui" : "Novidades a caminho"}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {hasFilters
                  ? "Experimente outra busca ou ajuste os filtros para encontrar o que procura."
                  : "Estamos preparando o catálogo. Fale com nossa equipe para conhecer os produtos."}
              </p>
              {hasFilters && (
                <Button asChild variant="outline" className="mt-5">
                  <Link href="/catalogo">
                    <X />
                    Limpar filtros
                  </Link>
                </Button>
              )}
            </div>
          )}
          {result.pages > 1 && (
            <nav
              aria-label="Paginação"
              className="mt-10 flex items-center justify-center gap-4"
            >
              {result.page > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={urlFor(result.page - 1)}>
                    <ChevronLeft />
                    Anterior
                  </Link>
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                Página {result.page} de {result.pages}
              </span>
              {result.page < result.pages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={urlFor(result.page + 1)}>
                    Próxima
                    <ChevronRight />
                  </Link>
                </Button>
              )}
            </nav>
          )}
        </div>
      </form>
    </div>
  );
}
