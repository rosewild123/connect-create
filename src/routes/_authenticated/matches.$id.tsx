import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/matches/$id")({
  head: () => ({ meta: [{ title: "Chat — Senda" }] }),
  component: Chat,
});

type Message = { id: string; sender_id: string; content: string; created_at: string };

function Chat() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [other, setOther] = useState<{ id: string; display_name: string | null; photos: string[] } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const { data: m, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
    if (error || !m) { toast.error("Match not found"); navigate({ to: "/matches" }); return; }
    const otherId = m.user_a === u.user.id ? m.user_b : m.user_a;
    const { data: prof } = await supabase.from("profiles").select("id,display_name,photos").eq("id", otherId).maybeSingle();
    if (prof) {
      setOther(prof);
      if (prof.photos?.[0]) {
        const { data: s } = await supabase.storage.from("profile-photos").createSignedUrl(prof.photos[0], 3600);
        if (s) setPhotoUrl(s.signedUrl);
      }
    }
    const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", id).order("created_at");
    setMessages(msgs || []);
  })(); }, [id, navigate]);

  useEffect(() => {
    const ch = supabase.channel(`match:${id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${id}` },
      (payload) => setMessages((prev) => [...prev, payload.new as Message]),
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

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <Link to="/matches"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="h-9 w-9 overflow-hidden rounded-full bg-muted">
          {photoUrl && <img src={photoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 font-semibold">{other?.display_name || "Creator"}</div>
        {other && (
          <ReportBlockMenu targetId={other.id} targetName={other.display_name}
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
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-card/80 px-3 py-3 backdrop-blur">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message..." className="rounded-full" maxLength={2000} />
        <button type="submit" disabled={!draft.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
