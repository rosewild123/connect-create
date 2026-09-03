import { Link } from "@tanstack/react-router";
import { Flame, X } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "senda_plus_nudge_dismissed_at";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Slim, dismissible banner reminding free members what Senda Plus unlocks.
 * Snoozes for 3 days once closed.
 */
export function PlusNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const at = raw ? Number(raw) : 0;
    setShow(!at || Date.now() - at > SNOOZE_MS);
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 border-b border-primary/25 bg-gradient-to-r from-primary/15 to-amber-500/10 px-4 py-2.5">
      <Flame className="h-5 w-5 shrink-0 text-primary" />
      <Link to="/upgrade" className="flex-1 text-left text-xs leading-snug">
        <span className="font-semibold">Get Senda Plus.</span>{" "}
        <span className="text-muted-foreground">
          Unlimited swipes, see who liked you, monthly boost.
        </span>
      </Link>
      <button
        type="button"
        aria-label="Dismiss Senda Plus reminder"
        onClick={() => {
          localStorage.setItem(KEY, String(Date.now()));
          setShow(false);
        }}
        className="shrink-0 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
