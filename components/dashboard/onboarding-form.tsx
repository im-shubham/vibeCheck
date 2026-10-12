"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input } from "@/components/ui/field";
import { AvatarUploader } from "./avatar-uploader";
import { SlugField } from "./slug-field";
import { api, ApiError, errMessage } from "@/lib/client-api";
import { slugify } from "@/lib/validation";

export function OnboardingForm({ userId, defaultName, origin }: { userId: string; defaultName: string; origin: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(defaultName);
  const [businessName, setBusinessName] = useState("");
  const [professionNiche, setProfessionNiche] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [slug, setSlug] = useState(slugify(defaultName));
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = (n: string, b: string) => (slugTouched ? slug : slugify(b || n));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ warning?: string }>("/api/profile", {
        method: "POST",
        json: { displayName, businessName, brandName, professionNiche, websiteUrl, avatarUrl, publicSlug: slug },
      });
      if (res.warning) toast.info(res.warning);
      toast.success("You're all set! Your collection page is live.");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(errMessage(err));
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <AvatarUploader userId={userId} name={displayName} value={avatarUrl} onChange={setAvatarUrl} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="displayName">
          <Input
            id="displayName"
            value={displayName}
            required
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (!slugTouched) setSlug(suggest(e.target.value, businessName));
            }}
            placeholder="Danielle Smith"
          />
        </Field>
        <Field label="Business name" htmlFor="businessName" hint="Optional">
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (!slugTouched) setSlug(suggest(displayName, e.target.value));
            }}
            placeholder="Pixel & Co."
          />
        </Field>
      </div>
      <Field label="Profession or niche" htmlFor="niche" hint="We use this to suggest personalised Vibe Chips for your reviewers.">
        <Input id="niche" value={professionNiche} required onChange={(e) => setProfessionNiche(e.target.value)} placeholder="Freelance web designer" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Brand name" htmlFor="brandName" hint="Shown on your collection page. Optional.">
          <Input id="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
        </Field>
        <Field label="Website" htmlFor="website" hint="Optional">
          <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
        </Field>
      </div>
      <SlugField
        value={slug}
        origin={origin}
        onChange={(v) => {
          setSlugTouched(true);
          setSlug(v);
        }}
      />
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Create my collection page
      </Button>
    </form>
  );
}
