"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus, Trash2 } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { settingsSchema } from "@/lib/validations";
import { saveSettings } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ImageManager } from "./image-manager";
export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [success, setSuccess] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  const attendants = useFieldArray({ control, name: "attendants" }),
    socials = useFieldArray({ control, name: "socialLinks" });
  return (
    <form
      onSubmit={handleSubmit(
        async (data) => {
          setMessage("");
          const result = await saveSettings(data);
          setSuccess(result.ok);
          setMessage(
            result.ok
              ? "Configurações salvas. O catálogo já está atualizado."
              : result.error,
          );
          if (result.ok) router.refresh();
        },
        () => {
          setSuccess(false);
          setMessage(
            "Confira os campos, números de WhatsApp e links informados.",
          );
        },
      )}
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="section-title">Configurações da loja</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sua marca, seus contatos e a vitrine do catálogo.
          </p>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Save />
          Salvar configurações
        </Button>
      </div>
      {message && (
        <p
          role="status"
          className={`mb-6 rounded-xl p-4 text-sm ${success ? "bg-green-50 text-green-800" : "bg-red-50 text-destructive"}`}
        >
          {message}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel space-y-5">
          <h2 className="font-semibold">Identidade da loja</h2>
          <div>
            <label htmlFor="storeName" className="field-label">
              Nome da loja
            </label>
            <Input id="storeName" {...register("storeName")} />
            <p className="field-error">{errors.storeName?.message}</p>
          </div>
          <div>
            <label htmlFor="store-description" className="field-label">
              Descrição
            </label>
            <Textarea id="store-description" {...register("description")} />
          </div>
          <div>
            <label className="field-label">Logotipo</label>
            <Controller
              control={control}
              name="logo"
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
            <label htmlFor="contact" className="field-label">
              Informações de contato
            </label>
            <Textarea id="contact" {...register("contactInformation")} />
          </div>
        </section>
        <section className="panel space-y-5">
          <h2 className="font-semibold">Banner da página inicial</h2>
          <div>
            <label htmlFor="banner-title" className="field-label">
              Título
            </label>
            <Textarea id="banner-title" {...register("bannerTitle")} />
            <p className="field-error">{errors.bannerTitle?.message}</p>
          </div>
          <div>
            <label htmlFor="banner-subtitle" className="field-label">
              Subtítulo
            </label>
            <Textarea id="banner-subtitle" {...register("bannerSubtitle")} />
          </div>
          <div>
            <label className="field-label">Imagem de fundo (opcional)</label>
            <Controller
              control={control}
              name="banner"
              render={({ field }) => (
                <ImageManager
                  max={1}
                  value={field.value ? [field.value] : []}
                  onChange={(images) => field.onChange(images[0])}
                />
              )}
            />
          </div>
        </section>
        <section className="panel space-y-5">
          <h2 className="font-semibold">WhatsApp e atendimento</h2>
          <div>
            <label htmlFor="whatsapp" className="field-label">
              WhatsApp principal
            </label>
            <Input
              id="whatsapp"
              inputMode="tel"
              {...register("whatsappNumber")}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              DDI + DDD + número, sem espaços ou símbolos.
            </p>
            <p className="field-error">{errors.whatsappNumber?.message}</p>
          </div>
          <div>
            <label htmlFor="whatsapp-message" className="field-label">
              Mensagem inicial do carrinho
            </label>
            <Textarea id="whatsapp-message" {...register("whatsappMessage")} />
            <p className="field-error">{errors.whatsappMessage?.message}</p>
          </div>
          <h3 className="pt-3 text-sm font-semibold">Atendentes</h3>
          {attendants.fields.map((a, index) => (
            <div key={a.id} className="flex items-end gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`a-name-${index}`} className="field-label">
                    Nome
                  </label>
                  <Input
                    id={`a-name-${index}`}
                    {...register(`attendants.${index}.name`)}
                  />
                </div>
                <div>
                  <label htmlFor={`a-number-${index}`} className="field-label">
                    WhatsApp
                  </label>
                  <Input
                    id={`a-number-${index}`}
                    inputMode="tel"
                    {...register(`attendants.${index}.number`)}
                  />
                  <p className="field-error">
                    {errors.attendants?.[index]?.number?.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remover atendente ${index + 1}`}
                onClick={() => attendants.remove(index)}
                className="p-3 text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => attendants.append({ name: "", number: "" })}
          >
            <Plus />
            Adicionar atendente
          </Button>
        </section>
        <section className="panel space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Redes sociais</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => socials.append({ label: "", url: "" })}
            >
              <Plus />
              Link
            </Button>
          </div>
          {socials.fields.map((s, index) => (
            <div key={s.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <label
                    htmlFor={`social-label-${index}`}
                    className="field-label"
                  >
                    Nome da rede
                  </label>
                  <Input
                    id={`social-label-${index}`}
                    {...register(`socialLinks.${index}.label`)}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`social-url-${index}`}
                    className="field-label"
                  >
                    Link completo
                  </label>
                  <Input
                    id={`social-url-${index}`}
                    type="url"
                    placeholder="https://…"
                    {...register(`socialLinks.${index}.url`)}
                  />
                  <p className="field-error">
                    {errors.socialLinks?.[index]?.url?.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remover link ${index + 1}`}
                onClick={() => socials.remove(index)}
                className="p-3 text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {!socials.fields.length && (
            <p className="text-sm leading-6 text-muted-foreground">
              Adicione os links oficiais da loja para exibi-los no rodapé.
            </p>
          )}
        </section>
      </div>
      <Button disabled={isSubmitting} type="submit" className="mt-7">
        <Save />
        Salvar configurações
      </Button>
    </form>
  );
}
