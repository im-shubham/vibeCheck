import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabaseConfigured } from "@/lib/supabase/server";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-hero-glow flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        {!supabaseConfigured() && (
          <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and add your project keys to enable
              sign-in.
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xl shadow-black/20 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-muted">{footer}</p>}
      </main>
    </div>
  );
}

export const AuthLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-medium text-brand hover:underline">
    {children}
  </Link>
);
