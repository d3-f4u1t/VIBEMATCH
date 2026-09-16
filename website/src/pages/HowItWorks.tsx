import { useState } from "react";
import { Disc3, ScanSearch, MessagesSquare, ArrowRight, Plus, Minus, Music2, Sparkles, ShieldCheck } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const STEPS = [
  { icon: <Music2 size={20} color="#FF8FB8" />, t: "1. Drop your sound", d: "Tell us the artists and tracks you have on repeat — plus the moods, eras and energy you live in. Seconds to set up, endlessly you." },
  { icon: <Disc3 size={20} color="#FF8FB8" />, t: "2. We map your wavelength", d: "Your taste is decoded into a living profile — not a quiz score, but a map of your sound, energy and vibe that evolves with you." },
  { icon: <ScanSearch size={20} color="#FF8FB8" />, t: "3. Meet your frequency", d: "The engine surfaces a curated set of high-fit people, each with a vibe score and a plain-language reason — no guessing why you matched." },
  { icon: <MessagesSquare size={20} color="#FF8FB8" />, t: "4. Mutual vibe → chat", d: "Like the ones who move you. When the feeling is mutual, chat opens with your shared sound front and center. Warm start, every time." },
];

const FAQS = [
  { q: "How is VibeMatch different from Tinder or Hinge?", a: "Those apps start with photos and keep you swiping. VibeMatch starts with taste — artists, energy, intent — and optimizes for mutual chemistry, not screen time. Every match explains itself, and chat only exists where both people chose each other." },
  { q: "What do I need to get started?", a: "Just your sound. Pick the artists and tracks you love, add a little about you and what you're looking for. Complete profiles get discovered first — quality over quantity keeps day one electric." },
  { q: "How do matches work?", a: "Our engine looks at taste, identity, energy and intent together, scores fit in both directions, and shows you a curated set with a vibe score and a human-readable reason. The more you vibe, the sharper it gets." },
  { q: "Why can't I just message anyone?", a: "Because wanted conversations are better conversations. Mutual-only chat means every thread starts with two yeses — the single biggest predictor of actually meeting up." },
  { q: "Is my taste data safe?", a: "Yes. Your taste powers matching and nothing else. No ads, no selling data, ever. Block, report and full delete are built in from day one." },
  { q: "When does my city launch?", a: "We're opening city by city so every launch feels alive. Join the waitlist and vote for your city — the loudest cities open first, and waitlist members get first access." },
];

export function HowItWorks() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <div className="wrap" style={{ padding: "64px 0 8px" }}>
        <Reveal>
          <span className="eyebrow"><Sparkles size={14} /> Sneak peek — how it feels</span>
          <h1 className="h2" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>From playlist<br />to first date in <span style={{ background: "linear-gradient(92deg,#ff8fb8,#ff7b4f)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>four moves.</span></h1>
          <p className="sub">No 200-question quiz. No vibe-check guessing. Just bring your sound — we handle the chemistry.</p>
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
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="chip mint"><ShieldCheck size={13} /> Mutual by design</span>
                  <span className="chip">Curated, not infinite</span>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <div className="kicker">Under the hood</div>
            <h2 className="h2">A real engine, not vibes-only™.</h2>
            <p className="sub">Behind the beautiful cards sits a multi-dimensional compatibility engine — adaptive weighting across taste, identity, energy and intent, stable mutual ranking inspired by Nobel-winning economics, and city-aware discovery that keeps every launch feeling full. It learns what predicts real dates and gives that more say over time.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <span className="chip">Adaptive matching</span>
              <span className="chip">Stable mutual ranking</span>
              <span className="chip mint">Explainable every time</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 780 }}>
          <Reveal>
            <div className="kicker">Curious minds</div>
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
              <span className="eyebrow">Your city could be first</span>
              <h2>Stop scrolling.<br />Start resonating.</h2>
              <p className="sub" style={{ margin: "0 auto 8px", textAlign: "center" }}>Join the waitlist today — founding members get first access when their city tunes in.</p>
              <div style={{ display: "flex", justifyContent: "center" }}><WaitlistForm /></div>
              <div style={{ marginTop: 16, color: "var(--faint)", fontSize: 14 }}>Want the philosophy? <a href="/about" style={{ color: "#ffb3cd" }}>Read our story <ArrowRight size={13} style={{ verticalAlign: -2 }} /></a></div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
