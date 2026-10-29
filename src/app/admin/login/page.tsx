import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { isDatabaseConfigured } from "@/lib/mongodb";
export default function LoginPage() {
  return (
    <main id="main-content" className="grid min-h-dvh md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white md:flex">
        <Link href="/" className="text-xl font-bold">
          Smart Cell Import
        </Link>
        <div className="hero-orbit right-[-120px] top-40 scale-150" />
        <div className="relative">
          <span className="brand-logo mb-8 size-28">
            <Image
              src="/smartcell-logo.jpeg"
              alt="Smart Cell Import"
              fill
              sizes="112px"
              className="object-cover"
            />
          </span>
          <h1 className="text-5xl leading-tight font-bold tracking-tight">
            Um catálogo.
            <br />
            Muitas possibilidades.
          </h1>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
            Organize seus produtos e conecte seus clientes aos próximos
            favoritos.
          </p>
        </div>
        <p className="text-xs text-white/50">
          Painel exclusivo para administradores.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para a loja
          </Link>
          <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <LockKeyhole className="size-5" />
          </span>
          <h2 className="text-3xl font-bold tracking-tight">
            Bem-vindo de volta
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Entre para cuidar do seu catálogo.
          </p>
          <LoginForm
            configured={isDatabaseConfigured() && !!process.env.AUTH_SECRET}
          />
        </div>
      </div>
    </main>
  );
}
