import { Camera, AtSign, ShieldCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link to="/" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none", fontWeight: 700, fontSize: 19 }}>
              <span className="brand-mark" aria-hidden="true">V</span>
              VibeMatch
            </Link>
            <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 34 * 10 }}>
              The upcoming music-first dating app. Taste, energy and vibe — before photos. Private preview launching city by city. Get first access.
            </p>
            <div className="socials" style={{ marginTop: 14 }}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={17} /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><AtSign size={17} /></a>
              <a href="#safety" aria-label="Safety"><ShieldCheck size={17} /></a>
              <a href="#love" aria-label="Love"><Heart size={17} /></a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/about">Our story</Link>
            <Link to="/how-it-works">Sneak peek</Link>
            <a href="/#labs">Inside Vibe Lab</a>
            <a href="/?waitlist=1">Get early access</a>
          </div>
          <div>
            <h4>Why VibeMatch</h4>
            <Link to="/about">Music-first matching</Link>
            <Link to="/how-it-works">Mutual-only chat</Link>
            <a href="/#labs">Adaptive engine</a>
            <Link to="/how-it-works">FAQ</Link>
          </div>
          <div>
            <h4>Trust</h4>
            <a href="#safety">Respect-first design</a>
            <a href="#privacy">Privacy promise</a>
            <a href="#contact">Contact the team</a>
            <a href="#press">Press</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 VibeMatch. A new dating startup for people who feel music deeply.</span>
          <span>Music-first • Mutual-only • Designed to be deleted</span>
        </div>
      </div>
    </footer>
  );
}
