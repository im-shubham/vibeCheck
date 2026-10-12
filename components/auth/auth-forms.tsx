"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/utils";

const NOT_CONFIGURED = "Sign-in isn't configured on this server yet.";
const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox.";
  if (/already registered/i.test(message)) return "An account with that email already exists. Try logging in.";
  if (/rate limit/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  return message;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured()) return setError(NOT_CONFIGURED);
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      return setError(friendly(error.message));
    }
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm text-muted hover:text-fg">
          Forgot password?
        </Link>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Log in
      </Button>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured()) return setError(NOT_CONFIGURED);
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    setLoading(false);
    if (error) return setError(friendly(error.message));
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
    } else {
      setSent(true); // email confirmation is enabled in Supabase
    }
  }

  if (sent) {
    return (
      <div className="text-center" role="status">
        <MailCheck className="mx-auto mb-3 size-10 text-good" />
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted">
          We sent a confirmation link to <strong className="text-fg">{email}</strong>. Open it to finish setting up your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Create account
      </Button>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured()) return setError(NOT_CONFIGURED);
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error && /rate limit/i.test(error.message)) return setError(friendly(error.message));
    setDone(true); // same message whether or not the account exists
  }

  if (done) {
    return (
      <p role="status" className="text-sm text-muted">
        If an account exists for <strong className="text-fg">{email}</strong>, a reset link is on its way.
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(friendly(error.message));
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="New password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Update password
      </Button>
    </form>
  );
}
