import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link to="/" className="foot-brand" aria-label="vibematch home">
              <span className="foot-dot" aria-hidden />vibematch
            </Link>
            <p className="foot-tag">
              Music-first dating. Match on taste, meet on vibe — then get off the app and into real life.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/about">Our story</Link>
            <Link to="/how-it-works">How it works</Link>
            <a href="/?waitlist=1">Get early access</a>
          </div>
          <div>
            <h4>Why VibeMatch</h4>
            <Link to="/about">Music-first matching</Link>
            <Link to="/how-it-works">Mutual-only chat</Link>
            <Link to="/how-it-works">FAQ</Link>
          </div>
          <div>
            <h4>Trust</h4>
            <a href="#safety">Safety &amp; respect</a>
            <a href="#privacy">Privacy promise</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 vibematch. Made for people who feel music deeply.</span>
          <span>Black &amp; white, with chemistry in color.</span>
        </div>
      </div>
    </footer>
  );
}
