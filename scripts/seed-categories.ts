import "./env";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { categorySchema } from "../src/lib/validations";
import { slugify } from "../src/lib/utils";
import { CategoryModel, ProductModel } from "../src/models";
import { buildSearchTokens } from "../src/features/products/search";

const definitions = [
  {
    name: "Capas de celular",
    slug: "capa-celular",
    aliases: [
      "capa",
      "capas",
      "capa-de-celular",
      "capas-de-celular",
      "capas-celular",
    ],
    description:
      "Proteção e personalidade para o seu celular. Explore capas por marca do aparelho, modelo, cor e material para encontrar a opção que combina com você.",
    filterableAttributes: [
      "Marca",
      "Marca do aparelho",
      "Modelo",
      "Cor",
      "Material",
    ],
  },
  {
    name: "Garrafas térmicas",
    slug: "garrafas-termicas",
    aliases: ["garrafas", "garrafa-termica"],
    description:
      "Garrafas térmicas para acompanhar sua rotina, o trabalho e os passeios. Compare capacidades, cores e materiais e consulte os detalhes de cada modelo.",
    filterableAttributes: ["Marca", "Capacidade", "Cor", "Material"],
  },
  {
    name: "Fones de ouvido",
    slug: "fones-de-ouvido",
    aliases: ["fones", "fone-de-ouvido"],
    description:
      "Encontre fones para ouvir suas músicas, acompanhar vídeos e fazer chamadas. Escolha por tipo, conexão, marca e cor conforme as características de cada produto.",
    filterableAttributes: ["Marca", "Tipo", "Conexão", "Cor"],
  },
  {
    name: "Carregadores",
    slug: "carregadores",
    aliases: ["carregador"],
    description:
      "Carregadores para os dispositivos do seu dia a dia. Confira potência, tipo e conector e confirme a compatibilidade com o seu aparelho antes de escolher.",
    filterableAttributes: ["Marca", "Tipo", "Conector", "Potência", "Cor"],
  },
  {
    name: "Cabos",
    slug: "cabos",
    aliases: ["cabo"],
    description:
      "Cabos para carregar e conectar seus dispositivos. Compare os conectores, o comprimento e o material e confira as funções e a compatibilidade na descrição de cada produto.",
    filterableAttributes: [
      "Marca",
      "Conector de entrada",
      "Conector de saída",
      "Comprimento",
      "Cor",
      "Material",
    ],
  },
  {
    name: "Smartwatches",
    slug: "smartwatches",
    aliases: [
      "smart-watch",
      "smart-watchs",
      "smart-watches",
      "smartwatch",
      "relogios-inteligentes",
    ],
    description:
      "Relógios inteligentes para complementar seu estilo e sua rotina. Conheça os modelos e compare tamanho, cor, compatibilidade e recursos informados em cada produto.",
    filterableAttributes: [
      "Marca",
      "Modelo",
      "Tamanho",
      "Cor",
      "Compatibilidade",
    ],
  },
  {
    name: "Copos térmicos",
    slug: "copos-termicos",
    aliases: ["copos", "copo-termico"],
    description:
      "Copos térmicos para acompanhar suas bebidas no dia a dia. Escolha por capacidade, cor, material e tipo de tampa e confira as características de cada modelo.",
    filterableAttributes: [
      "Marca",
      "Capacidade",
      "Cor",
      "Material",
      "Tipo de tampa",
    ],
  },
  {
    name: "Pulseiras para smartwatch",
    slug: "pulseiras-para-smartwatch",
    aliases: [
      "pulseiras-smart-watch",
      "pulseiras-smartwatch",
      "pulseira-smartwatch",
      "pulseiras-para-smartwatches",
    ],
    description:
      "Renove o visual do seu smartwatch com uma pulseira que combina com você. Confira o modelo compatível, a largura do encaixe, o tamanho, a cor e o material.",
    filterableAttributes: [
      "Modelo compatível",
      "Largura",
      "Tamanho",
      "Cor",
      "Material",
    ],
  },
];

async function main() {
  // Validate all content before connecting or modifying the catalog.
  const seeds = definitions.map(({ aliases, ...definition }, index) => ({
    aliases,
    data: categorySchema.parse({
      ...definition,
      published: true,
      sortOrder: index * 10,
    }),
  }));

  await connectDB();
  await CategoryModel.createIndexes();

  const report = await mongoose.connection.transaction(async (session) => {
    const existing = await CategoryModel.find({}).session(session).lean();
    const result: { name: string; slug: string; status: string }[] = [];

    for (const { aliases, data } of seeds) {
      const keys = new Set([data.slug, slugify(data.name), ...aliases]);
      const matches = existing.filter(
        (category) =>
          keys.has(category.slug) || keys.has(slugify(category.name)),
      );
      if (matches.length > 1) throw new Error("AMBIGUOUS_CATEGORY");
      const current = matches[0];

      if (!current) {
        await CategoryModel.create([data], { session });
        result.push({ name: data.name, slug: data.slug, status: "criada" });
        continue;
      }

      // Complete missing fields while retaining existing IDs, slugs, images,
      // publication choices, order and subsequent administrator customizations.
      const name = slugify(current.name) === "capa" ? data.name : current.name;
      const description = current.description?.trim()
        ? current.description
        : data.description;
      const filterableAttributes = current.filterableAttributes.length
        ? current.filterableAttributes
        : data.filterableAttributes;
      const changed =
        name !== current.name ||
        description !== current.description ||
        JSON.stringify(filterableAttributes) !==
          JSON.stringify(current.filterableAttributes);

      if (changed) {
        await CategoryModel.updateOne(
          { _id: current._id },
          {
            $set: { name, description, filterableAttributes },
            $inc: { refVersion: 1 },
          },
          { session, runValidators: true },
        );
        if (name !== current.name) {
          const products = await ProductModel.find({ categoryId: current._id })
            .session(session)
            .lean();
          if (products.length)
            await ProductModel.bulkWrite(
              products.map((product) => ({
                updateOne: {
                  filter: { _id: product._id },
                  update: {
                    $set: {
                      searchTokens: buildSearchTokens(
                        { ...product, categoryId: current._id.toString() },
                        name,
                      ),
                    },
                  },
                },
              })),
              { session },
            );
        }
      }
      result.push({
        name,
        slug: current.slug,
        status: changed ? "completada" : "já cadastrada",
      });
    }
    return result;
  });

  const saved = await CategoryModel.find({
    slug: { $in: report.map((category) => category.slug) },
  })
    .select("name slug published sortOrder description filterableAttributes")
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  if (
    saved.length !== seeds.length ||
    saved.some(
      (category) =>
        !category.description || !category.filterableAttributes.length,
    )
  )
    throw new Error("CATEGORY_VERIFICATION_FAILED");

  console.table(report);
  console.log(
    `Verificado no MongoDB: ${saved.length} categorias, ${saved.filter((category) => category.published).length} publicadas.`,
  );
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "";
    console.error(
      message === "AMBIGUOUS_CATEGORY"
        ? "Há categorias duplicadas ou equivalentes. Revise os cadastros antes de repetir; a transação não foi aplicada."
        : "Não foi possível concluir o cadastro. Confira a conexão MongoDB e as permissões do usuário do banco.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
