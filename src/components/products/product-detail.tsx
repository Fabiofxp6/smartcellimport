"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Check, Minus, Plus, MessageCircle } from "lucide-react";
import type { Product, CartLine } from "@/lib/types";
import { money } from "@/lib/utils";
import { productPrice } from "@/features/cart/cart";
import { useCart } from "@/features/cart/store";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
export function ProductGallery({ product }: { product: Product }) {
  const images = [...product.images].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  );
  const [index, setIndex] = useState(0);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
        {images[index] && (
          <Image
            src={images[index].secureUrl}
            alt={images[index].alt || product.name}
            fill
            priority
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-contain p-8"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((image, i) => (
            <button
              key={image.publicId}
              aria-label={`Ver imagem ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
              className={`relative size-18 overflow-hidden rounded-xl border-2 ${index === i ? "border-primary" : "border-transparent"} bg-muted`}
            >
              <Image
                src={image.secureUrl}
                alt={image.alt || product.name}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export function ProductPurchase({
  product,
  onSelect,
  initialVariant,
  initialQuantity = 1,
}: {
  product: Product;
  onSelect?: (line: CartLine) => void;
  initialVariant?: string;
  initialQuantity?: number;
}) {
  const [variantId, setVariantId] = useState(initialVariant || ""),
    [quantity, setQuantity] = useState(initialQuantity),
    [added, setAdded] = useState(false),
    [error, setError] = useState("");
  const cart = useCart();
  const price = productPrice(product, variantId);
  const variant = product.variants.find((v) => v.id === variantId);
  function add() {
    if (product.variants.length && !variant) {
      setError("Selecione uma das combinações disponíveis.");
      return;
    }
    const line: CartLine = {
      productId: product.id,
      variantId: variant?.id,
      quantity,
      name: product.name,
      slug: product.slug,
      unitPrice: price,
      image: (product.images.find((i) => i.isPrimary) || product.images[0])
        ?.secureUrl,
      attributes: variant?.attributes || [],
    };
    try {
      if (onSelect) onSelect(line);
      else cart.add(line);
      setError("");
      setAdded(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <strong className="text-3xl tracking-tight">{money(price)}</strong>
        {product.promotionalPrice !== undefined &&
          variant?.priceOverride === undefined && (
            <del className="pb-1 text-sm text-muted-foreground">
              {money(product.basePrice)}
            </del>
          )}
      </div>
      <p className="mb-7 text-xs text-muted-foreground">
        Valor estimado. Confirme os detalhes com a nossa equipe.
      </p>
      {product.variants.length > 0 && (
        <div className="mb-6">
          <label htmlFor={`variant-${product.id}`} className="field-label">
            Escolha a combinação
          </label>
          <Select
            id={`variant-${product.id}`}
            value={variantId}
            onChange={(e) => {
              setVariantId(e.target.value);
              setAdded(false);
            }}
            required
          >
            <option value="">Selecione uma opção</option>
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.attributes.map((a) => `${a.name}: ${a.value}`).join(" · ")}
                {v.priceOverride !== undefined
                  ? ` — ${money(v.priceOverride)}`
                  : ""}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Mostramos somente as combinações cadastradas no catálogo.
          </p>
        </div>
      )}
      <label htmlFor={`quantity-${product.id}`} className="field-label">
        Quantidade desejada
      </label>
      <div className="flex flex-wrap gap-3">
        <div className="flex h-12 w-36 items-center rounded-xl border border-border">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={quantity <= 1}
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex size-11 items-center justify-center disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <Input
            id={`quantity-${product.id}`}
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.min(
                  99,
                  Math.max(1, Math.trunc(Number(e.target.value)) || 1),
                ),
              )
            }
            className="w-13 border-0 px-0 text-center shadow-none"
          />
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={quantity >= 99}
            onClick={() => setQuantity(Math.min(99, quantity + 1))}
            className="flex size-11 items-center justify-center disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button onClick={add} className="h-12 flex-1">
          {added ? (
            <>
              <Check />
              Adicionado ao carrinho
            </>
          ) : (
            <>
              <ShoppingBag />
              {onSelect ? "Salvar combinação" : "Adicionar ao carrinho"}
            </>
          )}
        </Button>
      </div>
      <p role="alert" className="mt-2 text-xs text-destructive">
        {error}
      </p>
      {added && !onSelect && (
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href="/carrinho">Ver meu carrinho</Link>
        </Button>
      )}
      <div className="mt-6 flex gap-3 rounded-xl bg-[#f0f3ec] p-4 text-xs leading-6 text-[#476144]">
        <MessageCircle className="mt-1 size-5 shrink-0" />
        <p>
          Este é um carrinho de interesse. A disponibilidade, o pagamento e a
          entrega são combinados diretamente pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}
