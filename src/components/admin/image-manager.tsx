"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ImageManager({
  value,
  onChange,
  max = 12,
}: {
  value: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  max?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState("");
  const organize = (items: ProductImage[]) =>
    onChange(
      items.map((i, index) => ({
        ...i,
        sortOrder: index,
        isPrimary: items.some((a) => a.isPrimary) ? i.isPrimary : index === 0,
      })),
    );
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const images = [...value];
    try {
      for (const file of Array.from(files).slice(0, max - value.length)) {
        if (file.size > 3 * 1024 * 1024)
          throw new Error("Cada imagem deve ter até 3 MB.");
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        try {
          const form = new FormData();
          form.set("file", file);
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: form,
          });
          const image = await res.json();
          if (!res.ok) throw new Error(image.error);
          images.push({
            ...image,
            sortOrder: images.length,
            isPrimary: images.length === 0,
          });
          onChange([...images]);
        } finally {
          URL.revokeObjectURL(objectUrl);
          setPreview("");
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {value.map((image, index) => (
          <div
            key={image.publicId}
            className="w-36 rounded-xl border border-border p-2"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image
                src={image.secureUrl}
                alt={image.alt}
                fill
                sizes="140px"
                className="object-contain"
              />
              {image.isPrimary && (
                <span className="absolute top-1 left-1 rounded bg-white p-1 text-primary">
                  <Star className="size-3 fill-current" />
                </span>
              )}
            </div>
            <Input
              aria-label={`Descrição da imagem ${index + 1}`}
              value={image.alt}
              onChange={(e) =>
                onChange(
                  value.map((i, n) =>
                    n === index ? { ...i, alt: e.target.value } : i,
                  ),
                )
              }
              placeholder="Descrição acessível"
              className="mt-2 h-8 text-xs"
            />
            <div className="mt-2 flex justify-between">
              <button
                type="button"
                disabled={busy}
                aria-label={`Definir imagem ${index + 1} como principal`}
                onClick={() =>
                  onChange(
                    value.map((i, n) => ({ ...i, isPrimary: n === index })),
                  )
                }
                className="p-1"
              >
                <Star className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={busy || index === 0}
                aria-label="Mover imagem para a esquerda"
                onClick={() => {
                  const copy = [...value];
                  [copy[index - 1], copy[index]] = [
                    copy[index],
                    copy[index - 1],
                  ];
                  organize(copy);
                }}
                className="p-1 disabled:opacity-25"
              >
                <ArrowLeft className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={busy || index === value.length - 1}
                aria-label="Mover imagem para a direita"
                onClick={() => {
                  const copy = [...value];
                  [copy[index + 1], copy[index]] = [
                    copy[index],
                    copy[index + 1],
                  ];
                  organize(copy);
                }}
                className="p-1 disabled:opacity-25"
              >
                <ArrowRight className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={busy}
                aria-label={`Remover imagem ${index + 1}`}
                onClick={() => {
                  const copy = value.filter((_, n) => n !== index);
                  if (image.isPrimary && copy[0])
                    copy[0] = { ...copy[0], isPrimary: true };
                  organize(copy);
                }}
                className="p-1 text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {preview && (
          <div className="relative size-36 overflow-hidden rounded-xl bg-muted">
            {/* Local blob URLs are only used during upload. */}
            <Image
              src={preview}
              alt="Prévia do arquivo selecionado"
              fill
              unoptimized
              className="object-contain opacity-50"
            />
            <LoaderCircle className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        hidden
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || value.length >= max}
        onClick={() => ref.current?.click()}
        className="mt-4"
      >
        {busy ? <LoaderCircle className="animate-spin" /> : <Upload />}
        {busy ? "Enviando…" : "Enviar imagens"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        JPEG, PNG ou WebP · Até 3 MB por imagem · {value.length}/{max}
      </p>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
