// Ephemeral test database and credentials; never reads or modifies the store's Atlas.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { hash, argon2id } from "argon2";
import mongoose from "mongoose";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  UserModel,
  CategoryModel,
  SettingsModel,
  MediaModel,
  ProductModel,
  RateLimitModel,
} from "../../src/models";
import { defaultSettings } from "../../src/lib/defaults";
process.env.MONGOMS_DOWNLOAD_DIR = join(tmpdir(), "smartcell-mongodb-binaries");
const repl = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
  binary: { version: "8.0.17" },
});
const uri = repl.getUri("smartcell_browser_tests");
await mongoose.connect(uri);
for (const model of [
  UserModel,
  CategoryModel,
  SettingsModel,
  MediaModel,
  ProductModel,
  RateLimitModel,
])
  await model.createIndexes();
await UserModel.create({
  name: "Administrador de teste",
  email: "browser@example.test",
  passwordHash: await hash("browser-test-only-2026", { type: argon2id }),
  role: "ADMIN",
  active: true,
});
await CategoryModel.create({
  name: "Navegador",
  slug: "navegador",
  published: true,
  sortOrder: 0,
  filterableAttributes: ["Cor"],
});
await SettingsModel.create({ key: "main", ...defaultSettings });
for (const project of ["desktop", "mobile"])
  await MediaModel.create({
    publicId: `smartcell/e2e-${project}`,
    secureUrl: `https://res.cloudinary.com/test/image/upload/e2e-${project}.png`,
  });
await mongoose.disconnect();
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3111",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      MONGODB_URI: uri,
      AUTH_SECRET: randomBytes(48).toString("base64"),
      AUTH_URL: "http://127.0.0.1:3111",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3111",
    },
  },
);
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  app.kill("SIGTERM");
  await repl.stop();
  process.exit();
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
app.on("exit", close);
