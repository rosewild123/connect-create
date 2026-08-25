import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Heart, MessageCircle, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMatches } from "@/hooks/useUnreadMatches";
import { useVerified } from "@/hooks/useVerified";
import { VerifyNudge } from "@/components/VerifyNudge";

export function AppShell({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const path = location.pathname;
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);
  const { verified, loading: verifiedLoading } = useVerified(me);
  const showNudge =
    !verifiedLoading && verified === false && !path.startsWith("/profile") && !path.startsWith("/onboarding");

  const { totalUnread } = useUnreadMatches(me);

  const item = (href: string, label: string, Icon: typeof Flame, badge?: number) => {
    const active = path.startsWith(href);
    return (
      <Link
        to={href}
        className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        <div className="relative">
          <Icon className={`h-6 w-6 ${active ? "fill-primary/20" : ""}`} />
          {badge ? (
            <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-[18px] text-primary-foreground">
              {badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </div>
        {label}
      </Link>
    );
  };
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <main className="flex-1 pb-20">
        {showNudge ? <VerifyNudge /> : null}
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center border-t border-border bg-card/90 backdrop-blur">
        {item("/discover", "Discover", Flame)}
        {item("/likes", "Likes", Heart)}
        {item("/matches", "Matches", MessageCircle, totalUnread)}
        {item("/profile", "Profile", User)}
      </nav>
    </div>
  );
}
