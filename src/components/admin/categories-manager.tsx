"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Shapes, Save } from "lucide-react";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { saveCategory, deleteCategory } from "@/features/admin/actions";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageManager } from "./image-manager";
function CategoryForm({
  category,
  onSaved,
}: {
  category?: Category;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category || {
      name: "",
      slug: "",
      description: "",
      published: true,
      sortOrder: 0,
      filterableAttributes: [],
    },
  });
  return (
    <form
      className="mt-6 space-y-5"
      onSubmit={handleSubmit(
        async (data) => {
          const result = await saveCategory(data, category?.id);
          if (result.ok) onSaved();
          else setError(result.error);
        },
        () => setError("Confira os campos da categoria."),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cat-name" className="field-label">
            Nome
          </label>
          <Input
            id="cat-name"
            {...register("name")}
            onBlur={() => {
              if (!getValues("slug"))
                setValue("slug", slugify(getValues("name")));
            }}
          />
          <p className="field-error">{errors.name?.message}</p>
        </div>
        <div>
          <label htmlFor="cat-slug" className="field-label">
            Slug
          </label>
          <Input id="cat-slug" {...register("slug")} />
          <p className="field-error">{errors.slug?.message}</p>
        </div>
      </div>
      <div>
        <label htmlFor="cat-description" className="field-label">
          Descrição
        </label>
        <Textarea id="cat-description" {...register("description")} />
      </div>
      <div>
        <label className="field-label">Imagem da categoria</label>
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <ImageManager
              max={1}
              value={field.value ? [field.value] : []}
              onChange={(images) => field.onChange(images[0])}
            />
          )}
        />
      </div>
      <div>
        <label htmlFor="filters" className="field-label">
          Atributos que podem ser filtrados
        </label>
        <Controller
          control={control}
          name="filterableAttributes"
          render={({ field }) => (
            <Input
              id="filters"
              defaultValue={field.value.join(", ")}
              onChange={(e) =>
                field.onChange(
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Modelo, Cor, Material"
            />
          )}
        />
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Use os mesmos nomes dos atributos dos produtos, separados por
          vírgulas.
        </p>
      </div>
      <div>
        <label htmlFor="cat-order" className="field-label">
          Ordem de exibição
        </label>
        <Input
          id="cat-order"
          type="number"
          min={0}
          max={9999}
          {...register("sortOrder", { valueAsNumber: true })}
        />
        <p className="field-error">{errors.sortOrder?.message}</p>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          {...register("published")}
          className="size-4 accent-primary"
        />
        Categoria publicada
      </label>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <Button disabled={isSubmitting} type="submit" className="w-full">
        <Save />
        Salvar categoria
      </Button>
    </form>
  );
}
export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | "new" | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function remove(c: Category) {
    if (
      !window.confirm(
        `Excluir a categoria “${c.name}”? Produtos associados precisam ser movidos antes.`,
      )
    )
      return;
    setBusy(true);
    const result = await deleteCategory(c.id);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else {
      setError("");
      router.refresh();
    }
  }
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="section-title">Categorias</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Organize a navegação e os filtros do catálogo.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus />
          Nova categoria
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <section className="panel">
        {categories.length ? (
          <div className="divide-y divide-border">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 py-5"
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-primary">
                    {c.sortOrder}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{c.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{c.slug} · {c.published ? "Publicada" : "Oculta"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label={`Editar categoria ${c.name}`}
                    onClick={() => setEditing(c)}
                    className="rounded-lg p-2 hover:bg-muted"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    disabled={busy}
                    aria-label={`Excluir categoria ${c.name}`}
                    onClick={() => remove(c)}
                    className="rounded-lg p-2 text-destructive hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center">
            <Shapes className="mx-auto mb-4 size-9 text-primary/30" />
            <h2 className="font-semibold">Crie a primeira categoria</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              As categorias ajudam seus clientes a encontrar os produtos.
            </p>
          </div>
        )}
      </section>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">
            {editing === "new" ? "Nova categoria" : "Editar categoria"}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            Configure os detalhes e a visibilidade no catálogo.
          </DialogDescription>
          {editing && (
            <CategoryForm
              key={editing === "new" ? "new" : editing.id}
              category={editing === "new" ? undefined : editing}
              onSaved={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
