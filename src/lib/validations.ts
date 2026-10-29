import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Identificador inválido.");
const text = (max = 200) => z.string().trim().max(max);
const slug = z
  .string()
  .trim()
  .min(1)
  .max(140)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use letras minúsculas, números e hífens.",
  );
export const cents = z.number().int().min(0).max(100_000_000);
export const imageSchema = z.object({
  publicId: text(300).min(1),
  secureUrl: z
    .string()
    .url()
    .refine((url) => {
      try {
        return (
          new URL(url).hostname === "res.cloudinary.com" &&
          new URL(url).protocol === "https:"
        );
      } catch {
        return false;
      }
    }, "Use uma imagem enviada pelo painel."),
  alt: text(300),
  sortOrder: z.number().int().min(0).max(20),
  isPrimary: z.boolean(),
});
const attributeSchema = z.object({
  name: text(60).min(1),
  values: z.array(text(100).min(1)).min(1).max(100),
});
export const variantSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  sku: text(100).optional(),
  attributes: z
    .array(z.object({ name: text(60).min(1), value: text(100).min(1) }))
    .min(1)
    .max(15),
  priceOverride: cents.optional(),
});
export const productSchema = z
  .object({
    name: text(160).min(2, "Informe o nome."),
    slug,
    description: text(10_000).min(5),
    categoryId: objectId,
    basePrice: cents,
    promotionalPrice: cents.optional(),
    sku: text(100).optional(),
    images: z.array(imageSchema).min(1, "Envie pelo menos uma imagem.").max(12),
    keywords: z.array(text(80).min(1)).max(40),
    attributes: z.array(attributeSchema).max(15),
    variants: z.array(variantSchema).max(200),
    published: z.boolean(),
    featured: z.boolean(),
  })
  .superRefine((p, ctx) => {
    const issue = (message: string, path: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (p.promotionalPrice !== undefined && p.promotionalPrice >= p.basePrice)
      issue(
        "O preço promocional deve ser menor que o preço base.",
        "promotionalPrice",
      );
    if (p.images.filter((i) => i.isPrimary).length !== 1)
      issue("Escolha uma imagem principal.", "images");
    const names = p.attributes.map((a) => a.name.toLowerCase());
    if (new Set(names).size !== names.length)
      issue("Não repita nomes de atributos.", "attributes");
    if (p.attributes.some((a) => new Set(a.values).size !== a.values.length))
      issue("Não repita valores de um atributo.", "attributes");
    const ids = new Set<string>(),
      combinations = new Set<string>();
    for (const v of p.variants) {
      if (ids.has(v.id))
        issue("Identificador de variação repetido.", "variants");
      ids.add(v.id);
      const combination = v.attributes
        .map((a) => `${a.name}:${a.value}`)
        .sort()
        .join("|");
      if (combinations.has(combination))
        issue("Combinação de variação repetida.", "variants");
      combinations.add(combination);
      if (
        new Set(v.attributes.map((a) => a.name)).size !== v.attributes.length ||
        v.attributes.length !== p.attributes.length ||
        v.attributes.some(
          (a) =>
            !p.attributes
              .find((b) => b.name === a.name)
              ?.values.includes(a.value),
        )
      )
        issue(
          "Cada variação deve conter exatamente um valor cadastrado para cada atributo.",
          "variants",
        );
    }
  });
export const categorySchema = z.object({
  name: text(100).min(2),
  slug,
  description: text(2000),
  image: imageSchema.optional(),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  filterableAttributes: z.array(text(60).min(1)).max(15),
});
const phone = z
  .string()
  .regex(/^\d{10,15}$/, "Informe DDI + DDD + número, somente dígitos.");
export const settingsSchema = z.object({
  storeName: text(100).min(2),
  description: text(600),
  logo: imageSchema.optional(),
  banner: imageSchema.optional(),
  bannerTitle: text(150).min(2),
  bannerSubtitle: text(500),
  whatsappNumber: phone,
  whatsappMessage: text(1000).min(5),
  attendants: z
    .array(z.object({ name: text(80).min(2), number: phone }))
    .max(10),
  socialLinks: z
    .array(
      z.object({
        label: text(80).min(1),
        url: z
          .string()
          .url()
          .refine((u) => u.startsWith("https://"), "Use https://."),
      }),
    )
    .max(10),
  contactInformation: text(1000),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(256),
});
export const cartInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: text(80).min(1).optional(),
        quantity: z.number().int().min(1).max(99),
        expectedPrice: cents,
        expectedAttributes: z
          .array(z.object({ name: text(60).min(1), value: text(100).min(1) }))
          .max(15)
          .optional(),
      }),
    )
    .min(1)
    .max(50),
  attendant: z.string().max(80).optional(),
});
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
