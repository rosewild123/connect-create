import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleQuestion, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_PROMPTS, PROMPT_QUESTIONS, type Prompt } from "@/lib/prompts";
import { scanContent } from "@/lib/contentFilter";

export function PromptsEditor({ userId, initial }: { userId: string; initial: Prompt[] }) {
  const [prompts, setPrompts] = useState<Prompt[]>(initial ?? []);
  const [picking, setPicking] = useState(false);
  const [draftQ, setDraftQ] = useState<string | null>(null);
  const [draftA, setDraftA] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setPrompts(initial ?? []); }, [initial]);

  const available = PROMPT_QUESTIONS.filter((q) => !prompts.some((p) => p.q === q));

  async function persist(next: Prompt[]) {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ prompts: next } as never)
      .eq("id", userId);
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    setPrompts(next);
    return true;
  }

  async function saveDraft() {
    if (!draftQ || !draftA.trim()) return;
    const scan = scanContent(draftA);
    if (!scan.clean) {
      toast.error("Please remove abusive or offensive language before saving.");
      return;
    }
    const next = [...prompts, { q: draftQ, a: draftA.trim().slice(0, 180) }];
    const ok = await persist(next);
    if (ok) {
      setDraftQ(null); setDraftA(""); setPicking(false);
      toast.success("Prompt added");
    }
  }

  async function remove(i: number) {
    const next = prompts.filter((_, idx) => idx !== i);
    if (await persist(next)) toast.success("Removed");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <MessageCircleQuestion className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Profile prompts</div>
          <p className="text-xs text-muted-foreground">
            Add up to {MAX_PROMPTS} icebreakers so people have something to message you about.
          </p>
        </div>
      </div>

      {prompts.length > 0 && (
        <ul className="mt-3 space-y-2">
          {prompts.map((p, i) => (
            <li key={i} className="group relative rounded-xl bg-background/60 p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.q}</div>
              <p className="mt-1 text-sm">{p.a}</p>
              <button
                onClick={() => remove(i)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                aria-label="Remove prompt"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {picking ? (
        <div className="mt-3 rounded-xl bg-background/60 p-3">
          {draftQ ? (
            <>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{draftQ}</div>
              <Textarea
                autoFocus
                value={draftA}
                onChange={(e) => setDraftA(e.target.value.slice(0, 180))}
                placeholder="Your answer…"
                className="mt-2 min-h-20 resize-none"
              />
              <div className="mt-1 text-right text-[10px] text-muted-foreground">{draftA.length}/180</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={saveDraft} disabled={!draftA.trim() || saving} className="rounded-full">
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setDraftQ(null); setDraftA(""); }} className="rounded-full">
                  Back
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold text-muted-foreground">Pick a prompt</div>
              <ul className="mt-2 space-y-1">
                {available.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => setDraftQ(q)}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm transition hover:bg-muted"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="ghost" onClick={() => setPicking(false)} className="mt-2 rounded-full">
                Cancel
              </Button>
            </>
          )}
        </div>
      ) : (
        prompts.length < MAX_PROMPTS && available.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPicking(true)}
            className="mt-3 w-full rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> Add a prompt
          </Button>
        )
      )}
    </div>
  );
}
