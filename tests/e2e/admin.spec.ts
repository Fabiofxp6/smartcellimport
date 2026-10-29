import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("login, formulário, persistência pública, edição, publicação, exclusão e logout", async ({
  page,
}, testInfo) => {
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
  const name = `Produto navegador ${testInfo.project.name}`;
  await page.goto("/admin/login");
  await page.getByLabel("E-mail", { exact: true }).fill("browser@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill("browser-test-only-2026");
  await page.getByRole("button", { name: "Entrar no painel" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Novo produto", exact: true }).click();
  await page.getByLabel("Nome do produto").fill(name);
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Descrição cadastrada pelo teste de navegador.");
  await page
    .getByLabel("Categoria", { exact: true })
    .selectOption({ label: "Navegador" });
  await page.getByLabel("Preço base (R$)", { exact: true }).fill("39,90");
  await page.route("**/api/admin/upload", (route) =>
    route.fulfill({
      json: {
        publicId: `smartcell/e2e-${testInfo.project.name}`,
        secureUrl: `https://res.cloudinary.com/test/image/upload/e2e-${testInfo.project.name}.png`,
        alt: "Imagem de teste",
        sortOrder: 0,
        isPrimary: true,
      },
    }),
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
  });
  await expect(page.getByLabel("Descrição da imagem 1")).toBeVisible();
  await page.getByLabel("Publicado no catálogo").check();
  await page
    .getByRole("button", { name: "Salvar produto", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/admin\/produtos$/);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name, exact: true }) });
  await row.getByRole("link", { name: `Editar ${name}`, exact: true }).click();
  await page.getByLabel("Preço base (R$)", { exact: true }).fill("49,90");
  await page
    .getByRole("button", { name: "Salvar produto", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/admin\/produtos$/);
  await page.goto(`/catalogo?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(page.getByText("R$ 49,90", { exact: true })).toBeVisible();
  await page.goto("/admin/produtos");
  const selected = page
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name, exact: true }) });
  await selected
    .getByRole("button", { name: `Ocultar ${name}`, exact: true })
    .click();
  await expect(selected.getByText("Oculto", { exact: true })).toBeVisible();
  await selected
    .getByRole("button", { name: `Publicar ${name}`, exact: true })
    .click();
  await expect(selected.getByText("Publicado", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await selected
    .getByRole("button", { name: `Excluir ${name}`, exact: true })
    .click();
  await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/admin\/login/);
  await page.goto("/admin/produtos");
  await expect(page).toHaveURL(/admin\/login/);
});
