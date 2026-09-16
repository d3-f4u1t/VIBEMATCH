import { motion } from "framer-motion";
import {
  Music2, Fingerprint, Activity, HeartHandshake, ArrowRight, Play,
  Disc3, MessagesSquare, ShieldCheck, MapPin, BadgeCheck, X, Heart, Sparkles, Flame, Eye,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const GENRES = ["SZA", "Frank Ocean", "FKA twigs", "The Weeknd", "Indie", "Hip-Hop", "R&B", "Afrobeats", "Techno", "Jazz", "Bedroom Pop", "Soul"];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const } }),
};

function SwipeDemo() {
  const profiles = useMemo(
    () => [
      { name: "Maya, 24", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop", score: 94, shared: ["SZA", "Frank Ocean"], reason: "Both live in late-night R&B" },
      { name: "Jordan, 26", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop", score: 91, shared: ["The Weeknd", "Indie"], reason: "Same concert energy" },
      { name: "Sofia, 23", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop", score: 89, shared: ["FKA twigs", "Soul"], reason: "Same soft-chaos frequency" },
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  const [notice, setNotice] = useState("");
  const timer = useRef<number | null>(null);
  const p = profiles[idx % profiles.length];

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const swipe = useCallback(
    (kind: "like" | "pass") => {
      setNotice(kind === "like" ? `You felt ${p.name.split(",")[0]} — ${p.score}% vibe fit` : `Not your frequency? The engine recalibrates…`);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setIdx((v) => v + 1), 280);
    },
    [p]
  );

  return (
    <div>
      <motion.div
        key={p.name}
        className="swipe-card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragMomentum={false}
        onDragEnd={(_, info) => { if (info.offset.x > 90) swipe("like"); else if (info.offset.x < -90) swipe("pass"); }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileDrag={{ scale: 1.03, rotate: 2 }}
        style={{ touchAction: "pan-y" }}
      >
        <img src={p.img} alt={p.name} loading="lazy" decoding="async" draggable={false} />
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 20 }}>{p.name}</b>
            <span className="chip mint">{p.score}% vibe</span>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>{p.reason}</div>
          <div className="chip-row">{p.shared.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          <div className="score-bar"><div className="score-fill" style={{ width: `${p.score}%` }} /></div>
        </div>
      </motion.div>
      <div className="swipe-actions">
        <button className="circle-btn" onClick={() => swipe("pass")} aria-label="Pass"><X size={24} /></button>
        <button className="circle-btn like" onClick={() => swipe("like")} aria-label="Like"><Heart size={24} /></button>
      </div>
      <div className="micro" style={{ textAlign: "center", minHeight: 20 }}>{notice || "Drag the card or tap — this is the feeling"}</div>
    </div>
  );
}

export function Home() {
  const marqueeItems = useMemo(() => [...GENRES, ...GENRES], []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("waitlist")) {
      setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <div className="wrap hero">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <span className="eyebrow"><Sparkles size={15} /> Introducing VibeMatch — private preview soon</span>
            <h1>Find someone on your <span className="grad">wavelength.</span></h1>
            <p className="lead">
              A new dating app that starts where chemistry actually starts: <b>what you listen to</b>.
              Your playlist knows your mood, your energy, your 2am self — better than six photos ever could.
              VibeMatch turns taste into meeting. And it&apos;s opening soon.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
            <WaitlistForm />
            <div className="hero-ctas">
              <Link className="btn btn-ghost" to="/how-it-works"><Play size={16} /> Watch how it feels</Link>
              <Link className="btn btn-ghost" to="/about">Why we&apos;re different</Link>
            </div>
            <div className="hero-meta">
              <div className="stat"><b>Music-first</b><span>taste before thumbnails</span></div>
              <div className="stat"><b>Mutual-only</b><span>chat unlocks on vibe match</span></div>
              <div className="stat"><b>Built to delete</b><span>made to get you off the app</span></div>
            </div>
          </motion.div>
        </div>

        <motion.div className="phone-stage" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="float-card float-1"><BadgeCheck size={18} color="#82F7A6" /> <span><b>It&apos;s a Vibe</b><br /><span style={{ color: "var(--muted)", fontSize: 12.5 }}>You + Maya both loop SZA</span></span></div>
          <div className="phone">
            <div className="phone-screen">
              <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop" alt="Concert crowd — find your crowd" fetchPriority="high" decoding="async" />
              <div className="phone-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <b style={{ fontSize: 19 }}>Maya, 24</b>
                  <span className="chip mint">94% vibe</span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 4 }}>Both love late-night R&amp;B • Same frequency</div>
                <div className="chip-row"><span className="chip">SZA</span><span className="chip">Frank Ocean</span><span className="chip mint">Late-night R&amp;B</span></div>
              </div>
            </div>
          </div>
          <div className="float-card float-2"><Disc3 size={18} color="#FF7B4F" /> <span><b>Taste mapped</b><br /><span style={{ color: "var(--muted)", fontSize: 12.5 }}>Your sound, decoded</span></span></div>
        </motion.div>
      </div>

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {marqueeItems.map((g, i) => <span key={i}>✦ {g}</span>)}
        </div>
      </div>

      {/* ── THE PROBLEM WE KILL ── */}
      <section className="section" id="approach">
        <div className="wrap grid-2">
          <Reveal>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop" alt="DJ decks — taste is a signal" loading="lazy" decoding="async" />
              <div className="overlay">
                <span className="eyebrow">Why now</span>
                <h2 className="h2" style={{ fontSize: 34 }}>Swiping on photos is broken. You feel it.</h2>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="kicker">The VibeMatch difference</div>
            <h2 className="h2">Go on your last first date.</h2>
            <p className="sub">
              Endless decks. Dead chats. People who look right and feel wrong.
              VibeMatch was built to end that loop — with a compatibility engine that reads
              <b> taste, energy and intent</b>, ranks both directions fairly, and only opens
              chat when the vibe is genuinely mutual.
            </p>
            <div className="grid-2" style={{ gap: 14, marginTop: 22 }}>
              <div className="card"><div className="icon"><Music2 size={20} color="#FF8FB8" /></div><h3>Your taste does the talking</h3><p>No awkward bio pressure. The artists you loop, the energy you live in — that&apos;s your intro.</p></div>
              <div className="card"><div className="icon"><ShieldCheck size={20} color="#FF8FB8" /></div><h3>Mutual by design</h3><p>No cold DMs. No pay-to-spam. Chat only exists where both people already chose each other.</p></div>
            </div>
            <Link className="btn btn-primary" to="/about" style={{ marginTop: 22 }}>Why we win <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ── 4 DIMENSIONS ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="kicker">The engine</div>
            <h2 className="h2">One person. Four dimensions. Zero guessing.</h2>
            <p className="sub">Anyone can filter by age and distance. VibeMatch models what actually predicts a great date — and tells you <i>why</i> you matched in plain language.</p>
          </Reveal>
          <div className="grid-4" style={{ marginTop: 28 }}>
            {[
              { icon: <Music2 size={20} color="#FF8FB8" />, t: "Taste", d: "Artists, tracks, moods, eras and energy — mapped into a living taste profile that evolves with you." },
              { icon: <Fingerprint size={20} color="#FF8FB8" />, t: "Identity", d: "The real context — lifestyle, values, city rhythm — so matches fit your actual life." },
              { icon: <Activity size={20} color="#FF8FB8" />, t: "Energy", d: "How you show up and connect. The engine learns your patterns and tunes recommendations to them." },
              { icon: <HeartHandshake size={20} color="#FF8FB8" />, t: "Intent", d: "What you want, matched both ways. No mixed signals — alignment is scored in both directions." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 90}>
                <div className="card"><div className="icon">{c.icon}</div><h3>{c.t}</h3><p>{c.d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY WE'RE BETTER STRIP ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="kicker">Old dating vs VibeMatch</div>
            <h2 className="h2">Built for chemistry, not screen time.</h2>
          </Reveal>
          <div className="grid-3" style={{ marginTop: 24 }}>
            {[
              { icon: <Eye size={20} color="#FF8FB8" />, t: "Explainable matches", d: "Every match shows its reason — shared artists, shared energy, shared intent. If we can't explain it, you won't see it." },
              { icon: <Flame size={20} color="#FF8FB8" />, t: "Curated, not infinite", d: "A tight set of high-fit people instead of 500 lookalikes. Less doom-swiping, more actual dates." },
              { icon: <MessagesSquare size={20} color="#FF8FB8" />, t: "Conversations that start warm", d: "Every chat opens with your shared music context. No more “hey” into the void." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 90}>
                <div className="card"><div className="icon">{c.icon}</div><h3>{c.t}</h3><p>{c.d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap demo">
          <Reveal><SwipeDemo /></Reveal>
          <Reveal delay={120}>
            <div className="kicker">Sneak peek</div>
            <h2 className="h2">Swipe on vibe, not just selfies.</h2>
            <p className="sub">Imagine opening the app and instantly seeing <b>why</b> someone fits — “You both live in late-night R&amp;B” hits different from “You both like travel.” Try it. This is the feeling we&apos;re shipping.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <span className="chip">Vibe score on every card</span>
              <span className="chip">Shared sound, visible</span>
              <span className="chip mint">Mutual-only chat</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── VIBE LAB ── */}
      <section className="section" id="labs" style={{ paddingTop: 0 }}>
        <div className="wrap grid-2">
          <Reveal>
            <div className="kicker">Inside Vibe Lab</div>
            <h2 className="h2">We&apos;re obsessed with what makes two people click.</h2>
            <p className="sub">Vibe Lab is our matching research unit — studying taste overlap, attraction patterns and conversation outcomes so recommendations get sharper the more the community vibes. Adaptive weighting, stable mutual ranking, city-aware discovery. This isn&apos;t a filter. It&apos;s an engine.</p>
            <div className="hero-meta">
              <div className="stat"><b>Adaptive</b><span>learns what predicts dates</span></div>
              <div className="stat"><b>Stable</b><span>fair ranking, both directions</span></div>
              <div className="stat"><b>Scalable</b><span>engineered for millions</span></div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1000&auto=format&fit=crop" alt="Listening session" loading="lazy" decoding="async" />
              <div className="overlay">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span className="chip"><MessagesSquare size={13} /> Learns your energy</span>
                  <span className="chip"><MapPin size={13} /> City-by-city launch</span>
                  <span className="chip mint"><ShieldCheck size={13} /> Respect-first design</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="banner">
              <span className="eyebrow">Founding members • Your city could be first</span>
              <h2>Your people are already<br />listening. Come find them.</h2>
              <p className="sub" style={{ margin: "0 auto 8px", textAlign: "center" }}>We&apos;re opening city by city so day one feels electric — not empty. Join the waitlist to vote for your city and get first access.</p>
              <div style={{ display: "flex", justifyContent: "center" }}><WaitlistForm /></div>
              <div className="micro" style={{ textAlign: "center", marginTop: 12 }}>Free to join • Early members shape the culture • Bring your best playlist</div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
