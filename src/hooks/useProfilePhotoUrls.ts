import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "profile-photos";

function normalizeProfilePhotoPath(value: string): string {
  const photo = value.trim();
  if (!photo) return "";

  if (!/^https?:\/\//i.test(photo)) {
    return photo.replace(/^\/+/, "");
  }

  try {
    const url = new URL(photo);
    const match = decodeURIComponent(url.pathname).match(
      new RegExp(`/storage/v1/object/(?:sign|public|authenticated)/${BUCKET}/(.+)$`),
    );
    return match?.[1] ? match[1] : photo;
  } catch {
    return photo;
  }
}

async function resolveProfilePhotoUrl(photo: string, revokeList: string[]): Promise<string> {
  const normalized = normalizeProfilePhotoPath(photo);
  if (!normalized) return "";

  if (/^https?:\/\//i.test(normalized)) return normalized;

  const downloaded = await supabase.storage.from(BUCKET).download(normalized);
  if (downloaded.data) {
    const blobUrl = URL.createObjectURL(downloaded.data);
    revokeList.push(blobUrl);
    return blobUrl;
  }

  if (downloaded.error) {
    console.error("[profile-photo] download failed", downloaded.error, "path=", normalized);
  }

  const signed = await supabase.storage.from(BUCKET).createSignedUrl(normalized, 3600);
  if (signed.data?.signedUrl) return signed.data.signedUrl;

  if (signed.error) {
    console.error("[profile-photo] signed URL failed", signed.error, "path=", normalized);
  }

  return "";
}

export function useProfilePhotoUrls(photos: readonly (string | null | undefined)[] | null | undefined) {
  const photoKey = (photos ?? []).filter(Boolean).join("\n");
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const revokeList: string[] = [];
    const rawPhotos = (photos ?? []).filter((photo): photo is string => Boolean(photo));

    if (rawPhotos.length === 0) {
      setUrls([]);
      return () => undefined;
    }

    (async () => {
      const resolved = await Promise.all(
        rawPhotos.map((photo) => resolveProfilePhotoUrl(photo, revokeList)),
      );
      if (active) {
        setUrls(resolved.filter(Boolean));
      } else {
        revokeList.forEach((url) => URL.revokeObjectURL(url));
      }
    })();

    return () => {
      active = false;
      revokeList.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoKey]);

  return urls;
}

export function useProfilePhotoUrl(photo: string | null | undefined) {
  return useProfilePhotoUrls(photo ? [photo] : [])[0] ?? "";
}