"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import type { StoreSettings, Category } from "@/lib/types";
import { useCart } from "@/features/cart/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header({
  settings,
  categories,
}: {
  settings: StoreSettings;
  categories: Category[];
}) {
  const { count } = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="bg-primary text-primary-foreground">
        <div className="container-shell flex min-h-9 items-center justify-center gap-2 text-center text-xs">
          <MessageCircle className="size-3.5" />
          <span>
            Escolha seus favoritos. A gente combina tudo pelo WhatsApp.
          </span>
          <ArrowUpRight className="size-3.5" />
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="container-shell flex h-22 items-center justify-between gap-5">
          <Link
            href="/"
            aria-label={`${settings.storeName} — início`}
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="brand-logo">
              <Image
                src={settings.logo?.secureUrl || "/smartcell-logo.jpeg"}
                alt=""
                fill
                sizes="48px"
                priority
              />
            </span>
            <span className="text-xl leading-none font-bold tracking-tight">
              {settings.storeName === "Smart Cell Import" ? (
                <>
                  Smart Cell
                  <span className="mt-1 block text-[9px] font-semibold tracking-[.35em] text-muted-foreground">
                    IMPORT
                  </span>
                </>
              ) : (
                settings.storeName
              )}
            </span>
          </Link>
          <nav
            aria-label="Menu principal"
            className="hidden items-center gap-7 text-sm lg:flex"
          >
            <Link
              className={cn(
                "nav-link",
                path === "/" && "text-primary font-semibold",
              )}
              href="/"
            >
              Início
            </Link>
            <Link
              className={cn(
                "nav-link",
                path === "/catalogo" && "text-primary font-semibold",
              )}
              href="/catalogo"
            >
              Catálogo
            </Link>
            <Link className="nav-link" href="/#categorias">
              Categorias
            </Link>
          </nav>
          <form
            action="/catalogo"
            role="search"
            className="relative hidden max-w-72 flex-1 md:block"
          >
            <label htmlFor="header-search" className="sr-only">
              Buscar no catálogo
            </label>
            <input
              id="header-search"
              name="q"
              maxLength={200}
              placeholder="O que você procura?"
              className="h-11 w-full rounded-full border border-border bg-muted/50 pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              aria-label="Pesquisar"
              className="absolute top-0 right-0 flex size-11 items-center justify-center"
            >
              <Search className="size-4 text-muted-foreground" />
            </button>
          </form>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="icon" className="md:hidden">
              <Link href="/catalogo" aria-label="Pesquisar produtos">
                <Search />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="relative rounded-full px-3 sm:px-4"
            >
              <Link
                href="/carrinho"
                aria-label={`Meu carrinho, ${count} itens`}
              >
                <ShoppingBag />
                <span className="hidden sm:inline">Meu carrinho</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {count}
                </span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            aria-label="Menu móvel"
            className="container-shell flex flex-col gap-4 border-t border-border py-5 lg:hidden"
          >
            {[
              { name: "Início", href: "/" },
              { name: "Todos os produtos", href: "/catalogo" },
              ...categories.map((c) => ({
                name: c.name,
                href: `/categoria/${c.slug}`,
              })),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
