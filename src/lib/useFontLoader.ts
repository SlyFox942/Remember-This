import { useEffect, useRef } from "react";
import { googleFontsUrl } from "~/lib/fonts";

/** Dynamically loads Google Fonts by injecting a <link> element. */
export function useFontLoader(fontIds: string[]) {
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newIds = fontIds.filter((id) => !loadedRef.current.has(id));
    if (newIds.length === 0) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = googleFontsUrl(newIds);
    document.head.appendChild(link);

    newIds.forEach((id) => loadedRef.current.add(id));

    return () => {
      document.head.removeChild(link);
      newIds.forEach((id) => loadedRef.current.delete(id));
    };
  }, [fontIds]);
}
