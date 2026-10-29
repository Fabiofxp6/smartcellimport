import { test, expect } from "@playwright/test";
import { fixture } from "../fixtures";
import { readFile } from "node:fs/promises";
test.beforeEach(async ({ page }) => {
  await page.route("**/_next/image?**", async (route) => {
    if (
      new URL(route.request().url()).searchParams
        .get("url")
        ?.includes("res.cloudinary.com/test/")
    )
      await route.fulfill({
        contentType: "image/jpeg",
        body: await readFile("public/smartcell-logo.jpeg"),
      });
    else await route.continue();
  });
});
test("abre a vitrine, navega e mantém o layout dentro da tela", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Seu estilo/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explorar catálogo", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explorar catálogo", exact: true })
    .click();
  await expect(page).toHaveURL(/catalogo/);
  await expect(
    page.getByRole("heading", { name: "Nosso catálogo" }),
  ).toBeVisible();
});
test("pesquisa e filtros permanecem na URL", async ({ page }) => {
  await page.goto("/catalogo");
  await page
    .getByRole("textbox", { name: "Pesquisar", exact: true })
    .fill("capa iPhone 17");
  await page.getByLabel("Preço mínimo em reais").fill("10,50");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/q=capa\+iPhone\+17/);
  await expect(
    page.getByRole("textbox", { name: "Pesquisar", exact: true }),
  ).toHaveValue("capa iPhone 17");
  await expect(
    page.getByRole("heading", { name: "Nenhum produto por aqui" }),
  ).toBeVisible();
});
test("persiste carrinho, altera quantidade e informa atualização de preços", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (item) => localStorage.setItem("smartcell:cart:v1", JSON.stringify([item])),
    {
      productId: fixture.id,
      variantId: "rosa",
      name: fixture.name,
      slug: fixture.slug,
      quantity: 2,
      unitPrice: 3990,
      attributes: fixture.variants[0].attributes,
    },
  );
  await page.goto("/carrinho");
  await expect(page.getByText(fixture.name, { exact: true })).toBeVisible();
  await page.getByLabel("Qtd.").fill("3");
  await page.reload();
  await expect(page.getByLabel("Qtd.")).toHaveValue("3");
  await page.route("**/api/carrinho/validar", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.items[0].expectedPrice).toBe(3990);
    await route.fulfill({
      json: {
        items: [
          {
            ...body.items[0],
            name: fixture.name,
            slug: fixture.slug,
            unitPrice: 4590,
            attributes: fixture.variants[0].attributes,
          },
        ],
        changed: true,
        issues: [],
      },
    });
  });
  await page
    .getByRole("button", { name: "Enviar carrinho pelo WhatsApp" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Os preços foram atualizados" }),
  ).toContainText("Os preços foram atualizados");
  await page
    .getByRole("button", { name: `Remover ${fixture.name}`, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seu próximo favorito está esperando" }),
  ).toBeVisible();
});
test("redireciona administração sem sessão e bloqueia upload", async ({
  page,
  request,
}) => {
  await page.goto("/admin/produtos");
  await expect(page).toHaveURL(/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta" }),
  ).toBeVisible();
  const result = await request.post("/api/admin/upload", {
    headers: { origin: "http://127.0.0.1:3111" },
  });
  expect([401, 403]).toContain(result.status());
});
