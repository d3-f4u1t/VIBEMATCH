import { memo, useEffect } from "react";

function FluidBackgroundInner() {
  useEffect(() => {
    // Pause orb animations while the tab is hidden so low-end devices
    // don't burn CPU/GPU in the background. No visual change when visible.
    const onVis = () => {
      document.documentElement.classList.toggle("bg-paused", document.hidden);
    };
    onVis();
    document.addEventListener("visibilitychange", onVis, { passive: true });
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="fluid-bg" aria-hidden>
      <div className="orb orb-pink" />
      <div className="orb orb-coral" />
      <div className="orb orb-plum" />
    </div>
  );
}

export const FluidBackground = memo(FluidBackgroundInner);
