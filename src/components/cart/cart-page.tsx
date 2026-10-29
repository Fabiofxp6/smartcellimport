"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ShoppingBag,
  Trash2,
  MessageCircle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/features/cart/store";
import { cartTotal, lineKey } from "@/features/cart/cart";
import { money } from "@/lib/utils";
import type { CartLine, Product, StoreSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductPurchase } from "@/components/products/product-detail";

export function CartPage({ settings }: { settings: StoreSettings }) {
  const cart = useCart();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [attendant, setAttendant] = useState("");
  const [editing, setEditing] = useState<CartLine | null>(null),
    [product, setProduct] = useState<Product | null>(null);
  async function edit(item: CartLine) {
    setEditing(item);
    setProduct(null);
    setMessage("");
    try {
      const res = await fetch(`/api/produtos/${item.productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProduct(data);
    } catch (e) {
      setMessage((e as Error).message);
      setEditing(null);
    }
  }
  async function send() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/carrinho/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            expectedPrice: i.unitPrice,
            expectedAttributes: i.attributes,
          })),
          attendant: attendant || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      cart.replace(data.items);
      if (data.changed || data.issues.length) {
        setMessage(
          [
            data.changed
              ? "Os preços foram atualizados. Confira os novos valores e clique novamente para enviar."
              : "",
            ...data.issues,
          ]
            .filter(Boolean)
            .join(" "),
        );
        return;
      }
      if (data.url) window.location.assign(data.url);
    } catch (e) {
      setMessage(
        (e as Error).message || "Não foi possível validar o carrinho.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container-shell py-10 sm:py-14">
      <Link
        href="/catalogo"
        className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Continuar explorando
      </Link>
      <p className="eyebrow mb-3 text-muted-foreground">
        Uma seleção com a sua cara
      </p>
      <h1 className="section-title">Meu carrinho de interesse</h1>
      <p className="mt-3 mb-8 text-sm leading-6 text-muted-foreground">
        Confira seus favoritos e envie a seleção para a nossa equipe.
      </p>
      {message && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          {message}
        </div>
      )}
      {!cart.items.length ? (
        <div className="my-8 flex min-h-72 flex-col items-center justify-center rounded-3xl bg-muted p-8 text-center">
          <ShoppingBag className="mb-5 size-10 text-primary/40" />
          <h2 className="text-xl font-semibold">
            Seu próximo favorito está esperando
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Explore o catálogo e adicione os produtos que você gostar.
          </p>
          <Button asChild className="mt-7">
            <Link href="/catalogo">
              Explorar catálogo
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">
                {cart.count}{" "}
                {cart.count === 1
                  ? "unidade selecionada"
                  : "unidades selecionadas"}
              </p>
              <button
                onClick={() => {
                  if (window.confirm("Limpar todos os itens do carrinho?"))
                    cart.clear();
                }}
                className="text-xs text-muted-foreground underline"
              >
                Limpar carrinho
              </button>
            </div>
            <div className="divide-y divide-border rounded-2xl border border-border px-5">
              {cart.items.map((item) => (
                <article key={lineKey(item)} className="flex gap-4 py-6">
                  <Link
                    href={`/produto/${item.slug}`}
                    className="relative size-22 shrink-0 overflow-hidden rounded-xl bg-muted"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="100px"
                        className="object-contain p-2"
                      />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produto/${item.slug}`}
                      className="text-sm font-semibold"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.attributes
                        .map((a) => `${a.name}: ${a.value}`)
                        .join(" · ")}
                    </p>
                    <button
                      className="mt-2 text-xs text-primary underline"
                      onClick={() => edit(item)}
                    >
                      Alterar opções
                    </button>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`qty-${lineKey(item)}`}
                          className="text-xs text-muted-foreground"
                        >
                          Qtd.
                        </label>
                        <Input
                          id={`qty-${lineKey(item)}`}
                          type="number"
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(e) =>
                            cart.quantity(item, Number(e.target.value))
                          }
                          className="h-9 w-16"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {money(item.quantity * item.unitPrice)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {money(item.unitPrice)} / unidade
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => cart.remove(item)}
                    aria-label={`Remover ${item.name}`}
                    className="self-start rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          </div>
          <aside className="self-start rounded-2xl border border-border bg-muted/40 p-6">
            <h2 className="font-semibold">Sua seleção</h2>
            <div className="mt-6 flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal estimado</span>
              <span>{money(cartTotal(cart.items))}</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
              <span className="font-semibold">Total estimado</span>
              <strong className="text-xl">
                {money(cartTotal(cart.items))}
              </strong>
            </div>
            {settings.attendants.length > 0 && (
              <div className="mt-6">
                <label htmlFor="attendant" className="field-label">
                  Com quem você quer falar?
                </label>
                <Select
                  id="attendant"
                  value={attendant}
                  onChange={(e) => setAttendant(e.target.value)}
                >
                  <option value="">Atendimento da loja</option>
                  {settings.attendants.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Button
              variant="whatsapp"
              disabled={busy}
              onClick={send}
              className="mt-5 h-auto min-h-13 w-full whitespace-normal py-3"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <MessageCircle />
              )}
              Enviar carrinho pelo WhatsApp
            </Button>
            <div className="mt-5 flex gap-2 text-xs leading-6 text-muted-foreground">
              <ShieldCheck className="mt-1 size-4 shrink-0" />
              <p>
                Vamos conferir os produtos e preços antes de abrir o WhatsApp.
                Esta seleção não confirma nem reserva uma compra.
              </p>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Disponibilidade, pagamento e entrega serão combinados com a
              vendedora.
            </p>
          </aside>
        </div>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="mb-2 text-lg font-semibold">
            Alterar seleção
          </DialogTitle>
          <DialogDescription className="mb-6 text-sm text-muted-foreground">
            {editing?.name}. Escolha uma combinação cadastrada e a quantidade
            desejada.
          </DialogDescription>
          {product && editing ? (
            <ProductPurchase
              key={lineKey(editing)}
              product={product}
              initialVariant={editing.variantId}
              initialQuantity={editing.quantity}
              onSelect={(line) => {
                cart.remove(editing);
                cart.add(line);
                setEditing(null);
              }}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando opções…
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
