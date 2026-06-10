import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, ImagePlus, Mic, Square, X, Play, Pause, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const Route = createFileRoute("/_authenticated/matches/$id")({
  head: () => ({ meta: [{ title: "Chat — Senda" }] }),
  component: Chat,
});

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  media_path: string | null;
  media_type: string | null;
  duration_ms: number | null;
};

function Chat() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [other, setOther] = useState<{ id: string; display_name: string | null; photos: string[]; photo_verified?: boolean } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const { data: m, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
    if (error || !m) { toast.error("Match not found"); navigate({ to: "/matches" }); return; }
    const otherId = m.user_a === u.user.id ? m.user_b : m.user_a;
    const { data: prof } = await supabase.from("profiles").select("id,display_name,photos,photo_verified").eq("id", otherId).maybeSingle();
    if (prof) {
      setOther(prof);
      if (prof.photos?.[0]) {
        const { data: s } = await supabase.storage.from("profile-photos").createSignedUrl(prof.photos[0], 3600);
        if (s) setPhotoUrl(s.signedUrl);
      }
    }
    const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", id).order("created_at");
    setMessages((msgs || []) as Message[]);
  })(); }, [id, navigate]);

  useEffect(() => {
    const ch = supabase.channel(`match:${id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${id}` },
      (payload) => setMessages((prev) => {
        const next = payload.new as Message;
        if (prev.some((p) => p.id === next.id)) return prev;
        return [...prev, next];
      }),
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !me) return;
    const text = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({ match_id: id, sender_id: me, content: text });
    if (error) toast.error(error.message);
  }

  async function uploadAndInsert(file: Blob, mediaType: "image" | "audio", ext: string, durationMs?: number) {
    if (!me) return;
    setUploading(true);
    try {
      const path = `${id}/${me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("chat-media").upload(path, file, {
        contentType: file.type || (mediaType === "image" ? "image/jpeg" : "audio/webm"),
        upsert: false,
      });
      if (up.error) throw up.error;
      const { error } = await supabase.from("messages").insert({
        match_id: id, sender_id: me, content: null,
        media_path: path, media_type: mediaType,
        duration_ms: durationMs ?? null,
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Pick an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    await uploadAndInsert(file, "image", ext);
  }

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <Link to="/matches"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="h-9 w-9 overflow-hidden rounded-full bg-muted">
          {photoUrl && <img src={photoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-1 items-center gap-1 font-semibold">{other?.display_name || "Creator"}{other?.photo_verified && <VerifiedBadge className="h-4 w-4" />}</div>
        {other && (
          <ReportBlockMenu targetId={other.id} targetName={other.display_name}
            matchId={id}
            onUnmatched={() => navigate({ to: "/matches" })}
            onBlocked={() => navigate({ to: "/matches" })} />
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">You matched! Start the conversation.</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <MessageBubble msg={m} mine={mine} />
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-card/80 px-3 py-3 backdrop-blur">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40"
          aria-label="Send image">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        <VoiceRecorder onRecorded={(blob, ms) => uploadAndInsert(blob, "audio", "webm", ms)} disabled={uploading} />
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message..." className="rounded-full" maxLength={2000} />
        <button type="submit" disabled={!draft.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ msg, mine }: { msg: Message; mine: boolean }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    if (!msg.media_path) return;
    (async () => {
      const { data } = await supabase.storage.from("chat-media").createSignedUrl(msg.media_path!, 3600);
      if (data) setUrl(data.signedUrl);
    })();
  }, [msg.media_path]);

  if (msg.media_type === "image") {
    return (
      <div className="overflow-hidden rounded-2xl bg-muted max-w-[75%]">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt="" className="block max-h-80 w-auto" />
          </a>
        ) : (
          <div className="h-40 w-40 animate-pulse" />
        )}
      </div>
    );
  }

  if (msg.media_type === "audio") {
    return <AudioPlayer url={url} durationMs={msg.duration_ms} mine={mine} />;
  }

  return (
    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
      {msg.content}
    </div>
  );
}

function AudioPlayer({ url, durationMs, mine }: { url: string; durationMs: number | null; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  const seconds = durationMs ? Math.round(durationMs / 1000) : null;
  const label = seconds != null ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}` : "Voice note";

  return (
    <div className={`flex items-center gap-3 rounded-full px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
      <button type="button" onClick={toggle}
        className={`grid h-8 w-8 place-items-center rounded-full ${mine ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground"}`}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`w-0.5 rounded-full ${mine ? "bg-primary-foreground/70" : "bg-muted-foreground/60"}`}
            style={{ height: `${6 + ((i * 7) % 10)}px` }} />
        ))}
      </div>
      <span className="text-xs opacity-80 tabular-nums">{label}</span>
      {url && <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} preload="none" />}
    </div>
  );
}

function VoiceRecorder({ onRecorded, disabled }: { onRecorded: (blob: Blob, durationMs: number) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef = useRef(false);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) { toast.error("Mic not supported"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelRef.current = false;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        const ms = Date.now() - startRef.current;
        setRecording(false);
        setElapsed(0);
        if (cancelRef.current) return;
        if (ms < 500) { toast.info("Hold to record a voice note"); return; }
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        onRecorded(blob, ms);
      };
      recRef.current = rec;
      rec.start();
      startRef.current = Date.now();
      setRecording(true);
      intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 200);
    } catch {
      toast.error("Mic permission denied");
    }
  }

  function stop(cancel = false) {
    cancelRef.current = cancel;
    recRef.current?.stop();
  }

  if (recording) {
    const m = Math.floor(elapsed / 60); const s = elapsed % 60;
    return (
      <div className="flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
        <span className="text-xs tabular-nums text-destructive">{m}:{s.toString().padStart(2, "0")}</span>
        <button type="button" onClick={() => stop(true)} className="text-muted-foreground" aria-label="Cancel">
          <X className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => stop(false)} className="grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground" aria-label="Send voice note">
          <Square className="h-3 w-3 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={start} disabled={disabled}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40"
      aria-label="Record voice note">
      <Mic className="h-4 w-4" />
    </button>
  );
}
