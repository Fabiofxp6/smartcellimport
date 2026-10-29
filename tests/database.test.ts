import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { hash, argon2id } from "argon2";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import {
  UserModel,
  ProductModel,
  CategoryModel,
  SettingsModel,
  MediaModel,
  RateLimitModel,
} from "@/models";
import { requireAdmin } from "@/lib/auth";
import { authenticateAdmin } from "@/features/auth/authenticate";
import {
  saveProduct,
  deleteProduct,
  setProductPublished,
  saveCategory,
  deleteCategory,
  saveSettings,
} from "@/features/admin/actions";
import { queryProducts } from "@/features/products/service";
import { POST as validateCart } from "@/app/api/carrinho/validar/route";
import { POST as uploadRoute } from "@/app/api/admin/upload/route";
import * as cloudinary from "@/lib/cloudinary";
import { defaultSettings } from "@/lib/defaults";
import { fixture, image } from "./fixtures";
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
let repl: MongoMemoryReplSet;
let passwordHash: string;
const models = [
  UserModel,
  ProductModel,
  CategoryModel,
  SettingsModel,
  MediaModel,
  RateLimitModel,
];
beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    binary: { version: "8.0.17" },
  });
  process.env.MONGODB_URI = repl.getUri("smartcell_tests");
  await connectDB();
  for (const model of models) await model.createIndexes();
  passwordHash = await hash("test-only-password-2026", {
    type: argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
});
beforeEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([
    UserModel.deleteMany({}),
    ProductModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    SettingsModel.deleteMany({}),
    MediaModel.deleteMany({}),
    RateLimitModel.deleteMany({}),
  ]);
  const user = await UserModel.create({
    name: "Test Admin",
    email: "admin@example.test",
    passwordHash,
    role: "ADMIN",
    active: true,
  });
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
  await CategoryModel.create({
    _id: fixture.categoryId,
    name: "Capas",
    slug: "capas",
    description: "Proteção para celulares",
    published: true,
    sortOrder: 0,
    filterableAttributes: ["Modelo", "Cor"],
  });
  await MediaModel.create({
    publicId: image.publicId,
    secureUrl: image.secureUrl,
  });
  await SettingsModel.create({ key: "main", ...defaultSettings });
});
afterAll(async () => {
  await mongoose.disconnect();
  if (repl) await repl.stop();
  delete process.env.MONGODB_URI;
});
describe("autenticação e autorização com MongoDB", () => {
  it("autentica senha Argon2id e rejeita credenciais incorretas", async () => {
    expect(
      await authenticateAdmin(
        { email: "ADMIN@example.test", password: "test-only-password-2026" },
        "127.0.0.1",
      ),
    ).toMatchObject({ email: "admin@example.test" });
    expect(
      await authenticateAdmin(
        { email: "admin@example.test", password: "incorreta" },
        "127.0.0.1",
      ),
    ).toBeNull();
    expect(await UserModel.findOne().lean()).not.toHaveProperty("passwordHash");
  });
  it("revalida usuário ativo e revoga acesso de sessões antigas", async () => {
    await expect(requireAdmin()).resolves.toHaveProperty(
      "email",
      "admin@example.test",
    );
    await UserModel.updateOne({}, { $set: { active: false } });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
  it("limita tentativas por e-mail de forma compartilhada", async () => {
    for (let n = 0; n < 8; n++)
      await authenticateAdmin(
        { email: "admin@example.test", password: "errada" },
        `ip-${n}`,
      );
    await expect(
      authenticateAdmin(
        { email: "admin@example.test", password: "test-only-password-2026" },
        "outra-ip",
      ),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("bloqueia todas as operações administrativas antes de alterar dados", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    for (const operation of [
      saveProduct(fixture),
      deleteProduct(fixture.id),
      setProductPublished(fixture.id, true),
      saveCategory({}),
      deleteCategory(fixture.categoryId),
      saveSettings(defaultSettings),
    ])
      expect(await operation).toMatchObject({ ok: false });
    expect(await ProductModel.countDocuments()).toBe(0);
    expect(await CategoryModel.countDocuments()).toBe(1);
  });
});
describe("persistência e catálogo", () => {
  it("cadastra, pesquisa, filtra, edita, oculta, publica e exclui um produto", async () => {
    const saved = await saveProduct(fixture);
    expect(saved.ok).toBe(true);
    if (!saved.ok || !saved.id) throw new Error("save failed");
    expect((await queryProducts({ q: "CÁPA iPhone 17" })).total).toBe(1);
    expect((await queryProducts({ q: "protecao" })).total).toBe(1);
    expect(
      (await queryProducts({ category: "capas", attributes: { Cor: "Rosa" } }))
        .total,
    ).toBe(1);
    expect(
      (await queryProducts({ category: "capas", attributes: { Cor: "Verde" } }))
        .total,
    ).toBe(0);
    expect((await queryProducts({ min: 4000 })).total).toBe(0);
    expect(
      (await saveProduct({ ...fixture, basePrice: 4990 }, saved.id)).ok,
    ).toBe(true);
    expect((await ProductModel.findById(saved.id))?.basePrice).toBe(4990);
    await setProductPublished(saved.id, false);
    expect((await queryProducts()).total).toBe(0);
    await setProductPublished(saved.id, true);
    expect((await queryProducts()).total).toBe(1);
    await deleteProduct(saved.id);
    expect(await ProductModel.countDocuments()).toBe(0);
  });
  it("impede slugs duplicados, referência inválida e categoria em uso", async () => {
    expect((await saveProduct(fixture)).ok).toBe(true);
    expect(await saveProduct(fixture)).toMatchObject({
      ok: false,
      error: expect.stringContaining("slug"),
    });
    expect(
      (
        await saveProduct({
          ...fixture,
          slug: "outra",
          categoryId: "000000000000000000000099",
        })
      ).ok,
    ).toBe(false);
    expect(await deleteCategory(fixture.categoryId)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Mova"),
    });
  });
  it("persiste categorias e configurações e esconde categorias não publicadas", async () => {
    await saveProduct(fixture);
    const category = {
      name: "Capas novas",
      slug: "capas",
      description: "Atualizada",
      published: false,
      sortOrder: 2,
      filterableAttributes: ["Cor"],
    };
    expect((await saveCategory(category, fixture.categoryId)).ok).toBe(true);
    expect((await queryProducts()).total).toBe(0);
    expect(
      (
        await saveSettings({
          ...defaultSettings,
          storeName: "Nova identidade",
          whatsappNumber: "5582991776014",
        })
      ).ok,
    ).toBe(true);
    expect((await SettingsModel.findOne({ key: "main" }))?.storeName).toBe(
      "Nova identidade",
    );
  });
  it("exige registro de mídia antes de anexar uma imagem", async () => {
    await MediaModel.deleteMany({});
    expect((await saveProduct(fixture)).ok).toBe(false);
    expect(await ProductModel.countDocuments()).toBe(0);
  });
});
describe("rotas do carrinho e de upload", () => {
  it("revalida preço e gera o WhatsApp somente após nova confirmação", async () => {
    const saved = await saveProduct(fixture);
    if (!saved.ok || !saved.id) throw new Error("save failed");
    const request = (price: number) =>
      new Request("http://localhost/api/carrinho/validar", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              productId: saved.id,
              variantId: "rosa",
              quantity: 2,
              expectedPrice: price,
              expectedAttributes: fixture.variants[0].attributes,
            },
          ],
          attendant: "Amanda",
        }),
      });
    const changed = await (await validateCart(request(1))).json();
    expect(changed.changed).toBe(true);
    expect(changed.url).toBeUndefined();
    const checked = await (await validateCart(request(3990))).json();
    expect(checked.url).toContain("https://wa.me/5582991776014?");
    expect(checked.items[0].name).toBe(fixture.name);
    await setProductPublished(saved.id, false);
    const hidden = await (await validateCart(request(3990))).json();
    expect(hidden.issues).toHaveLength(1);
    expect(hidden.url).toBeUndefined();
  });
  it("bloqueia upload sem autenticação e origem diferente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    expect(
      (
        await uploadRoute(
          new Request("http://localhost/api/admin/upload", {
            method: "POST",
            headers: { origin: "http://localhost" },
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await uploadRoute(
          new Request("http://localhost/api/admin/upload", {
            method: "POST",
            headers: { origin: "https://evil.test" },
          }),
        )
      ).status,
    ).toBe(403);
  });
  it("recusa SVG disfarçado e registra upload validado (Cloudinary simulado)", async () => {
    const request = (file: File) => {
      const body = new FormData();
      body.set("file", file);
      return new Request("http://localhost/api/admin/upload", {
        method: "POST",
        headers: { origin: "http://localhost" },
        body,
      });
    };
    const invalid = await uploadRoute(
      request(new File(["<svg>evil</svg>"], "fake.png", { type: "image/png" })),
    );
    expect(invalid.status).toBe(400);
    vi.spyOn(cloudinary, "uploadImage").mockResolvedValue({
      public_id: "smartcell/upload-test",
      secure_url:
        "https://res.cloudinary.com/test/image/upload/upload-test.png",
    } as Awaited<ReturnType<typeof cloudinary.uploadImage>>);
    const file = new File(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])],
      "photo.png",
      { type: "image/png" },
    );
    const uploaded = await uploadRoute(request(file));
    expect(uploaded.status).toBe(200);
    expect(
      await MediaModel.exists({ publicId: "smartcell/upload-test" }),
    ).toBeTruthy();
  });
});
