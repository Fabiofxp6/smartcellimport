import Link from "next/link";
import {
  Package,
  Shapes,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  Star,
} from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { dashboardStats, queryProducts } from "@/features/products/service";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/utils";
export default async function Dashboard() {
  await requireAdminPage();
  const [stats, recent] = await Promise.all([
    dashboardStats(),
    queryProducts({}, true),
  ]);
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-2 text-muted-foreground">
            Tudo em um só lugar
          </p>
          <h1 className="section-title">Visão geral</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Acompanhe e organize o catálogo da sua loja.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus />
            Novo produto
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Produtos", value: stats.total, Icon: Package },
          { label: "Categorias", value: stats.categories, Icon: Shapes },
          { label: "Publicados", value: stats.published, Icon: Eye },
          { label: "Ocultos", value: stats.hidden, Icon: EyeOff },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="panel">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className="size-4 text-primary/60" />
            </div>
            <p className="mt-5 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_280px]">
        <section className="panel min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">Adicionados recentemente</h2>
            <Link href="/admin/produtos" className="text-xs text-primary">
              Ver todos
            </Link>
          </div>
          {recent.products.length ? (
            <div className="divide-y divide-border">
              {recent.products.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/produtos/${p.id}/editar`}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.category?.name} ·{" "}
                      {p.published ? "Publicado" : "Oculto"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {money(p.promotionalPrice ?? p.basePrice)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 size-8 text-primary/30" />
              <p className="text-sm text-muted-foreground">
                Seu primeiro produto começa aqui.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link href="/admin/produtos/novo">Cadastrar produto</Link>
              </Button>
            </div>
          )}
        </section>
        <aside className="space-y-5">
          <div className="panel bg-primary text-white">
            <Star className="size-5 text-[#e4d6a1]" />
            <p className="mt-4 text-2xl font-bold">{stats.featured}</p>
            <p className="mt-2 text-sm text-white/70">produtos em destaque</p>
          </div>
          <div className="panel">
            <h2 className="mb-4 text-sm font-semibold">Atalhos</h2>
            <div className="space-y-4">
              {[
                { href: "/admin/categorias", label: "Organizar categorias" },
                { href: "/admin/configuracoes", label: "Personalizar loja" },
                { href: "/", label: "Abrir catálogo" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between text-xs text-muted-foreground"
                >
                  {l.label}
                  <ArrowUpRight className="size-4" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
