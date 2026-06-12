import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.userAgent ?? null,
        },
        { onConflict: "user_id,endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { endpoint: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", data.endpoint);
    return { ok: true };
  });

type NotifyPayload = {
  toUserId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

async function sendToUser(payload: NotifyPayload) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { default: webpush } = await import("web-push");

  const publicKey = "BMg6ipw6XE-JdG2iznJGEdPtViLgKITctMoqSTZ52nd0tAwdrOKdN2ZejlcFE3E_lsPD74fW4Hw8SlKQ1dVkNoc";
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@example.com";
  if (!privateKey) {
    console.warn("[push] VAPID_PRIVATE_KEY not set, skipping send");
    return { sent: 0 };
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", payload.toUserId);

  if (!subs || subs.length === 0) return { sent: 0 };

  const notifBody = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    tag: payload.tag,
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notifBody,
        );
        sent++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("[push] send failed", status, err?.body);
        }
      }
    }),
  );
  return { sent };
}

export const notifyNewMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { matchId: string; preview: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: match } = await supabase
      .from("matches")
      .select("user_a, user_b")
      .eq("id", data.matchId)
      .single();
    if (!match) return { sent: 0 };
    const recipient = match.user_a === userId ? match.user_b : match.user_a;

    const { data: senderRpc } = await supabase.rpc("get_my_profile");
    const sender = Array.isArray(senderRpc) ? senderRpc[0] : senderRpc;

    return sendToUser({
      toUserId: recipient,
      title: sender?.display_name ?? "New message",
      body: data.preview.slice(0, 140),
      url: `/matches/${data.matchId}`,
      tag: `msg-${data.matchId}`,
    });
  });

export const notifyPotentialMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { swipeeId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Did a match get created by the trigger?
    const a = userId < data.swipeeId ? userId : data.swipeeId;
    const b = userId < data.swipeeId ? data.swipeeId : userId;
    const { data: match } = await supabase
      .from("matches")
      .select("id, created_at")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (!match) return { sent: 0 };
    // Only notify if match was just created (within last 10s)
    if (Date.now() - new Date(match.created_at).getTime() > 10_000) return { sent: 0 };

    const { data: me } = await supabase.from("profiles").select("display_name").eq("id", userId).single();
    const { data: them } = await supabase.from("profiles").select("display_name").eq("id", data.swipeeId).single();

    const [r1, r2] = await Promise.all([
      sendToUser({
        toUserId: data.swipeeId,
        title: "It's a match! 💖",
        body: `You and ${me?.display_name ?? "someone"} liked each other`,
        url: `/matches/${match.id}`,
        tag: `match-${match.id}`,
      }),
      sendToUser({
        toUserId: userId,
        title: "It's a match! 💖",
        body: `You and ${them?.display_name ?? "someone"} liked each other`,
        url: `/matches/${match.id}`,
        tag: `match-${match.id}`,
      }),
    ]);
    return { sent: r1.sent + r2.sent };
  });
