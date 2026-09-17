import { useState } from "react";
import { ArrowRight, Minus, Plus, Disc3, MessagesSquare, Music2, ScanSearch } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const STEPS = [
  { icon: <Music2 size={22} />, t: "Drop your sound", d: "Artists on repeat, moods you live in. Seconds to set up — endlessly you. No essay bio required." },
  { icon: <Disc3 size={22} />, t: "We find your frequency", d: "Your taste becomes a living profile that evolves with you — not a quiz score, your actual wavelength." },
  { icon: <ScanSearch size={22} />, t: "Meet high-fit people", d: "A curated set with a vibe score and a plain-language reason on every card. No mystery matches." },
  { icon: <MessagesSquare size={22} />, t: "Mutual → chat → date", d: "Like who moves you. When it's mutual, chat opens warm with your shared sound — then get offline fast." },
];

const FAQS = [
  { q: "How is VibeMatch different from Tinder or Hinge?", a: "They start with photos and keep you swiping. We start with taste — artists, energy, intent — and optimize for mutual chemistry and real dates. Every match explains itself, and chat only exists where both people chose each other." },
  { q: "What do I need to get started?", a: "Just your sound. Pick artists you love, add a little about you and what you're looking for. Complete profiles get discovered first." },
  { q: "How do matches work?", a: "We look at taste, lifestyle fit, energy and intent together, score fit both ways, and show you a curated set with a vibe score and a human-readable reason." },
  { q: "Why can't I just message anyone?", a: "Because wanted conversations turn into dates. Mutual-only chat means every thread starts with two yeses." },
  { q: "Is my data safe?", a: "Yes. Taste powers matching and nothing else. No ads, no selling data. Block, report and full delete from day one." },
  { q: "When does my city launch?", a: "City by city, loudest first. Join the waitlist and vote — members get first access when their city opens." },
];

const IMG_CHAT = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop";
const IMG_CONCERT = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop";

export function HowItWorks() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <div className="wrap" style={{ padding: "72px 0 8px" }}>
        <Reveal>
          <span className="kicker"><i />How it works</span>
          <h1 className="h2" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>
            From playlist to first date in <span className="pop">four moves.</span>
          </h1>
          <p className="sub">Bring your sound. We handle the chemistry — and the opener.</p>
        </Reveal>
        <div className="grid-3" style={{ marginTop: 30 }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 80}>
              <div className="card">
                <div className={`icon ${i === 0 ? "pop" : ""}`}>{s.icon}</div>
                <h3>{i + 1}. {s.t}</h3>
                <p>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <section className="section smoke">
        <div className="wrap grid-2">
          <Reveal>
            <div className="chat">
              <div className="chat-head">
                <img src={IMG_CHAT} alt="Sofia" loading="lazy" />
                <div><b>Sofia, 23 • 89%</b><br /><span style={{ color: "var(--muted)", fontSize: 13 }}>You both cry at FKA twigs bridges</span></div>
              </div>
              <span className="chat-hint">♥ Mutual vibe — chat unlocked</span>
              <div className="bubble them">your top song is my top song. are we the same person</div>
              <div className="bubble me pop">worse. we’re about to fight over aux on our first drive</div>
              <div className="bubble them">pick me up friday. I’ll bring the playlist receipts</div>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <span className="kicker"><i />Under the hood</span>
            <h2 className="h2">Real engine,<br />real <span className="pop">butterflies.</span></h2>
            <p className="sub">Behind the cute cards: two-sided scoring for mutual fit, adaptive learning from what actually turns into dates, and city-aware launch so day one is full of people worth meeting.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <span className="tag pop">Mutual-only</span>
              <span className="tag">Explained matches</span>
              <span className="tag">Learns your type</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap" style={{ maxWidth: 800 }}>
          <Reveal>
            <span className="kicker"><i />Curious minds</span>
            <h2 className="h2">Asked, answered.</h2>
          </Reveal>
          <div style={{ marginTop: 22 }}>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 50, 200)}>
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

      <section className="section" style={{ paddingTop: 0, paddingBottom: 88 }}>
        <div className="wrap">
          <Reveal>
            <div className="cta">
              <div className="cta-copy">
                <span className="kicker" style={{ color: "#fff" }}><i />Your city could be first</span>
                <h2>Stop scrolling.<br />Start <span className="pop">resonating.</span></h2>
                <p>Join the waitlist — founding members get first access when their city opens.</p>
                <WaitlistForm />
                <div style={{ marginTop: 16, color: "var(--night-faint)", fontSize: 14 }}>Want the philosophy? <a href="/about" style={{ color: "#fff", fontWeight: 700 }}>Read our story <ArrowRight size={13} style={{ verticalAlign: -2 }} /></a></div>
              </div>
              <div className="cta-photo">
                <img src={IMG_CONCERT} alt="Concert date night" loading="lazy" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
