import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import "./index.css";

// Below-the-fold routes are code-split so the initial bundle stays lean on
// low-end devices. Visual output is identical once loaded.
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const HowItWorks = lazy(() => import("./pages/HowItWorks").then((m) => ({ default: m.HowItWorks })));

// Pause decorative animations while the tab is hidden: zero CPU in background.
function usePauseHiddenAnims() {
  useEffect(() => {
    const onVis = () => document.documentElement.classList.toggle("paused", document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
}

function usePrefetchRoutes() {
  // Warm the split chunks during idle so nav feels instant. No visual change.
  useEffect(() => {
    let t: number | undefined;
    const warm = () => {
      void import("./pages/About");
      void import("./pages/HowItWorks");
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) {
      const id = ric(warm, { timeout: 2500 });
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      return () => cic?.(id);
    }
    t = window.setTimeout(warm, 1800);
    return () => window.clearTimeout(t);
  }, []);
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.location.search.includes("waitlist")) return;
    // Instant jump: html has smooth scroll, which would animate route
    // changes and feel laggy. Same destination, no animation delay.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

export default function App() {
  usePrefetchRoutes();
  usePauseHiddenAnims();
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
