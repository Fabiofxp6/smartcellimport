"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container-shell flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <h1 className="section-title">Não foi possível carregar o catálogo</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
        O serviço está temporariamente indisponível. Tente novamente em alguns
        instantes.
      </p>
      <Button className="mt-7" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
