import { type ImgHTMLAttributes } from "react";

/**
 * Displays a profile photo with anti-screenshot deterrents:
 * - Disables right-click / long-press save / drag
 * - Blocks text/image selection
 * - Overlays a repeating diagonal "SENDA" watermark.
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
  const tag = "SENDA";


  if (!src) return null;

  return (
    <div className={`absolute inset-0 ${className ?? ""}`}>
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
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName ?? ""}`}
        {...rest}
      />
      {/* Tiled diagonal watermark */}
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
