import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Heart, MessageCircle, User } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const path = location.pathname;
  const item = (href: string, label: string, Icon: typeof Flame) => {
    const active = path.startsWith(href);
    return (
      <Link
        to={href}
        className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        <Icon className={`h-6 w-6 ${active ? "fill-primary/20" : ""}`} />
        {label}
      </Link>
    );
  };
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center border-t border-border bg-card/90 backdrop-blur">
        {item("/discover", "Discover", Flame)}
        {item("/likes", "Likes", Heart)}
        {item("/matches", "Matches", MessageCircle)}
        {item("/profile", "Profile", User)}
      </nav>
    </div>
  );
}
