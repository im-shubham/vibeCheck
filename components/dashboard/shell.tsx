"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart3, ChevronDown, CreditCard, ExternalLink, Heart, Inbox, LayoutDashboard, LogOut, Menu, Settings, SlidersHorizontal, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/inbox", label: "Inbox & Collection", Icon: Inbox },
  { href: "/dashboard/testimonials", label: "Wall of Love", Icon: Heart },
  { href: "/dashboard/widgets", label: "Widgets", Icon: SlidersHorizontal },
  { href: "/dashboard/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  { href: "/dashboard/billing", label: "Billing", Icon: CreditCard },
];

export interface ShellProfile {
  displayName: string;
  avatarUrl: string | null;
  slug: string;
  planName: string;
}

function NavList({ pending, onNavigate }: { pending: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-brand/15 text-fg shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_45%,transparent)]" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className={cn("size-4.5", active && "text-brand")} aria-hidden />
            <span className="flex-1">{label}</span>
            {href === "/dashboard/inbox" && pending > 0 && (
              <span className="rounded-full bg-warn/20 px-2 py-0.5 text-xs font-semibold text-warn" aria-label={`${pending} pending`}>
                {pending}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileMenu({ profile }: { profile: ShellProfile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1 pl-1 pr-2 transition hover:border-brand/50"
      >
        <Avatar name={profile.displayName} src={profile.avatarUrl} className="size-8" />
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{profile.displayName}</span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{profile.displayName}</p>
            <p className="text-xs text-muted">{profile.planName} plan</p>
          </div>
          <Link role="menuitem" href={`/submit/${profile.slug}`} target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
            <ExternalLink className="size-4" aria-hidden /> View my public page
          </Link>
          <Link role="menuitem" href="/dashboard/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2">
            <Settings className="size-4" aria-hidden /> Settings
          </Link>
          <button role="menuitem" type="button" onClick={logout} disabled={busy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-bad hover:bg-bad/10 disabled:opacity-60">
            <LogOut className="size-4" aria-hidden /> {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ profile, pending, children }: { profile: ShellProfile; pending: number; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface/60 p-4 lg:flex">
        <Logo href="/dashboard" className="px-2 pt-1" />
        <NavList pending={pending} />
        <div className="mt-auto rounded-xl border border-line bg-surface-2/50 p-3 text-xs text-muted">
          <p className="font-medium text-fg">{profile.planName} plan</p>
          <Link href="/dashboard/billing" className="mt-1 inline-block text-brand hover:underline">
            Usage &amp; limits
          </Link>
        </div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col gap-6 border-r border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <Logo href="/dashboard" />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-muted hover:bg-surface-2">
                <X className="size-5" />
              </button>
            </div>
            <NavList pending={pending} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur lg:px-8">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-xl border border-line bg-surface lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu profile={profile} />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
