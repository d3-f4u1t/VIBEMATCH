import { AudioWaveform, Camera, AtSign, ShieldCheck, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link to="/" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none", fontWeight: 700, fontSize: 19 }}>
              <span className="brand-mark"><AudioWaveform size={19} color="#fff" /></span>
              VibeMatch
            </Link>
            <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 34 * 10 }}>
              The music-first dating app. Match on taste, energy and vibe — not just photos. Designed to get you off the app and onto your last first date.
            </p>
            <div className="socials" style={{ marginTop: 14 }}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={17} /></a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><AtSign size={17} /></a>
              <a href="#safety" aria-label="Safety"><ShieldCheck size={17} /></a>
              <a href="#love" aria-label="Love"><Heart size={17} /></a>
            </div>
          </div>
          <div>
            <h4>Index</h4>
            <Link to="/about">Our mission</Link>
            <Link to="/how-it-works">How we match</Link>
            <a href="/#labs">Vibe Lab</a>
            <a href="#careers">Careers</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#safety">Safe dating tips</a>
            <a href="#faq">FAQ</a>
            <a href="#trust">Trust &amp; safety</a>
            <a href="#press">Press kit</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#cookies">Cookie policy</a>
            <a href="#security">Security</a>
            <a href="#accessibility">Accessibility</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 VibeMatch. Made for people who feel music deeply.</span>
          <span>Music-first • Vector-matched • Designed to be deleted</span>
        </div>
      </div>
    </footer>
  );
}
