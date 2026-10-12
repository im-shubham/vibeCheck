"use client";

import { useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, Input, Label } from "@/components/ui/field";
import { AvatarUploader } from "./avatar-uploader";
import { SlugField } from "./slug-field";
import { api, errMessage } from "@/lib/client-api";
import type { Profile, VibeChip } from "@/lib/types";

export function SettingsClient({ profile, origin, aiAvailable }: { profile: Profile; origin: string; aiAvailable: boolean }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [businessName, setBusinessName] = useState(profile.business_name ?? "");
  const [brandName, setBrandName] = useState(profile.brand_name ?? "");
  const [professionNiche, setProfessionNiche] = useState(profile.profession_niche);
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [slug, setSlug] = useState(profile.public_slug);
  const [chips, setChips] = useState<VibeChip[]>(profile.custom_vibe_chips);
  const [saving, setSaving] = useState(false);
  const [savingChips, setSavingChips] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const body = () => ({ displayName, businessName, brandName, professionNiche, websiteUrl, avatarUrl, publicSlug: slug });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api<{ profile: Profile; chipsRefreshed?: boolean; warning?: string }>("/api/profile", { method: "PATCH", json: body() });
      setChips(res.profile.custom_vibe_chips);
      toast.success(res.chipsRefreshed ? "Saved — and your Vibe Chips were refreshed for your new profession." : "Profile saved");
      if (res.warning) toast.warning(res.warning);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveChips() {
    setSavingChips(true);
    try {
      await api("/api/profile", { method: "PATCH", json: { ...body(), vibeChips: chips } });
      toast.success("Vibe Chips saved");
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setSavingChips(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await api<{ chips: VibeChip[] }>("/api/ai/vibe-chips", { method: "POST", json: { profession: professionNiche, niche: professionNiche } });
      setChips(res.chips);
      toast.success("New Vibe Chips generated and saved");
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setRegenerating(false);
    }
  }

  const updateChip = (i: number, patch: Partial<VibeChip>) => setChips((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const chipsValid = chips.length === 5 && chips.every((c) => c.label.trim().length >= 2 && c.prompt.trim().length >= 5);

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Profile &amp; public page</h2>
        <form onSubmit={saveProfile} className="space-y-5" noValidate>
          <AvatarUploader userId={profile.id} name={displayName} value={avatarUrl} onChange={setAvatarUrl} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" htmlFor="displayName">
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Business name" htmlFor="businessName" hint="Optional">
              <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </Field>
            <Field label="Brand name" htmlFor="brandName" hint="Optional">
              <Input id="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </Field>
            <Field label="Website" htmlFor="website" hint="Optional">
              <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
            </Field>
          </div>
          <Field label="Profession or niche" htmlFor="niche" hint="Changing this refreshes your Vibe Chips with AI (when available).">
            <Input id="niche" value={professionNiche} onChange={(e) => setProfessionNiche(e.target.value)} />
          </Field>
          <SlugField value={slug} onChange={setSlug} origin={origin} />
          {slug !== profile.public_slug && <p className="-mt-3 text-xs text-warn">Changing your URL breaks links you&apos;ve already shared.</p>}
          <FieldError>{error}</FieldError>
          <Button type="submit" loading={saving}>
            <Save className="size-4" /> Save profile
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Vibe Chips</h2>
          <Button variant="secondary" size="sm" onClick={regenerate} loading={regenerating} disabled={!aiAvailable} title={aiAvailable ? undefined : "AI isn't configured on this server"}>
            <Sparkles className="size-4" /> Regenerate with AI
          </Button>
        </div>
        <p className="mb-4 text-sm text-muted">Reviewers tap these to get an optional writing prompt. Keep them neutral — they&apos;re topics, not required endorsements.</p>
        {chips.length === 0 ? (
          <p className="text-sm text-muted">No chips yet — regenerate them above.</p>
        ) : (
          <div className="space-y-3">
            {chips.map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr]">
                <div>
                  <Label htmlFor={`chip-l-${i}`} className="sr-only">
                    Chip {i + 1} label
                  </Label>
                  <Input id={`chip-l-${i}`} value={c.label} maxLength={32} onChange={(e) => updateChip(i, { label: e.target.value })} placeholder="Label" />
                </div>
                <div>
                  <Label htmlFor={`chip-p-${i}`} className="sr-only">
                    Chip {i + 1} writing prompt
                  </Label>
                  <Input id={`chip-p-${i}`} value={c.prompt} maxLength={140} onChange={(e) => updateChip(i, { prompt: e.target.value })} placeholder="Writing prompt…" />
                </div>
              </div>
            ))}
            <Button onClick={saveChips} loading={savingChips} disabled={!chipsValid}>
              <Save className="size-4" /> Save chips
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
