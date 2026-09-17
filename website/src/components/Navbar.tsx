import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

function prefetchAbout() {
  void import("../pages/About");
}
function prefetchHow() {
  void import("../pages/HowItWorks");
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goWaitlist = () => {
    setOpen(false);
    if (window.location.pathname === "/") {
      requestAnimationFrame(() => {
        document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    navigate("/?waitlist=1");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand" onClick={() => setOpen(false)} aria-label="vibematch home">
            <span className="brand-dot" aria-hidden />vibematch
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
              How it works
            </NavLink>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="nav-cta">
              <button className="btn btn-dark btn-sm" onClick={goWaitlist}>
                Get early access <ArrowRight size={15} />
              </button>
            </span>
            <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        <div className="scroll-progress" ref={barRef} aria-hidden />
      </nav>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/about" onClick={() => setOpen(false)}>Our story</Link>
        <Link to="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
        <button className="btn btn-dark" onClick={goWaitlist} style={{ marginTop: 8 }}>
          Get early access <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}
