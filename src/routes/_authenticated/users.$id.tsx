import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, MapPin, Sparkles, Flame } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import type { Platform } from "@/lib/senda";

export const Route = createFileRoute("/_authenticated/users/$id")({
  head: () => ({ meta: [{ title: "Profile — Senda" }] }),
  component: UserProfilePage,
});

type Profile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  age: number | null;
  location_city: string | null;
  location_country: string | null;
  willing_to_travel: boolean;
  experience_years: number | null;
  completed_collabs: number;
  looking_for: string[];
  niches: string[];
  platforms: Platform[];
  photos: string[];
  photo_verified: boolean;
  prompts: { q: string; a: string }[] | null;
  last_active_at: string | null;
};

function UserProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }
      setProfile(data as unknown as Profile);
      const p = data as unknown as Profile;
      if (p.photos?.length) {
        const results = await Promise.all(
          p.photos.map((path) =>
            supabase.storage.from("profile-photos").createSignedUrl(path, 3600)
          )
        );
        setPhotoUrls(results.map((r) => r.data?.signedUrl || ""));
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="p-6 text-muted-foreground">Profile not found.</div>
      </AppShell>
    );
  }

  const loc = [profile.location_city, profile.location_country]
    .filter(Boolean)
    .join(", ");
  const photoCount = photoUrls.length || 1;

  return (
    <AppShell>
      <div className="px-5 py-4">
        <button
          onClick={() => navigate({ to: ".." })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-muted">
          {photoUrls[photoIdx] ? (
            <img
              src={photoUrls[photoIdx]}
              alt={profile.display_name || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              No photo
            </div>
          )}

          <div className="absolute right-3 top-3 z-10">
            <PresenceIndicator lastActiveAt={profile.last_active_at} />
          </div>

          {photoUrls.length > 1 && (
            <>
              <div className="absolute left-3 right-3 top-3 flex gap-1">
                {photoUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i === photoIdx ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPhotoIdx(Math.max(0, photoIdx - 1))}
                className="absolute inset-y-0 left-0 w-1/3"
              />
              <button
                onClick={() =>
                  setPhotoIdx(Math.min(photoCount - 1, photoIdx + 1))
                }
                className="absolute inset-y-0 right-0 w-1/3"
              />
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5 text-white">
            <h2 className="flex items-center gap-1.5 font-display text-3xl font-bold">
              {profile.display_name}
              {profile.age && (
                <span className="font-sans text-2xl font-normal">
                  , {profile.age}
                </span>
              )}
              {profile.photo_verified && (
                <VerifiedBadge className="h-6 w-6" />
              )}
            </h2>
            {loc && (
              <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                {loc}
                {profile.willing_to_travel && " · ✈️ travels"}
              </p>
            )}
            {profile.niches.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.niches.slice(0, 6).map((n) => (
                  <span
                    key={n}
                    className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs backdrop-blur"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
        )}

        {profile.prompts && profile.prompts.length > 0 && (
          <ul className="mt-4 space-y-2">
            {profile.prompts.map((p, i) => (
              <li
                key={i}
                className="rounded-2xl border border-border bg-card p-3"
              >
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {p.q}
                </div>
                <p className="mt-1 text-sm">{p.a}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {profile.experience_years != null && (
            <Stat
              icon={<Sparkles className="h-3 w-3" />}
              label={`${profile.experience_years}y in industry`}
            />
          )}
          <Stat
            icon={<Flame className="h-3 w-3" />}
            label={`${profile.completed_collabs} collabs`}
          />
        </div>

        {profile.platforms.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
              Platforms
            </h3>
            <ul className="mt-2 space-y-2">
              {profile.platforms.map((p, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  <div className="font-medium">{p.platform}</div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary"
                  >
                    {p.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.looking_for.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
              Looking for
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.looking_for.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
      {icon}
      {label}
    </span>
  );
}
