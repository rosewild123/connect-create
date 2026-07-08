import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Displays a profile photo with anti-screenshot deterrents:
 * - Disables right-click / long-press save / drag
 * - Blocks text/image selection
 * - Overlays a repeating diagonal watermark of the viewer's short ID so
 *   any screenshot that leaks can be traced back to the account that took it.
 *
 * Note: no web tech can truly prevent OS-level screenshots. This is a strong
 * deterrent + attribution layer, which is the industry standard approach.
 */
export function ProtectedPhoto({
  src,
  alt,
  className,
  imgClassName,
  ...rest
}: {
  src: string | undefined;
  alt?: string;
  className?: string;
  imgClassName?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "className">) {
  const [tag, setTag] = useState<string>("SENDA");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      const email = data.user?.email;
      const short = id ? id.slice(0, 8) : "";
      const handle = email ? email.split("@")[0] : "";
      setTag(`SENDA · ${handle || short}`.toUpperCase());
    });
  }, []);

  if (!src) return null;

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      <img
        src={src}
        alt={alt ?? ""}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          pointerEvents: "none",
        }}
        className={`h-full w-full object-cover ${imgClassName ?? ""}`}
        {...rest}
      />
      {/* Tiled diagonal watermark — traceable to the viewing account */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        style={{
          transform: "rotate(-24deg) scale(1.4)",
          transformOrigin: "center",
          opacity: 0.18,
          mixBlendMode: "overlay",
        }}
      >
        <div
          className="flex h-full w-full flex-col justify-between text-white"
          style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em" }}
        >
          {Array.from({ length: 14 }).map((_, r) => (
            <div key={r} className="flex justify-between whitespace-nowrap">
              {Array.from({ length: 6 }).map((_, c) => (
                <span key={c}>{tag}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
