import Link from "next/link";
import { ArrowUpRight, MessageCircle, ShoppingBag } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
export function Footer({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-xl font-bold tracking-tight">
            {settings.storeName}
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            {settings.description}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {settings.contactInformation}
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold">Explore a loja</h2>
          <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            <Link href="/catalogo">Todos os produtos</Link>
            <Link href="/#categorias">Categorias</Link>
            <Link href="/carrinho" className="flex items-center gap-2">
              <ShoppingBag className="size-3.5" />
              Carrinho de interesse
            </Link>
            {settings.socialLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                {l.label}
                <ArrowUpRight className="size-3" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold">
            Fale com a nossa equipe
          </h2>
          <div className="flex flex-col items-start gap-3">
            {(settings.attendants.length
              ? settings.attendants
              : [{ name: "WhatsApp da loja", number: settings.whatsappNumber }]
            ).map((a) => (
              <a
                href={`https://wa.me/${a.number}`}
                key={a.number}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="size-4 text-[#17794b]" />
                {a.name}
                <ArrowUpRight className="size-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="container-shell flex flex-col justify-between gap-3 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {settings.storeName}. Feito para
          conectar.
        </p>
        <p>Catálogo digital · Valores e disponibilidade sob consulta.</p>
        <Link href="/admin">Área administrativa</Link>
      </div>
    </footer>
  );
}
