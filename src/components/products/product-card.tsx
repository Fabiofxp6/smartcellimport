"use client";
import Image from "next/image";
import Link from "next/link";
import { Check, Plus, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/utils";
import { productPrice } from "@/features/cart/cart";
import { useCart } from "@/features/cart/store";
import { Button } from "@/components/ui/button";
export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const [added, setAdded] = useState(false),
    [error, setError] = useState("");
  const image = product.images.find((i) => i.isPrimary) || product.images[0];
  const price = productPrice(product);
  function add() {
    try {
      cart.add({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: image?.secureUrl,
        unitPrice: price,
        attributes: [],
        quantity: 1,
      });
      setAdded(true);
      setError("");
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <article className="group min-w-0">
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-[#f1f2f6]"
      >
        {image && (
          <Image
            src={image.secureUrl}
            alt={image.alt || product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {product.promotionalPrice !== undefined ? (
          <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-primary">
            PREÇO ESPECIAL
          </span>
        ) : (
          product.featured && (
            <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-primary">
              DESTAQUE
            </span>
          )
        )}
        <span className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full bg-white text-primary transition-transform group-hover:-rotate-45">
          <ArrowUpRight className="size-4" />
        </span>
      </Link>
      <div className="pt-4">
        <Link
          href={
            product.category
              ? `/categoria/${product.category.slug}`
              : "/catalogo"
          }
          className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase"
        >
          {product.category?.name || "Catálogo"}
        </Link>
        <Link
          href={`/produto/${product.slug}`}
          className="mt-1.5 block text-sm font-semibold leading-6"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <span className="text-base font-bold">{money(price)}</span>
          {product.promotionalPrice !== undefined && (
            <del className="text-xs text-muted-foreground">
              {money(product.basePrice)}
            </del>
          )}
        </div>
        <div className="mt-3">
          {product.variants.length ? (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/produto/${product.slug}`}>
                Escolher opções
                <Plus />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={add}
            >
              {added ? (
                <>
                  <Check />
                  Adicionado
                </>
              ) : (
                <>
                  <Plus />
                  Adicionar
                </>
              )}
            </Button>
          )}
          <p role="status" className="mt-1 text-xs text-destructive">
            {error}
          </p>
        </div>
      </div>
    </article>
  );
}
