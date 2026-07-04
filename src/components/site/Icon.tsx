import type { CSSProperties } from "react";

// Ionicons via web component. Docs: https://ionic.io/ionicons
// The component is registered globally by importing "ionicons/dist/ionicons/ionicons.esm.js".
let registered = false;
function ensureRegistered() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  import("ionicons/dist/ionicons/ionicons.esm.js").then((m) => {
    // @ts-expect-error runtime side-effect
    m?.defineCustomElements?.(window);
  });
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": {
        name?: string;
        src?: string;
        style?: CSSProperties;
        class?: string;
        className?: string;
      };
    }
  }
}

export function Icon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  ensureRegistered();
  return <ion-icon name={name} className={className} style={style} />;
}