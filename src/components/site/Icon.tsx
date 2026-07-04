import type { CSSProperties } from "react";
import { createElement, useEffect } from "react";

// iOS-style icons via the Ionicons web component (SF Symbols-adjacent glyphs).
// We register the custom element lazily on the client the first time an Icon renders.
let registered = false;
function ensureRegistered() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  // Dynamic string import avoids TS type resolution for the raw ESM bundle.
  const path = "ionicons/dist/ionicons/ionicons.esm.js";
  import(/* @vite-ignore */ path)
    .then((mod: { defineCustomElements?: (win: Window) => void }) => {
      mod.defineCustomElements?.(window);
    })
    .catch(() => {});
}

export function Icon({
  name,
  className,
  style,
  size,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
  size?: number | string;
}) {
  useEffect(ensureRegistered, []);
  const finalStyle: CSSProperties = { ...style };
  if (size != null) finalStyle.fontSize = typeof size === "number" ? `${size}px` : size;
  // createElement lets us render an unknown intrinsic element without a JSX type.
  return createElement("ion-icon", { name, class: className, style: finalStyle });
}