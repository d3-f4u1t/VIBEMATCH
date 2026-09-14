import { useState } from "react";
import { Disc3, ScanSearch, MessagesSquare, ArrowRight, Check, Plus, Minus, Music2 } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const STEPS = [
  { icon: <Music2 size={20} color="#FF8FB8" />, t: "1. Pick your sound", d: "Choose at least 3 artists (max 5) and 4 tracks (max 7). Search is instant, boosted toward artists you already picked — just like the app." },
  { icon: <Disc3 size={20} color="#FF8FB8" />, t: "2. We build your vector", d: "Artists + songs + genre tags are encoded into a normalized 384-d embedding (all-MiniLM-L6-v2). Same taste, same neighborhood in vector space." },
  { icon: <ScanSearch size={20} color="#FF8FB8" />, t: "3. Get ranked candidates", d: "We filter for complete profiles, skip people you've swiped, then rank by cosine similarity + shared artists/tracks with a human-readable reason." },
  { icon: <MessagesSquare size={20} color="#FF8FB8" />, t: "4. Mutual like → chat", d: "Like or pass. On mutual LIKE, chat unlocks and every conversation shows your shared music context. After 20+ swipes, behavior learning kicks in." },
];

const FAQS = [
  { q: "What do I need to get matches?", a: "A complete music profile: at least 3 artists and 4 tracks, plus the core profile fields (name, age 18+, city, bio, etc.). Incomplete profiles are hidden from matching until they finish — quality over quantity." },
  { q: "How is the score calculated?", a: "Today: cosine similarity of your 384-d music vectors plus shared-artist/track overlap, tiered into Very strong (≥0.80), Good (≥0.60) and Some overlap. Over time we'll blend in behavior and preference weights." },
  { q: "Why can't I message anyone directly?", a: "Chat requires a mutual LIKE in both directions. It keeps conversations wanted and high-effort — the single biggest predictor of actually meeting up." },
  { q: "What happens to my data?", a: "Your vectors power matching and nothing else. No ads, no selling taste data. Delete anytime and vectors go with the account." },
  { q: "When does my city launch?", a: "We open city by city once the waitlist hits critical mass, so day one has enough complete profiles to match well. Join the waitlist to vote for your city." },
];

export function HowItWorks() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <div className="wrap" style={{ padding: "64px 0 8px" }}>
        <Reveal>
          <span className="eyebrow">How it works</span>
          <h1 className="h2" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>From playlist<br />to first date in <span style={{ background: "linear-gradient(92deg,#ff8fb8,#ff7b4f)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>four steps.</span></h1>
          <p className="sub">No 200-question quiz. No vibe-check guessing. Just taste → vector → stable matches → mutual chat.</p>
        </Reveal>
        <div className="grid-2" style={{ marginTop: 30 }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 80}>
              <div className="card"><div className="pill-num">{i + 1}</div><div className="icon">{s.icon}</div><h3>{s.t.slice(3)}</h3><p>{s.d}</p></div>
            </Reveal>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="wrap grid-2">
          <Reveal>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1000&auto=format&fit=crop" alt="Concert lights" />
              <div className="overlay">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="chip mint"><Check size={13} /> 3 artists min</span>
                  <span className="chip mint"><Check size={13} /> 4 tracks min</span>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <div className="kicker">Under the hood</div>
            <h2 className="h2">A real pipeline, not vibes-only™.</h2>
            <p className="sub">Sets → candidate pool → coarse filter → scoring → stable ranking → your top 20–50. Quality gates auto-pause thin pools. Weights stay dynamic so what predicts dates gets more say over time.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <span className="chip">Delaunay + DBSCAN filtering</span>
              <span className="chip">Gale-Shapley stability</span>
              <span className="chip mint">Ensemble after 20 swipes</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <Reveal>
            <div className="kicker">FAQ</div>
            <h2 className="h2">Asked, answered.</h2>
          </Reveal>
          <div style={{ marginTop: 22 }}>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <div className="faq">
                  <button onClick={() => setOpen(open === i ? null : i)}>
                    {f.q} {open === i ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                  {open === i && <div className="a">{f.a}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="banner">
              <span className="eyebrow">Ready when your city is</span>
              <h2>Stop scrolling.<br />Start resonating.</h2>
              <div style={{ display: "flex", justifyContent: "center" }}><WaitlistForm /></div>
              <div style={{ marginTop: 16, color: "var(--faint)", fontSize: 14 }}>Want the philosophy? <a href="/about" style={{ color: "#ffb3cd" }}>Read our mission <ArrowRight size={13} style={{ verticalAlign: -2 }} /></a></div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
