import { AppError } from "./errors";
export async function readBody(
  request: Request,
  maxBytes: number,
): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new AppError("O conteúdo enviado é muito grande.", 413);
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new AppError("O conteúdo enviado é muito grande.", 413);
    }
    chunks.push(result.value);
  }
  return Buffer.concat(chunks);
}
