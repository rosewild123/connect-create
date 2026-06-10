import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const VERIFICATION_POSES = [
  "Hold up your LEFT hand with exactly THREE fingers extended next to your face",
  "Touch your RIGHT ear with your LEFT hand",
  "Make a thumbs-up next to your LEFT cheek",
  "Point at the camera with your RIGHT index finger",
  "Place your RIGHT hand flat on top of your head",
  "Make a peace sign (two fingers) with your RIGHT hand next to your chin",
] as const;

type Result =
  | { ok: true; passed: boolean; notes: string }
  | { ok: false; error: string };

export const submitPhotoVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { selfiePath: string; pose: string }) => d)
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!VERIFICATION_POSES.includes(data.pose as typeof VERIFICATION_POSES[number])) {
      return { ok: false, error: "Invalid pose" };
    }
    if (!data.selfiePath.startsWith(`${userId}/`)) {
      return { ok: false, error: "Invalid selfie path" };
    }

    const { data: prof, error: profErr } = await supabase
      .from("profiles").select("photos").eq("id", userId).maybeSingle();
    if (profErr || !prof?.photos?.length) {
      return { ok: false, error: "Add a profile photo before verifying" };
    }

    async function toDataUrl(bucket: string, path: string): Promise<string> {
      const { data: blob, error } = await supabaseAdmin.storage.from(bucket).download(path);
      if (error || !blob) throw new Error(`Could not load ${bucket}/${path}`);
      const buf = Buffer.from(await blob.arrayBuffer());
      const mime = blob.type || "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }

    let selfieUrl: string, profileUrl: string;
    try {
      [selfieUrl, profileUrl] = await Promise.all([
        toDataUrl("verifications", data.selfiePath),
        toDataUrl("profile-photos", prof.photos[0]),
      ]);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Image load failed" };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "AI not configured" };

    const prompt =
      `You are verifying a dating-app user's identity. Image 1 is their existing PROFILE photo. ` +
      `Image 2 is a SELFIE taken just now. The user was asked to do this pose: "${data.pose}". ` +
      `Respond ONLY with a JSON object: {"same_person": boolean, "doing_pose": boolean, "notes": "1 short sentence"}. ` +
      `same_person=true only if you are confident the same individual appears in both. ` +
      `doing_pose=true only if the selfie clearly shows the requested pose. ` +
      `Be strict but fair.`;

    let aiRes: Response;
    try {
      aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: profileUrl } },
              { type: "image_url", image_url: { url: selfieUrl } },
            ],
          }],
        }),
      });
    } catch {
      return { ok: false, error: "AI request failed" };
    }
    if (!aiRes.ok) {
      const body = await aiRes.text().catch(() => "");
      console.error("AI gateway error", aiRes.status, body);
      if (aiRes.status === 429) return { ok: false, error: "Verification is busy — try again in a moment" };
      if (aiRes.status === 402) return { ok: false, error: "Verification temporarily unavailable" };
      return { ok: false, error: "Verification service error" };
    }

    const json = await aiRes.json();
    const raw = json?.choices?.[0]?.message?.content ?? "";
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    const match = text.match(/\{[\s\S]*\}/);
    let parsed: { same_person?: boolean; doing_pose?: boolean; notes?: string } = {};
    try { parsed = match ? JSON.parse(match[0]) : {}; } catch { /* */ }

    const passed = !!parsed.same_person && !!parsed.doing_pose;
    const notes = parsed.notes || (passed ? "Verified" : "Could not verify");

    await supabase.from("photo_verifications").insert({
      user_id: userId,
      pose: data.pose,
      selfie_path: data.selfiePath,
      status: passed ? "passed" : "failed",
      ai_notes: notes,
    });

    if (passed) {
      await supabase.from("profiles")
        .update({ photo_verified: true, photo_verified_at: new Date().toISOString() })
        .eq("id", userId);
    }

    return { ok: true, passed, notes };
  });
