import { describe, it, expect } from "vitest";
import {
  addLine,
  cartTotal,
  whatsappLink,
  productPrice,
} from "@/features/cart/cart";
import { reconcileCart } from "@/features/cart/revalidate";
import { buildSearchTokens, searchTerms } from "@/features/products/search";
import {
  productSchema,
  categorySchema,
  settingsSchema,
  cartInputSchema,
} from "@/lib/validations";
import { parseMoney, slugify } from "@/lib/utils";
import { detectImage } from "@/lib/cloudinary";
import { defaultSettings } from "@/lib/defaults";
import { fixture } from "./fixtures";
const input = {
  productId: fixture.id,
  variantId: "rosa",
  quantity: 2,
  expectedPrice: 3990,
  expectedAttributes: fixture.variants[0].attributes,
};
const line = reconcileCart([input], [fixture]).items[0];
describe("carrinho e WhatsApp", () => {
  it("agrupa somente a mesma combinação e limita a quantidade desejada", () => {
    expect(addLine([line], line)[0].quantity).toBe(4);
    expect(addLine([{ ...line, quantity: 98 }], line)[0].quantity).toBe(99);
    expect(addLine([line], { ...line, variantId: "preta" })).toHaveLength(2);
  });
  it("soma em centavos sem perda de precisão", () => {
    expect(cartTotal([line, { ...line, quantity: 1, unitPrice: 6990 }])).toBe(
      14970,
    );
  });
  it("aplica preço da variação, promoção e preço base na ordem correta", () => {
    expect(productPrice({ ...fixture, promotionalPrice: 3590 }, "preta")).toBe(
      4590,
    );
    expect(productPrice({ ...fixture, promotionalPrice: 3590 }, "rosa")).toBe(
      3590,
    );
    expect(productPrice(fixture, "rosa")).toBe(3990);
  });
  it("revalida preços e usa os dados reais do servidor", () => {
    const result = reconcileCart([{ ...input, expectedPrice: 1 }], [fixture]);
    expect(result.changed).toBe(true);
    expect(result.items[0].unitPrice).toBe(3990);
    expect(result.items[0].attributes[0].value).toBe("iPhone 17");
  });
  it("retira produtos ocultos, removidos e variações inexistentes", () => {
    expect(
      reconcileCart([input], [{ ...fixture, published: false }]).items,
    ).toHaveLength(0);
    expect(
      reconcileCart([{ ...input, variantId: "inexistente" }], [fixture]).issues,
    ).toHaveLength(1);
    expect(reconcileCart([input], []).issues).toHaveLength(1);
  });
  it("não permite driblar o limite repetindo linhas", () => {
    expect(reconcileCart([input, input], [fixture]).issues).toHaveLength(1);
  });
  it("rejeita uma combinação cujo ID foi mantido mas os atributos mudaram", () => {
    const changed = {
      ...fixture,
      variants: [
        {
          ...fixture.variants[0],
          attributes: [
            { name: "Modelo", value: "iPhone 17" },
            { name: "Cor", value: "Preta" },
          ],
        },
      ],
    };
    expect(reconcileCart([input], [changed]).issues).toHaveLength(1);
    expect(reconcileCart([input], [changed]).items).toHaveLength(0);
  });
  it("codifica a mensagem, contatos e totais corretamente", () => {
    const link = whatsappLink("5582991065546", "Olá!", [line]);
    const url = new URL(link);
    expect(url.pathname).toBe("/5582991065546");
    expect(url.searchParams.get("text")).toContain("R$ 79,80");
    expect(url.searchParams.get("text")).toContain("Cor: Rosa");
    expect(url.searchParams.get("text")).toContain("Quantidade desejada: 2");
    expect(() => whatsappLink("javascript:alert(1)", "Olá", [line])).toThrow();
  });
});
describe("validação de dados", () => {
  it("valida o produto e rejeita preços fracionários e promoções maiores", () => {
    expect(productSchema.safeParse(fixture).success).toBe(true);
    expect(
      productSchema.safeParse({ ...fixture, basePrice: 39.9 }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({ ...fixture, promotionalPrice: 4000 }).success,
    ).toBe(false);
  });
  it("rejeita combinações inexistentes, incompletas e duplicadas", () => {
    const v = fixture.variants[0];
    expect(
      productSchema.safeParse({
        ...fixture,
        variants: [{ ...v, attributes: [{ name: "Cor", value: "Verde" }] }],
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        ...fixture,
        variants: [v, { ...v, id: "duplicada" }],
      }).success,
    ).toBe(false);
  });
  it("exige uma única imagem principal e URL de upload confiável", () => {
    expect(
      productSchema.safeParse({
        ...fixture,
        images: [{ ...fixture.images[0], isPrimary: false }],
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        ...fixture,
        images: [
          { ...fixture.images[0], secureUrl: "https://evil.test/test.png" },
        ],
      }).success,
    ).toBe(false);
  });
  it("rejeita filtros injetados, quantidades e identificadores inválidos", () => {
    expect(
      cartInputSchema.safeParse({ items: [{ ...input, quantity: 0 }] }).success,
    ).toBe(false);
    expect(
      cartInputSchema.safeParse({
        items: [{ ...input, productId: { $ne: null } }],
      }).success,
    ).toBe(false);
    expect(
      categorySchema.safeParse({ name: "Capas", slug: "duplicado com espaços" })
        .success,
    ).toBe(false);
  });
  it("valida os contatos iniciais sem inventar novas credenciais", () => {
    expect(settingsSchema.safeParse(defaultSettings).success).toBe(true);
    expect(defaultSettings.attendants).toHaveLength(3);
  });
});
describe("pesquisa, valores e arquivos", () => {
  it("gera índices para pesquisa parcial e sem acentos", () => {
    const tokens = buildSearchTokens(fixture, "Capas");
    expect(tokens).toEqual(
      expect.arrayContaining([
        "iphone",
        "17",
        "protecao",
        "silic",
        "capas",
        "rosa",
      ]),
    );
    expect(searchTerms("CÁPA iPhone 17")).toEqual(["capa", "iphone", "17"]);
  });
  it("converte valores monetários por partes inteiras", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("39.9")).toBe(3990);
    expect(parseMoney("0,01")).toBe(1);
    expect(parseMoney("")).toBeUndefined();
    expect(parseMoney("2,999")).toBeNaN();
    expect(slugify("Garrafa Térmica")).toBe("garrafa-termica");
  });
  it("identifica assinaturas e rejeita arquivos disfarçados", () => {
    expect(
      detectImage(new Uint8Array([255, 216, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
    ).toBe("image/jpeg");
    expect(
      detectImage(
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
      ),
    ).toBe("image/png");
    expect(detectImage(Buffer.from("RIFFxxxxWEBP"))).toBe("image/webp");
    expect(detectImage(Buffer.from("<svg>evil</svg>"))).toBeNull();
  });
});
