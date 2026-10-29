import "./env";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash, argon2id } from "argon2";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "../src/lib/mongodb";
import { UserModel } from "../src/models";

async function hiddenPassword(label: string): Promise<string> {
  if (!stdin.isTTY || !stdin.setRawMode)
    throw new Error(
      "Use um terminal interativo para informar a senha com segurança.",
    );
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelado."));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " " && value.length < 256) value += char;
      }
    };
    stdin.on("data", onData);
  });
}
async function main() {
  await connectDB();
  await UserModel.createIndexes();
  const rl = createInterface({ input: stdin, output: stdout });
  let nameInput: string;
  let emailInput: string;
  try {
    nameInput = await rl.question("Nome do administrador: ");
    emailInput = await rl.question("E-mail: ");
  } finally {
    rl.close();
  }
  const name = z.string().trim().min(2).max(100).parse(nameInput);
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .parse(emailInput);
  const password = await hiddenPassword(
    "Senha (mínimo 12 caracteres, não será exibida): ",
  );
  z.string().min(12).max(256).parse(password);
  const confirmation = await hiddenPassword("Confirme a senha: ");
  if (password !== confirmation) throw new Error("As senhas não coincidem.");
  if (await UserModel.exists({ email }))
    throw new Error(
      "Já existe um administrador com este e-mail. Nenhuma alteração foi feita.",
    );
  await UserModel.create({
    name,
    email,
    passwordHash: await hash(password, {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    }),
    role: "ADMIN",
    active: true,
  });
  console.log("Administrador provisionado. Faça login em /admin/login.");
}
main()
  .catch((error) => {
    console.error(
      error instanceof z.ZodError
        ? "Dados inválidos. Confira nome, e-mail e senha de pelo menos 12 caracteres."
        : error instanceof Error &&
            [
              "As senhas não coincidem.",
              "Já existe um administrador com este e-mail. Nenhuma alteração foi feita.",
              "Cancelado.",
            ].includes(error.message)
          ? error.message
          : "Não foi possível criar o administrador. Confira a configuração e use um terminal interativo.",
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
