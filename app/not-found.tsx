import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-medium text-brand">404</p>
        <h1 className="mt-2 text-3xl font-semibold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-muted">The link may be mistyped, or the page may have moved.</p>
        <LinkButton href="/" className="mt-6">Back to home</LinkButton>
        <p className="mt-4 text-sm">
          <Link href="/login" className="text-brand hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
