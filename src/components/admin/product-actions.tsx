"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { deleteProduct, setProductPublished } from "@/features/admin/actions";
export function ProductActions({
  id,
  published,
  name,
}: {
  id: string;
  published: boolean;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function act(remove = false) {
    if (
      remove &&
      !window.confirm(`Excluir “${name}”? Esta ação não pode ser desfeita.`)
    )
      return;
    setBusy(true);
    const result = remove
      ? await deleteProduct(id)
      : await setProductPublished(id, !published);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else {
      setError("");
      router.refresh();
    }
  }
  return (
    <div>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/admin/produtos/${id}/editar`}
          aria-label={`Editar ${name}`}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <Pencil className="size-4" />
        </Link>
        <button
          disabled={busy}
          onClick={() => act()}
          aria-label={published ? `Ocultar ${name}` : `Publicar ${name}`}
          className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"
        >
          {published ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
        <button
          disabled={busy}
          onClick={() => act(true)}
          aria-label={`Excluir ${name}`}
          className="rounded-lg p-2 text-destructive hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="field-error max-w-48">
          {error}
        </p>
      )}
    </div>
  );
}
