import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  MessageCircle,
  Sparkles,
  HeartHandshake,
  ShoppingBag,
  Shapes,
} from "lucide-react";
import { getSettings } from "@/features/settings/service";
import { getCategories, queryProducts } from "@/features/products/service";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [settings, categories, featured, recent] = await Promise.all([
    getSettings(),
    getCategories(),
    queryProducts({ featured: true }),
    queryProducts(),
  ]);
  return (
    <>
      <section className="container-shell pt-6 sm:pt-8">
        <div className="relative isolate grid overflow-hidden rounded-3xl bg-primary text-white lg:grid-cols-[1.1fr_1fr]">
          {settings.banner && (
            <Image
              src={settings.banner.secureUrl}
              alt={settings.banner.alt}
              fill
              priority
              className="-z-20 object-cover opacity-35"
              sizes="1200px"
            />
          )}
          <div className="relative z-10 px-7 py-12 sm:px-12 sm:py-16 lg:py-20">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[10px] font-semibold tracking-[.15em] uppercase">
              <span className="size-1.5 rounded-full bg-[#cdf4cf]" />
              Bem-vindo à {settings.storeName}
            </span>
            <h1 className="max-w-lg text-[40px] leading-[1.08] font-bold tracking-[-.05em] whitespace-pre-line sm:text-6xl">
              {settings.bannerTitle}
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70 sm:text-base">
              {settings.bannerSubtitle}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 rounded-full bg-white text-primary hover:bg-white/90"
            >
              <Link href="/catalogo">
                Explorar catálogo
                <ArrowUpRight />
              </Link>
            </Button>
            <div className="mt-7 flex items-center gap-2 text-xs text-white/70">
              <MessageCircle className="size-4 text-[#cdf4cf]" />
              Escolha aqui. Converse pelo WhatsApp.
            </div>
          </div>
          <div className="relative flex min-h-80 items-center justify-center pb-12 lg:min-h-full lg:pb-0">
            <div className="hero-orbit" />
            <div className="hero-orbit scale-[.75]" />
            <div className="absolute size-64 rounded-full bg-[#7461b1]/30 blur-3xl" />
            <div className="hero-phone flex items-center justify-center">
              <div className="relative size-40 overflow-hidden rounded-full">
                <Image
                  src={settings.logo?.secureUrl || "/smartcell-logo.jpeg"}
                  alt={settings.storeName}
                  fill
                  sizes="200px"
                  priority
                  className="scale-105 object-cover"
                />
              </div>
            </div>
            <div className="absolute top-3 left-[8%] -rotate-6 rounded-2xl border border-white/25 bg-[#ffffff12] px-4 py-3 backdrop-blur-md lg:top-20">
              <Sparkles className="mb-2 size-5 text-[#e9dba6]" />
              <p className="text-xs font-semibold">
                Detalhes que
                <br />
                fazem a diferença.
              </p>
            </div>
            <div className="absolute right-5 bottom-12 flex rotate-[-8deg] items-center gap-3 rounded-2xl bg-[#e0efcc] px-4 py-3 text-primary shadow-lg sm:right-12 lg:bottom-16">
              <HeartHandshake className="size-7" />
              <p className="text-xs leading-5 font-bold">
                Seu estilo,
                <br />
                do seu jeito.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="container-shell grid grid-cols-1 gap-5 border-b border-border py-7 text-sm sm:grid-cols-3 sm:gap-8">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-secondary p-2.5 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold">Uma seleção especial</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Acessórios para o seu dia a dia
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-secondary p-2.5 text-primary">
            <ShoppingBag className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold">Escolha com tranquilidade</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Monte seu carrinho de interesse
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-secondary p-2.5 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold">Atendimento de verdade</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Nossa equipe cuida do resto
            </p>
          </div>
        </div>
      </div>
      <section id="categorias" className="container-shell py-12 sm:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-muted-foreground">
              Encontre o que é a sua cara
            </p>
            <h2 className="section-title">Explore por categoria</h2>
          </div>
          <Link
            href="/catalogo"
            className="flex shrink-0 items-center gap-2 text-xs font-semibold text-primary"
          >
            Ver tudo
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {categories.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/categoria/${c.slug}`}
                className={`group relative flex min-h-40 items-end justify-between overflow-hidden rounded-2xl p-5 ${i % 2 ? "bg-[#f3f0fa]" : "bg-[#f0f3f2]"}`}
              >
                {c.image ? (
                  <Image
                    src={c.image.secureUrl}
                    alt={c.image.alt || c.name}
                    fill
                    sizes="300px"
                    className="object-cover"
                  />
                ) : (
                  <Shapes className="absolute top-4 right-5 size-15 text-primary/10" />
                )}
                <span className="relative z-10 rounded-lg bg-white/90 px-2 py-1 text-sm font-semibold">
                  {c.name}
                </span>
                <span className="relative flex size-8 items-center justify-center rounded-full bg-white">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/catalogo"
            className="flex items-center justify-between rounded-2xl bg-secondary p-6 text-primary"
          >
            <div>
              <p className="font-semibold">Um mundo de possibilidades</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Conheça as novidades da Smart Cell.
              </p>
            </div>
            <ArrowUpRight className="size-6 shrink-0" />
          </Link>
        )}
      </section>
      <section className="container-shell pb-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2 text-muted-foreground">
              Selecionados para você
            </p>
            <h2 className="section-title">Os nossos destaques</h2>
          </div>
          <Link
            href="/catalogo"
            className="flex items-center gap-2 text-xs font-semibold text-primary"
          >
            Ver catálogo
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <ProductGrid products={featured.products.slice(0, 8)} />
      </section>
      {!!recent.products.length && (
        <section className="container-shell pb-16">
          <div className="mb-7">
            <p className="eyebrow mb-2 text-muted-foreground">
              Acabaram de chegar
            </p>
            <h2 className="section-title">Novos favoritos</h2>
          </div>
          <ProductGrid products={recent.products.slice(0, 4)} />
        </section>
      )}
      <section className="container-shell pb-16">
        <div className="flex flex-col items-start justify-between gap-7 rounded-3xl bg-[#f0f3ec] px-7 py-10 sm:flex-row sm:items-center sm:px-10">
          <div>
            <p className="eyebrow mb-3 text-[#477045]">Vamos conversar?</p>
            <h2 className="section-title">Uma ajudinha para escolher?</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A nossa equipe te ajuda a encontrar o que combina com você.
            </p>
          </div>
          <Button asChild variant="whatsapp" className="rounded-full">
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Falar pelo WhatsApp
              <ArrowUpRight />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
