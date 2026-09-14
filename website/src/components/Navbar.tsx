import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const goWaitlist = () => {
    setOpen(false);
    navigate("/?waitlist=1");
    setTimeout(() => {
      document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
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
          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
            About
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? "active" : "")}>
            How it works
          </NavLink>
          <a href="/#labs">Vibe Lab</a>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="nav-cta">
            <button className="btn btn-primary btn-sm" onClick={goWaitlist}>
              Join waitlist <ArrowRight size={15} />
            </button>
          </span>
          <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/about" onClick={() => setOpen(false)}>About</Link>
        <Link to="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
        <a href="/#labs" onClick={() => setOpen(false)}>Vibe Lab</a>
        <button className="btn btn-primary" onClick={goWaitlist} style={{ marginTop: 8 }}>
          Join waitlist <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}
