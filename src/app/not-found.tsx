import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="container-shell flex min-h-[65dvh] flex-col items-center justify-center text-center"
    >
      <p className="eyebrow text-muted-foreground">404</p>
      <h1 className="section-title mt-4">Não encontramos esta página</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        O produto ou a página pode ter sido retirado do catálogo.
      </p>
      <Button asChild className="mt-7">
        <Link href="/catalogo">Voltar ao catálogo</Link>
      </Button>
    </main>
  );
}
