import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { NICHES, PLATFORMS, LOOKING_FOR, type Platform } from "@/lib/senda";
import { X, Plus, Upload } from "lucide-react";
import { scanContent } from "@/lib/contentFilter";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Senda" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [travel, setTravel] = useState(false);
  const [experience, setExperience] = useState<number | "">("");
  const [completed, setCompleted] = useState<number | "">(0);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) {
        setDisplayName(p.display_name || "");
        setBio(p.bio || "");
        setDob(p.date_of_birth || "");
        setCity(p.location_city || "");
        setCountry(p.location_country || "");
        setTravel(p.willing_to_travel);
        setExperience(p.experience_years ?? "");
        setCompleted(p.completed_collabs);
        setLookingFor(p.looking_for || []);
        setNiches(p.niches || []);
        setPlatforms((p.platforms as Platform[]) || []);
        setPhotos(p.photos || []);
        if (p.is_onboarded) navigate({ to: "/discover" });
      }
    });
  }, [navigate]);

  function toggle(arr: string[], v: string, set: (a: string[]) => void) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  async function uploadPhoto(file: File) {
    if (!userId) return;
    if (photos.length >= 6) { toast.error("Max 6 photos"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("profile-photos").upload(path, file);
      if (error) throw error;
      const { data } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
      // Store path; we'll resolve to signed URL on read. Simpler: use public-ish signed URL stored.
      setPhotos([...photos, data?.signedUrl ? path : path]);
      toast.success("Photo added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(finish: boolean) {
    if (!userId) return;
    const nameScan = scanContent(displayName);
    const bioScan = scanContent(bio);
    if (!nameScan.clean || !bioScan.clean) {
      toast.error("Please remove abusive or offensive language from your name and bio.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: userId,
        display_name: displayName.trim(),
        bio: bio.trim(),
        date_of_birth: dob || null,
        location_city: city.trim(),
        location_country: country.trim(),
        willing_to_travel: travel,
        experience_years: experience === "" ? null : Number(experience),
        completed_collabs: completed === "" ? 0 : Number(completed),
        looking_for: lookingFor,
        niches,
        platforms: platforms as never,
        photos,
        ...(finish ? { is_onboarded: true } : {}),
      };
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;
      if (finish) {
        toast.success("Welcome to Senda 🔥");
        navigate({ to: "/discover" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const canNext1 = displayName.length >= 2 && dob.length === 10;
  const canNext2 = niches.length > 0 && lookingFor.length > 0;
  const canFinish = photos.length >= 1;

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <div className="mb-6 flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <h1 className="font-display text-3xl font-bold">
        {step === 1 && "The basics"}
        {step === 2 && "Your style"}
        {step === 3 && "Platforms & experience"}
        {step === 4 && "Show yourself"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === 1 && "Name, age, where you're based."}
        {step === 2 && "What you make and who you want to meet."}
        {step === 3 && "Where to find you and how long you've been at it."}
        {step === 4 && "Add at least one photo to go live."}
      </p>

      <div className="mt-8 space-y-5">
        {step === 1 && (
          <>
            <Field label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your creator name" className="rounded-xl" />
            </Field>
            <Field label="Bio">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} placeholder="A line or two about you" className="rounded-xl" />
            </Field>
            <Field label="Date of birth (must be 18+)">
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="rounded-xl" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" /></Field>
              <Field label="Country"><Input value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl" /></Field>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <div className="font-medium">Willing to travel</div>
                <div className="text-xs text-muted-foreground">For in-person collabs</div>
              </div>
              <Switch checked={travel} onCheckedChange={setTravel} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Label>Looking for</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LOOKING_FOR.map((o) => (
                  <Chip key={o.id} active={lookingFor.includes(o.id)} onClick={() => toggle(lookingFor, o.id, setLookingFor)}>{o.label}</Chip>
                ))}
              </div>
            </div>
            <div>
              <Label>Your niches</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {NICHES.map((n) => (
                  <Chip key={n} active={niches.includes(n)} onClick={() => toggle(niches, n, setNiches)}>{n}</Chip>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <Label>Platforms</Label>
              <p className="mb-2 mt-1 text-xs text-muted-foreground">Add your links so collab partners can find your work.</p>
              <div className="space-y-2">
                {platforms.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={p.platform}
                      onChange={(e) => { const c = [...platforms]; c[i].platform = e.target.value; setPlatforms(c); }}
                      className="rounded-xl border border-border bg-input px-3 py-2 text-sm"
                    >
                      {PLATFORMS.map((pl) => <option key={pl}>{pl}</option>)}
                    </select>
                    <Input value={p.url} onChange={(e) => { const c = [...platforms]; c[i].url = e.target.value; setPlatforms(c); }} placeholder="https://..." className="rounded-xl" />
                    <Button variant="ghost" size="icon" onClick={() => setPlatforms(platforms.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full rounded-xl" onClick={() => setPlatforms([...platforms, { platform: PLATFORMS[0], url: "" }])}>
                  <Plus className="mr-1 h-4 w-4" /> Add platform
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Years in industry">
                <Input type="number" min={0} max={50} value={experience} onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))} className="rounded-xl" />
              </Field>
              <Field label="Completed collabs">
                <Input type="number" min={0} value={completed} onChange={(e) => setCompleted(e.target.value === "" ? "" : Number(e.target.value))} className="rounded-xl" />
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <PhotoTile key={i} path={p} onRemove={() => setPhotos(photos.filter((_, j) => j !== i))} />
              ))}
              {photos.length < 6 && (
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary">
                  {uploading ? "..." : <><Upload className="h-5 w-5" /><span className="mt-1 text-xs">Add</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Up to 6 photos. The first one is your main.</p>
          </>
        )}
      </div>

      <div className="mt-10 flex gap-3">
        {step > 1 && <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 4 && (
          <Button
            className="flex-1 rounded-full bg-primary text-primary-foreground"
            disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
            onClick={async () => { await save(false); setStep(step + 1); }}
          >Continue</Button>
        )}
        {step === 4 && (
          <Button
            className="flex-1 rounded-full bg-primary text-primary-foreground"
            disabled={!canFinish || loading}
            onClick={() => save(true)}
          >{loading ? "..." : "Go live"}</Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label><div className="mt-1">{children}</div></div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary"}`}
    >{children}</button>
  );
}

function PhotoTile({ path, onRemove }: { path: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    supabase.storage.from("profile-photos").createSignedUrl(path, 3600).then(({ data }) => {
      if (data) setUrl(data.signedUrl);
    });
  }, [path]);
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button onClick={onRemove} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
