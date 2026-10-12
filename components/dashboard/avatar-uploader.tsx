"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Creator profile photo → Supabase Storage `avatars/<uid>/…` (storage RLS limits writes to your own folder). */
export function AvatarUploader({ userId, name, value, onChange }: { userId: string; name: string; value: string | null; onChange: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const ext = TYPES[file.type];
    if (!ext) return void toast.error("Please choose a JPG, PNG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return void toast.error("Please choose an image under 2 MB.");
    setBusy(true);
    const supabase = createClient();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (error) return void toast.error("Upload failed. You can skip the photo and add it later.");
    onChange(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name || "You"} src={value} className="size-16 text-lg" />
      <div className="flex flex-wrap gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload profile photo" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {value ? "Change photo" : "Upload photo"}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
