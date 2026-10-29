import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { detectImage, getCloudinary, uploadImage } from "@/lib/cloudinary";
import { MediaModel } from "@/models";
import { AppError, safeError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { readBody } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      throw new AppError("Origem não autorizada.", 403);
    const admin = await requireAdmin();
    await rateLimit(`upload:${admin.id}`, 60, 600);
    if (!request.body) throw new AppError("Selecione uma imagem.");
    if (
      !request.headers.get("content-type")?.startsWith("multipart/form-data;")
    )
      throw new AppError("Use um formulário de envio de imagem.");
    const body = await readBody(request, 4 * 1024 * 1024);
    const form = await new Response(new Uint8Array(body), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File))
      throw new AppError("Selecione uma imagem JPEG, PNG ou WebP de até 3 MB.");
    if (file.size > 3 * 1024 * 1024)
      throw new AppError("Envie uma imagem de até 3 MB.", 413);
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImage(buffer);
    if (!detected || detected !== file.type)
      throw new AppError(
        "Formato de imagem inválido. Aceitamos JPEG, PNG e WebP.",
      );
    const result = await uploadImage(buffer);
    try {
      await MediaModel.create({
        publicId: result.public_id,
        secureUrl: result.secure_url,
      });
    } catch (error) {
      try {
        await getCloudinary().uploader.destroy(result.public_id);
      } catch {
        console.error("[media] Falha ao limpar upload sem registro.");
      }
      throw error;
    }
    return NextResponse.json({
      publicId: result.public_id,
      secureUrl: result.secure_url,
      alt: file.name.replace(/\.[^.]+$/, "").slice(0, 300),
      sortOrder: 0,
      isPrimary: true,
    });
  } catch (error) {
    const problem = safeError(error);
    return NextResponse.json(
      { error: problem.message },
      { status: problem.status },
    );
  }
}
