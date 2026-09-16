import { useEffect, useRef, type ReactNode } from "react";

let sharedIO: IntersectionObserver | null = null;
const pending = new Map<Element, () => void>();

function getSharedIO() {
  if (sharedIO || typeof IntersectionObserver === "undefined") return sharedIO;
  sharedIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const cb = pending.get(e.target);
          if (cb) {
            pending.delete(e.target);
            sharedIO?.unobserve(e.target);
            cb();
          }
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px 12% 0px" }
  );
  return sharedIO;
}

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getSharedIO();
    // Fallback: no IO support -> show immediately (same final visual state).
    if (!io) {
      el.classList.add("in");
      return;
    }
    pending.set(el, () => el.classList.add("in"));
    io.observe(el);
    return () => {
      pending.delete(el);
      io.unobserve(el);
    };
  }, []);
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
