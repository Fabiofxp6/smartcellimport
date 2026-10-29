"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Save, LoaderCircle, ArrowLeft } from "lucide-react";
import type { Product, Category } from "@/lib/types";
import { productSchema, type ProductInput } from "@/lib/validations";
import { slugify, parseMoney, priceInput } from "@/lib/utils";
import { saveProduct } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { ImageManager } from "./image-manager";
export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: "",
      slug: "",
      description: "",
      categoryId: "",
      basePrice: 0,
      sku: "",
      images: [],
      keywords: [],
      attributes: [],
      variants: [],
      published: false,
      featured: false,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = form;
  const attributes = useFieldArray({ control, name: "attributes" }),
    variants = useFieldArray({ control, name: "variants", keyName: "formKey" });
  // Values are required here to keep the registered-combination editor in sync with attribute changes.
  const currentAttrs = useWatch({ control, name: "attributes" });
  const errorText = (key: keyof ProductInput) => errors[key]?.message;
  return (
    <form
      onSubmit={handleSubmit(
        async (data) => {
          setError("");
          const result = await saveProduct(data, product?.id);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/admin/produtos");
          router.refresh();
        },
        () =>
          setError(
            "Confira os campos destacados. Verifique também as imagens e combinações.",
          ),
      )}
    >
      <Link
        href="/admin/produtos"
        className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar aos produtos
      </Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="section-title">
            {product ? "Editar produto" : "Novo produto"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Preencha os detalhes que seus clientes precisam conhecer.
          </p>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
          Salvar produto
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
      <div className="grid gap-6 xl:grid-cols-[1fr_290px]">
        <div className="min-w-0 space-y-6">
          <section className="panel">
            <h2 className="mb-6 font-semibold">Informações do produto</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="field-label">
                  Nome do produto
                </label>
                <Input
                  id="name"
                  {...register("name")}
                  onBlur={() => {
                    if (!getValues("slug"))
                      setValue("slug", slugify(getValues("name")));
                  }}
                />
                <p className="field-error">{errorText("name")}</p>
              </div>
              <div>
                <label htmlFor="slug" className="field-label">
                  Slug da página
                </label>
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder="nome-do-produto"
                />
                <p className="field-error">{errorText("slug")}</p>
              </div>
              <div>
                <label htmlFor="description" className="field-label">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  rows={5}
                  {...register("description")}
                />
                <p className="field-error">{errorText("description")}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="categoryId" className="field-label">
                    Categoria
                  </label>
                  <Select id="categoryId" {...register("categoryId")}>
                    <option value="">Selecione uma categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {!c.published ? " (oculta)" : ""}
                      </option>
                    ))}
                  </Select>
                  <p className="field-error">{errorText("categoryId")}</p>
                  {!categories.length && (
                    <Link
                      href="/admin/categorias"
                      className="mt-2 inline-block text-xs text-primary underline"
                    >
                      Crie uma categoria primeiro
                    </Link>
                  )}
                </div>
                <div>
                  <label htmlFor="sku" className="field-label">
                    SKU (opcional)
                  </label>
                  <Input id="sku" {...register("sku")} />
                </div>
              </div>
              <div>
                <label htmlFor="keywords" className="field-label">
                  Palavras-chave
                </label>
                <Controller
                  name="keywords"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="keywords"
                      defaultValue={field.value.join(", ")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean),
                        )
                      }
                      placeholder="silicone, iPhone 17, presente"
                    />
                  )}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Separe por vírgulas. Inclua modelos compatíveis e termos de
                  busca.
                </p>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2 className="mb-5 font-semibold">Imagens</h2>
            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <ImageManager value={field.value} onChange={field.onChange} />
              )}
            />
            <p className="field-error">{errorText("images")}</p>
          </section>
          <section className="panel">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Atributos</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Modelo, cor, capacidade ou outras características.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => attributes.append({ name: "", values: [] })}
              >
                <Plus />
                Atributo
              </Button>
            </div>
            <div className="space-y-4">
              {attributes.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-muted/60 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`attr-name-${index}`}
                        className="field-label"
                      >
                        Nome
                      </label>
                      <Input
                        id={`attr-name-${index}`}
                        placeholder="Cor"
                        {...register(`attributes.${index}.name`)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`attr-values-${index}`}
                        className="field-label"
                      >
                        Valores, separados por vírgulas
                      </label>
                      <Controller
                        control={control}
                        name={`attributes.${index}.values`}
                        render={({ field }) => (
                          <Input
                            id={`attr-values-${index}`}
                            defaultValue={field.value.join(", ")}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .split(",")
                                  .map((v) => v.trim())
                                  .filter(Boolean),
                              )
                            }
                            placeholder="Rosa, Preta, Azul"
                          />
                        )}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover atributo ${index + 1}`}
                    className="self-end p-3 text-destructive"
                    onClick={() => attributes.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="field-error">{errorText("attributes")}</p>
          </section>
          <section className="panel">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Combinações de variações</h2>
                <p className="mt-2 max-w-lg text-xs leading-6 text-muted-foreground">
                  Cadastre cada combinação que deseja oferecer. Atributos sem
                  variações são apenas informativos. Se mudar um atributo,
                  revise as combinações.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!currentAttrs.length}
                onClick={() =>
                  variants.append({
                    id: crypto.randomUUID(),
                    sku: "",
                    attributes: currentAttrs.map((a) => ({
                      name: a.name,
                      value: "",
                    })),
                  })
                }
              >
                <Plus />
                Combinação
              </Button>
            </div>
            <div className="space-y-4">
              {variants.fields.map((field, index) => (
                <div
                  key={field.formKey}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-semibold">
                      Combinação {index + 1}
                    </h3>
                    <button
                      type="button"
                      aria-label={`Remover combinação ${index + 1}`}
                      onClick={() => variants.remove(index)}
                      className="p-1 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field.attributes.map((a, n) => (
                      <div key={`${index}-${n}`}>
                        <label
                          htmlFor={`variant-${index}-${n}`}
                          className="field-label"
                        >
                          {a.name || "Atributo sem nome"}
                        </label>
                        <Select
                          id={`variant-${index}-${n}`}
                          {...register(
                            `variants.${index}.attributes.${n}.value`,
                          )}
                        >
                          <option value="">Selecione</option>
                          {currentAttrs
                            .find((attr) => attr.name === a.name)
                            ?.values.map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                        </Select>
                      </div>
                    ))}
                    <div>
                      <label htmlFor={`v-sku-${index}`} className="field-label">
                        SKU (opcional)
                      </label>
                      <Input
                        id={`v-sku-${index}`}
                        {...register(`variants.${index}.sku`)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`v-price-${index}`}
                        className="field-label"
                      >
                        Preço específico R$ (opcional)
                      </label>
                      <Controller
                        control={control}
                        name={`variants.${index}.priceOverride`}
                        render={({ field }) => (
                          <Input
                            id={`v-price-${index}`}
                            inputMode="decimal"
                            defaultValue={priceInput(field.value)}
                            onChange={(e) =>
                              field.onChange(parseMoney(e.target.value))
                            }
                            placeholder="Usar preço do produto"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="field-error">{errorText("variants")}</p>
            {errors.variants && (
              <p className="field-error">
                Revise os atributos, os valores, os preços e possíveis
                combinações repetidas.
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="panel">
            <h2 className="mb-6 font-semibold">Preços</h2>
            <div>
              <label htmlFor="basePrice" className="field-label">
                Preço base (R$)
              </label>
              <Controller
                control={control}
                name="basePrice"
                render={({ field }) => (
                  <Input
                    id="basePrice"
                    inputMode="decimal"
                    defaultValue={priceInput(field.value)}
                    onChange={(e) => field.onChange(parseMoney(e.target.value))}
                  />
                )}
              />
              <p className="field-error">{errorText("basePrice")}</p>
            </div>
            <div className="mt-5">
              <label htmlFor="promotionalPrice" className="field-label">
                Preço promocional (R$)
              </label>
              <Controller
                control={control}
                name="promotionalPrice"
                render={({ field }) => (
                  <Input
                    id="promotionalPrice"
                    inputMode="decimal"
                    defaultValue={priceInput(field.value)}
                    onChange={(e) => field.onChange(parseMoney(e.target.value))}
                    placeholder="Opcional"
                  />
                )}
              />
              <p className="field-error">{errorText("promotionalPrice")}</p>
            </div>
          </section>
          <section className="panel">
            <h2 className="mb-6 font-semibold">Publicação</h2>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                {...register("published")}
                className="size-4 accent-primary"
              />
              Publicado no catálogo
            </label>
            <p className="mt-2 ml-7 text-xs leading-6 text-muted-foreground">
              A categoria também precisa estar publicada para o produto
              aparecer.
            </p>
            <label className="mt-5 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                {...register("featured")}
                className="size-4 accent-primary"
              />
              Produto em destaque
            </label>
          </section>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Save />
            Salvar produto
          </Button>
        </aside>
      </div>
    </form>
  );
}
