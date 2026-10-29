"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setError("");
        try {
          const result = await signIn("credentials", {
            ...data,
            redirect: false,
            callbackUrl: "/admin",
          });
          if (result?.error || !result?.ok) {
            setError(
              "Não foi possível entrar. Confira as credenciais ou aguarde se houver muitas tentativas.",
            );
            return;
          }
          router.replace("/admin");
          router.refresh();
        } catch {
          setError("Serviço indisponível. Tente novamente.");
        }
      })}
      className="mt-7 space-y-5"
    >
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="seu@email.com"
          {...register("email")}
        />
        <p className="field-error">{errors.email?.message}</p>
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Senha
        </label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            className="pr-12"
            {...register("password")}
          />
          <button
            type="button"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShow(!show)}
            className="absolute top-0 right-0 flex size-11 items-center justify-center text-muted-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="field-error">{errors.password?.message}</p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {!configured && (
        <p className="rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
          O acesso administrativo estará disponível após configurar MongoDB,
          AUTH_SECRET e provisionar o primeiro administrador. Consulte o README
          do projeto.
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting || !configured}
        className="w-full"
      >
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : <LogIn />}
        Entrar no painel
      </Button>
    </form>
  );
}
