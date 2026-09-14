import { Heart, Music2, Users, ShieldCheck, ArrowRight, AudioWaveform, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

export function About() {
  return (
    <>
      <div className="wrap" style={{ padding: "64px 0 8px" }}>
        <Reveal>
          <span className="eyebrow"><Heart size={14} /> Our mission</span>
          <h1 className="h2" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>Dating should feel like<br />a great <span style={{ background: "linear-gradient(92deg,#ff8fb8,#ff7b4f)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>collab</span>, not a catalog.</h1>
          <p className="sub">Most apps rank you by photos and one-line filters. We think music taste, energy, behavior and intent together predict chemistry far better. VibeMatch is a music-first matchmaking app built to model compatibility the way people actually feel it — then get you off the app.</p>
        </Reveal>
        <div className="grid-2" style={{ marginTop: 32 }}>
          <Reveal>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000&auto=format&fit=crop" alt="Concert crowd with hands up" />
              <div className="overlay"><span className="chip mint">Designed to be deleted</span></div>
            </div>
          </Reveal>
          <div>
            <Reveal delay={100}>
              <div className="card" style={{ marginBottom: 14 }}><div className="icon"><Music2 size={20} color="#FF8FB8" /></div><h3>Why music?</h3><p>People with overlapping taste share mood, energy, values and rituals — concerts, late drives, Sunday mornings. It&apos;s the highest-signal cold-start data we have.</p></div>
            </Reveal>
            <Reveal delay={160}>
              <div className="card" style={{ marginBottom: 14 }}><div className="icon"><Users size={20} color="#FF8FB8" /></div><h3>Why multi-dimensional?</h3><p>Similar playlists aren&apos;t enough. Personality, behavior and explicit goals matter — so we keep identity, preference and behavior as separate vectors, not one mushy score.</p></div>
            </Reveal>
            <Reveal delay={220}>
              <div className="card"><div className="icon"><ShieldCheck size={20} color="#FF8FB8" /></div><h3>Why stable matching?</h3><p>We rank both directions and apply game-theoretic stability, so matches are mutual by construction. Chat only opens on mutual like. No spam, no pay-to-spray.</p></div>
            </Reveal>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="kicker">What we believe</div>
            <h2 className="h2">Three principles, shipped daily.</h2>
          </Reveal>
          <div className="grid-3" style={{ marginTop: 24 }}>
            {[
              { icon: <AudioWaveform size={20} color="#FF8FB8" />, t: "Taste over thumbnails", d: "Your top artists and tracks say more than six selfies. We lead with them everywhere — cards, scores, explanations." },
              { icon: <Target size={20} color="#FF8FB8" />, t: "Explainable by default", d: "Every match tells you why: shared artists, shared tracks, score tier. If we can't explain it, we don't ship it." },
              { icon: <Sparkles size={20} color="#FF8FB8" />, t: "Effective, not addictive", d: "No infinite doom-swiping. Quality-gated pools, 20–50 ranked candidates, and learning that improves with every mutual conversation." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 90}><div className="card"><div className="icon">{c.icon}</div><h3>{c.t}</h3><p>{c.d}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap grid-2">
          <Reveal>
            <div className="kicker">Where we are</div>
            <h2 className="h2">An MVP today, a matching engine tomorrow.</h2>
            <p className="sub">Right now: auth, 17-step profile onboarding, artist/track selection, 384-d vectors, swipe + mutual-only chat. Next: richer ranking, candidate generation, behavioral learning, then full multi-vector weighting.</p>
            <div className="timeline">
              {[
                ["Now", "Phase 1 — Music cold start, vectors, swipe, chat. You're here."],
                ["Next", "Phase 2 — Candidate pools, filters, completeness, quality gates."],
                ["Soon", "Phase 3 — Behavioral vectors + ensemble learning after 20+ swipes."],
                ["Vision", "Phase 4 — Full 4-layer scoring, clustering at 10M+ scale."],
              ].map(([t, d]) => (
                <div className="t-step" key={t}><span className="t-time">{t}</span><span style={{ color: "var(--muted)" }}>{d}</span></div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop" alt="Person with headphones" />
              <div className="overlay"><span className="chip">Built in the open • Pre-launch</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="banner">
              <span className="eyebrow">Join us early</span>
              <h2>Help shape what<br />dating sounds like.</h2>
              <p className="sub" style={{ margin: "0 auto 8px", textAlign: "center" }}>Early members define the culture. Bring your best playlist.</p>
              <div style={{ display: "flex", justifyContent: "center" }}><WaitlistForm /></div>
              <div style={{ marginTop: 18 }}><Link className="btn btn-ghost" to="/how-it-works">How matching works <ArrowRight size={16} /></Link></div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
