import { ZodError } from "zod";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function safeError(error: unknown): { message: string; status: number } {
  if (error instanceof SyntaxError)
    return { message: "Formato de dados inválido.", status: 400 };
  if (error instanceof AppError)
    return { message: error.message, status: error.status };
  if (error instanceof ZodError)
    return {
      message: error.issues.map((i) => i.message).join(" "),
      status: 422,
    };
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000
  )
    return { message: "Este slug ou e-mail já está em uso.", status: 409 };
  console.error(
    "[smartcell] Operação falhou:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return {
    message:
      "Não foi possível concluir. Confira a configuração dos serviços e tente novamente.",
    status: 503,
  };
}
