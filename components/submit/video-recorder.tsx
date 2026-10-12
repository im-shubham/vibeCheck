"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CircleStop, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errMessage } from "@/lib/client-api";

type Phase = "idle" | "requesting" | "live" | "recording" | "recorded" | "uploading" | "uploaded" | "error";

const MAX_SECONDS = 120;
const MAX_BYTES = 100 * 1024 * 1024;

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export function VideoRecorder({
  slug,
  enabled,
  onUploaded,
  onUseText,
}: {
  slug: string;
  enabled: boolean;
  onUploaded: (url: string | null) => void;
  onUseText: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const liveRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);

  const stopStream = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (timer.current) clearInterval(timer.current);
  }, []);

  useEffect(
    () => () => {
      stopStream();
      xhr.current?.abort();
    },
    [stopStream],
  );
  useEffect(() => () => void (blobUrl && URL.revokeObjectURL(blobUrl)), [blobUrl]);

  useEffect(() => {
    if ((phase === "live" || phase === "recording") && liveRef.current && stream.current) liveRef.current.srcObject = stream.current;
  }, [phase]);

  if (!enabled) {
    return (
      <div role="status" className="rounded-xl border border-dashed border-line p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 size-6 text-warn" aria-hidden />
        <p className="font-medium">Video testimonials aren&apos;t set up yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          This site hasn&apos;t connected video storage, so recordings can&apos;t be saved. A written review works great in the meantime.
        </p>
        <Button className="mt-4" variant="secondary" onClick={onUseText}>
          Write a text review instead
        </Button>
      </div>
    );
  }

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || !pickMime()) {
      setPhase("error");
      return setError("Your browser can't record video here. Please use a text review, or try Chrome, Edge, Firefox or Safari.");
    }
    setPhase("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setPhase("live");
    } catch {
      setPhase("error");
      setError("We couldn't access your camera and microphone. Check your browser's permission, or use a text review.");
    }
  }

  function startRecording() {
    const mime = pickMime();
    if (!stream.current || !mime) return;
    chunks.current = [];
    const rec = new MediaRecorder(stream.current, { mimeType: mime });
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    rec.onstop = () => {
      const b = new Blob(chunks.current, { type: mime.split(";")[0] });
      blob.current = b;
      stopStream();
      if (b.size > MAX_BYTES) {
        setPhase("error");
        return setError("That recording is too large. Please record a shorter video.");
      }
      setBlobUrl(URL.createObjectURL(b));
      setPhase("recorded");
    };
    recorder.current = rec;
    rec.start(1000);
    setSeconds(0);
    setPhase("recording");
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS && rec.state !== "inactive") rec.stop();
        return s + 1;
      });
    }, 1000);
  }

  const stopRecording = () => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  };

  function retry() {
    blob.current = null;
    setBlobUrl(null);
    setProgress(0);
    setError(null);
    onUploaded(null);
    setPhase("idle");
  }

  async function upload() {
    const b = blob.current;
    if (!b) return;
    setError(null);
    setPhase("uploading");
    setProgress(0);
    try {
      const { uploadUrl, publicUrl } = await api<{ uploadUrl: string; publicUrl: string }>("/api/public/video-upload-url", {
        method: "POST",
        json: { slug, contentType: b.type, size: b.size },
      });
      await new Promise<void>((resolve, reject) => {
        const req = new XMLHttpRequest();
        xhr.current = req;
        req.open("PUT", uploadUrl);
        req.setRequestHeader("Content-Type", b.type);
        req.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        req.onload = () => (req.status >= 200 && req.status < 300 ? resolve() : reject(new Error("The upload was rejected by storage.")));
        req.onerror = () => reject(new Error("Network problem during upload."));
        req.send(b);
      });
      onUploaded(publicUrl);
      setPhase("uploaded");
    } catch (e) {
      setPhase("recorded"); // keep the recording so they can retry the upload
      setError(`${errMessage(e)} Your recording is still here — try uploading again.`);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black">
        {(phase === "live" || phase === "recording") && (
          <video ref={liveRef} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" aria-label="Camera preview" />
        )}
        {(phase === "recorded" || phase === "uploading" || phase === "uploaded") && blobUrl && (
          <video src={blobUrl} controls playsInline className="size-full object-contain" aria-label="Playback of your recording" />
        )}
        {(phase === "idle" || phase === "requesting" || phase === "error") && (
          <div className="grid size-full place-items-center text-center text-sm text-white/70">
            <div>
              <Video className="mx-auto mb-2 size-8" aria-hidden />
              {phase === "requesting" ? "Waiting for camera permission…" : "Record up to 2 minutes"}
            </div>
          </div>
        )}
        {phase === "recording" && (
          <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white" role="timer" aria-label={`Recording, ${seconds} seconds`}>
            <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden /> REC {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      {phase === "uploading" && (
        <div role="progressbar" aria-label="Upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {phase === "uploaded" && (
        <p role="status" className="text-sm text-good">
          ✓ Video uploaded. Submit your review below to send it.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(phase === "idle" || phase === "error") && (
          <Button onClick={startCamera}>
            <Camera className="size-4" /> Turn on camera
          </Button>
        )}
        {phase === "live" && <Button onClick={startRecording}>● Start recording</Button>}
        {phase === "recording" && (
          <Button variant="danger" onClick={stopRecording}>
            <CircleStop className="size-4" /> Stop
          </Button>
        )}
        {phase === "recorded" && <Button onClick={upload}>Upload this video</Button>}
        {(phase === "recorded" || phase === "uploaded") && (
          <Button variant="secondary" onClick={retry}>
            <RotateCcw className="size-4" /> Record again
          </Button>
        )}
        {phase === "live" && (
          <Button
            variant="ghost"
            onClick={() => {
              stopStream();
              setPhase("idle");
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
