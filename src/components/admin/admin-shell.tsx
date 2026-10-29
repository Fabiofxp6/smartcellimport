"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Shapes,
  Settings,
  ExternalLink,
  LogOut,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
const links = [
  { href: "/admin", name: "Visão geral", Icon: LayoutDashboard },
  { href: "/admin/produtos", name: "Produtos", Icon: Package },
  { href: "/admin/categorias", name: "Categorias", Icon: Shapes },
  { href: "/admin/configuracoes", name: "Configurações", Icon: Settings },
];
export function AdminShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const path = usePathname();
  return (
    <div className="min-h-dvh bg-[#f6f6f9] lg:grid lg:grid-cols-[235px_1fr]">
      <aside className="border-r border-border bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link href="/admin" className="flex items-center gap-3 px-6 py-7">
          <span className="rounded-xl bg-primary p-2.5 text-white">
            <Smartphone className="size-5" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight">Smart Cell</p>
            <p className="mt-0.5 text-[10px] tracking-wider text-muted-foreground uppercase">
              Administração
            </p>
          </div>
        </Link>
        <nav
          aria-label="Administração"
          className="flex gap-1 overflow-auto px-3 pb-4 lg:flex-col lg:px-4"
        >
          {links.map(({ href, name, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm whitespace-nowrap text-muted-foreground hover:bg-muted",
                (href === "/admin" ? path === href : path.startsWith(href)) &&
                  "bg-secondary font-semibold text-primary",
              )}
            >
              <Icon className="size-4" />
              {name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-border p-5 lg:block">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 text-xs text-muted-foreground"
          >
            <ExternalLink className="size-4" />
            Abrir catálogo
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-18 items-center justify-between border-b border-border bg-white px-5 sm:px-8">
          <p className="text-xs text-muted-foreground">
            Gerencie o seu catálogo
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium">{name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <LogOut className="size-3.5" />
              Sair
            </button>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl p-5 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
