import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

// Prefetch split chunks on hover/focus so page switches feel instant.
// No visual change — just warms the already-split bundles.
function prefetchAbout() {
  void import("../pages/About");
}
function prefetchHow() {
  void import("../pages/HowItWorks");
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const goWaitlist = () => {
    setOpen(false);
    // If already home, scroll immediately without a router round-trip.
    if (window.location.pathname === "/") {
      requestAnimationFrame(() => {
        document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    navigate("/?waitlist=1");
    // Wait a frame for the home route to mount, then scroll once.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            V
          </span>
          VibeMatch
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "active" : "")}
            onMouseEnter={prefetchAbout}
            onFocus={prefetchAbout}
          >
            Our story
          </NavLink>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) => (isActive ? "active" : "")}
            onMouseEnter={prefetchHow}
            onFocus={prefetchHow}
          >
            Sneak peek
          </NavLink>
          <a href="/#labs">Vibe Lab</a>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="nav-cta">
            <button className="btn btn-primary btn-sm" onClick={goWaitlist}>
              Get early access <ArrowRight size={15} />
            </button>
          </span>
          <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/about" onClick={() => setOpen(false)} onMouseEnter={prefetchAbout} onFocus={prefetchAbout}>Our story</Link>
        <Link to="/how-it-works" onClick={() => setOpen(false)} onMouseEnter={prefetchHow} onFocus={prefetchHow}>Sneak peek</Link>
        <a href="/#labs" onClick={() => setOpen(false)}>Vibe Lab</a>
        <button className="btn btn-primary" onClick={goWaitlist} style={{ marginTop: 8 }}>
          Get early access <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}
