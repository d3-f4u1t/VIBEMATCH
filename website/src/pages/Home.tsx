import { motion } from "framer-motion";
import {
  Music2, Fingerprint, Activity, HeartHandshake, ArrowRight, Play,
  Disc3, Sparkles, MessagesSquare, ShieldCheck, MapPin, BadgeCheck, X, Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const GENRES = ["SZA", "Frank Ocean", "FKA twigs", "The Weeknd", "Indie", "Hip-Hop", "R&B", "Afrobeats", "Techno", "Jazz", "Bedroom Pop", "Soul"];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const } }),
};

function SwipeDemo() {
  const profiles = [
    { name: "Maya, 24", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop", score: 91, shared: ["SZA", "Frank Ocean"], reason: "Both love late-night R&B" },
    { name: "Jordan, 26", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop", score: 88, shared: ["The Weeknd", "Indie"], reason: "Same concert energy" },
    { name: "Sofia, 23", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop", score: 84, shared: ["FKA twigs", "Soul"], reason: "Overlapping vectors" },
  ];
  const [idx, setIdx] = useState(0);
  const [notice, setNotice] = useState("");
  const p = profiles[idx % profiles.length];

  const swipe = (kind: "like" | "pass") => {
    setNotice(kind === "like" ? `You liked ${p.name.split(",")[0]} — ${p.score}% vibe fit` : `Passed on ${p.name.split(",")[0]} — learning your taste…`);
    setTimeout(() => setIdx((v) => v + 1), 450);
  };

  return (
    <div>
      <motion.div
        key={p.name}
        className="swipe-card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => { if (info.offset.x > 90) swipe("like"); else if (info.offset.x < -90) swipe("pass"); }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileDrag={{ scale: 1.03, rotate: 2 }}
      >
        <img src={p.img} alt={p.name} />
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 20 }}>{p.name}</b>
            <span className="chip mint">{p.score}% match</span>
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
      <div className="micro" style={{ textAlign: "center", minHeight: 20 }}>{notice || "Drag the card or tap — just like the app"}</div>
    </div>
  );
}

export function Home() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("waitlist")) {
      setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  return (
    <>
      {/* ── HERO (Hinge: full-bleed photo + headline) ── */}
      <div className="wrap hero">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <span className="eyebrow"><Sparkles size={14} /> Music-first dating • Coming soon</span>
            <h1>Find someone on your <span className="grad">wavelength.</span></h1>
            <p className="lead">
              VibeMatch matches you on music taste, energy and vibe — not just photos.
              Pick 3 artists and 4 tracks, get your 384-dimensional music vector, and meet people
              whose taste actually overlaps with yours.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
            <WaitlistForm />
            <div className="hero-ctas">
              <Link className="btn btn-ghost" to="/how-it-works"><Play size={16} /> See how matching works</Link>
            </div>
            <div className="hero-meta">
              <div className="stat"><b>384-d</b><span>music vectors</span></div>
              <div className="stat"><b>4 layers</b><span>music • identity • behavior • goals</span></div>
              <div className="stat"><b>3 + 4</b><span>artists + tracks to start</span></div>
            </div>
          </motion.div>
        </div>

        <motion.div className="phone-stage" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="float-card float-1"><BadgeCheck size={18} color="#82F7A6" /> <span><b>It&apos;s a Vibe</b><br /><span style={{ color: "var(--muted)", fontSize: 12.5 }}>You + Maya both love SZA</span></span></div>
          <div className="phone">
            <div className="phone-screen">
              <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop" alt="Concert crowd — find your crowd" />
              <div className="phone-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <b style={{ fontSize: 19 }}>Maya, 24</b><span className="chip mint">91% match</span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 4 }}>Both love late-night R&amp;B • 2 min away in vibe</div>
                <div className="chip-row"><span className="chip">SZA</span><span className="chip">Frank Ocean</span><span className="chip mint">God&apos;s Plan</span></div>
              </div>
            </div>
          </div>
          <div className="float-card float-2"><Disc3 size={18} color="#FF7B4F" /> <span><b>Vector built</b><br /><span style={{ color: "var(--muted)", fontSize: 12.5 }}>Your taste, mapped in 384-d</span></span></div>
        </motion.div>
      </div>

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...GENRES, ...GENRES].map((g, i) => <span key={i}>✦ {g}</span>)}
        </div>
      </div>

      {/* ── OUR APPROACH (Hinge: "Go on your last first date") ── */}
      <section className="section" id="approach">
        <div className="wrap grid-2">
          <Reveal>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop" alt="DJ decks — taste is a signal" />
              <div className="overlay">
                <span className="eyebrow">Our approach</span>
                <h2 className="h2" style={{ fontSize: 34 }}>Taste tells the truth photos can&apos;t.</h2>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="kicker">Why VibeMatch exists</div>
            <h2 className="h2">Go on your last first date.</h2>
            <p className="sub">
              Other apps keep you swiping. VibeMatch is built to get you <b>off</b> the app —
              with a Nobel-inspired stable-matching pipeline and vectors that learn what you
              actually vibe with, not just who you tap.
            </p>
            <div className="grid-2" style={{ gap: 14, marginTop: 22 }}>
              <div className="card"><div className="icon"><Music2 size={20} color="#FF8FB8" /></div><h3>Music-first cold start</h3><p>No awkward bio needed. Your artists do the talking from minute one.</p></div>
              <div className="card"><div className="icon"><ShieldCheck size={20} color="#FF8FB8" /></div><h3>Stable, mutual matches</h3><p>Gale-Shapley ranking means no one-sided situationships by design.</p></div>
            </div>
            <Link className="btn btn-primary" to="/about" style={{ marginTop: 22 }}>Our mission <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ── 4 LAYERS ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="kicker">The system</div>
            <h2 className="h2">Four layers. One compatibility score.</h2>
            <p className="sub">Shallow filters can&apos;t capture chemistry. VibeMatch models you across four independent vectors — then weights what actually predicts a good date.</p>
          </Reveal>
          <div className="grid-4" style={{ marginTop: 28 }}>
            {[
              { icon: <Music2 size={20} color="#FF8FB8" />, t: "Music / taste", d: "Artists, tracks, genres, mood & energy → 384-d embedding. Live in the app today." },
              { icon: <Fingerprint size={20} color="#FF8FB8" />, t: "Identity / context", d: "Age, location, pronouns, lifestyle. Used for fair, explainable filtering." },
              { icon: <Activity size={20} color="#FF8FB8" />, t: "Behavior / personality", d: "Bio, prompts, swipe & chat patterns. Captures how you actually connect." },
              { icon: <HeartHandshake size={20} color="#FF8FB8" />, t: "Preferences / goals", d: "What you want — vibe traits, dealbreakers, intent. Matched both directions." },
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
            <div className="kicker">Try the feeling</div>
            <h2 className="h2">Swipe on vibe, not just selfies.</h2>
            <p className="sub">Every profile shows a compatibility score, shared artists and tracks, and <i>why</i> you matched — “You both love late-night R&amp;B” beats “You both like pizza.” Chat only unlocks on mutual like.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
              <span className="chip">Cosine similarity</span><span className="chip">Shared tracks</span><span className="chip mint">Mutual-only chat</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── VIBE LAB (Hinge Labs) ── */}
      <section className="section" id="labs" style={{ paddingTop: 0 }}>
        <div className="wrap grid-2">
          <Reveal>
            <div className="kicker">Vibe Lab</div>
            <h2 className="h2">We&apos;re music scientists.</h2>
            <p className="sub">Our researchers study taste overlap, swipe behavior and conversation outcomes so matching keeps getting smarter — from simple cosine similarity today to ensemble learning that predicts real chemistry tomorrow.</p>
            <div className="hero-meta">
              <div className="stat"><b>O(log n)</b><span>hierarchical clustering</span></div>
              <div className="stat"><b>20+ swipes</b><span>unlocks behavior learning</span></div>
              <div className="stat"><b>10M+</b><span>users, path to scale</span></div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1000&auto=format&fit=crop" alt="Listening session" />
              <div className="overlay">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span className="chip"><MessagesSquare size={13} /> Behavioral signals</span>
                  <span className="chip"><MapPin size={13} /> City-aware</span>
                  <span className="chip mint"><ShieldCheck size={13} /> Quality-gated</span>
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
              <span className="eyebrow">Early access • Your city is next</span>
              <h2>Your people are already<br />listening. Come find them.</h2>
              <p className="sub" style={{ margin: "0 auto 8px", textAlign: "center" }}>Join the waitlist today — we open city by city so day one actually feels alive.</p>
              <div style={{ display: "flex", justifyContent: "center" }}><WaitlistForm /></div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
