import type { ReactNode } from "react";

// Scroll reveal removed — sections render immediately.
// Kept as a passthrough so existing usages keep working.
export function Reveal({ children }: { children: ReactNode; delay?: number }) {
  return <>{children}</>;
}
