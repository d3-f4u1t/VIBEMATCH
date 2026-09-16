import { Heart, Music2, Users, ShieldCheck, ArrowRight, AudioWaveform, Sparkles, Target, MapPin, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

export function About() {
  return (
    <>
      <div className="wrap" style={{ padding: "64px 0 8px" }}>
        <Reveal>
          <span className="eyebrow"><Heart size={14} /> Our mission — the startup behind VibeMatch</span>
          <h1 className="h2" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>Dating should feel like<br />a great <span style={{ background: "linear-gradient(92deg,#ff8fb8,#ff7b4f)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>collab</span>, not a catalog.</h1>
          <p className="sub">We&apos;re a new dating startup with a simple obsession: help people who <b>feel music deeply</b> find people who feel it the same way. Not more swiping. Not louder profiles. Better matches — built on taste, energy and intent — then off the app and into real life.</p>
        </Reveal>
        <div className="grid-2" style={{ marginTop: 32 }}>
          <Reveal>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000&auto=format&fit=crop" alt="Concert crowd with hands up" loading="lazy" decoding="async" />
              <div className="overlay"><span className="chip mint">Designed to be deleted</span></div>
            </div>
          </Reveal>
          <div>
            <Reveal delay={100}>
              <div className="card" style={{ marginBottom: 14 }}><div className="icon"><Music2 size={20} color="#FF8FB8" /></div><h3>Why music? Because it never lies.</h3><p>People who overlap in taste overlap in mood, energy, rituals and values — late drives, concert highs, soft Sunday mornings. It&apos;s the most honest signal about who you&apos;ll actually vibe with.</p></div>
            </Reveal>
            <Reveal delay={160}>
              <div className="card" style={{ marginBottom: 14 }}><div className="icon"><Users size={20} color="#FF8FB8" /></div><h3>Why we&apos;re different? We go deeper.</h3><p>Photos start conversations. They don&apos;t predict them. We model taste, identity, energy and intent together — so you meet people who fit your life, not just your feed.</p></div>
            </Reveal>
            <Reveal delay={220}>
              <div className="card"><div className="icon"><ShieldCheck size={20} color="#FF8FB8" /></div><h3>Why you&apos;ll trust it? Mutual by construction.</h3><p>Both sides rank each other. Chat only opens on mutual choice. No cold spam, no pay-to-spray, no one-sided situationships baked into the design.</p></div>
            </Reveal>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="kicker">What we believe</div>
            <h2 className="h2">Three promises. Kept from day one.</h2>
          </Reveal>
          <div className="grid-3" style={{ marginTop: 24 }}>
            {[
              { icon: <AudioWaveform size={20} color="#FF8FB8" />, t: "Taste over thumbnails", d: "Your sound leads everywhere — cards, scores, explanations. The first thing you see is what you’ll actually love about them." },
              { icon: <Target size={20} color="#FF8FB8" />, t: "Never a mystery match", d: "Every connection tells you why — shared artists, shared energy, shared intent. Chemistry you can actually understand." },
              { icon: <Sparkles size={20} color="#FF8FB8" />, t: "Made to get you offline", d: "No infinite deck engineered for addiction. A curated set of high-fit people, built to turn into real dates." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 90}><div className="card"><div className="icon">{c.icon}</div><h3>{c.t}</h3><p>{c.d}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap grid-2">
          <Reveal>
            <div className="kicker">Why VibeMatch wins</div>
            <h2 className="h2">The dating app for people who feel more.</h2>
            <p className="sub">Other apps optimize for time-on-screen. We optimize for <b>that feeling when someone just gets your frequency</b> — and for the date that follows it.</p>
            <div className="timeline">
              {[
                ["Taste", "Your sound becomes your profile. Discovery starts from artists and energy, not filters."],
                ["Fair", "Ranking respects both sides. The engine looks for mutual fit, not just who swiped first."],
                ["Alive", "Recommendations adapt as you vibe — learning your patterns, sharpening with every connection."],
                ["Yours", "City-by-city launch so every launch feels full. Your city, your crowd, your wavelength."],
              ].map(([t, d]) => (
                <div className="t-step" key={t}><span className="t-time">{t}</span><span style={{ color: "var(--muted)" }}>{d}</span></div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop" alt="Person with headphones" loading="lazy" decoding="async" />
              <div className="overlay"><span className="chip">Founding era • Private preview soon</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="grid-2">
            <Reveal>
              <div className="card"><div className="icon"><Lock size={20} color="#FF8FB8" /></div><h3>Respect is the feature</h3><p>Mutual-only chat, easy block &amp; report, full delete anytime. Your taste powers matching — nothing else. No ads. No selling your data. Ever.</p></div>
            </Reveal>
            <Reveal delay={100}>
              <div className="card"><div className="icon"><MapPin size={20} color="#FF8FB8" /></div><h3>Launching with intention</h3><p>We open city by city so day one is alive with people worth meeting. Join the waitlist — your vote decides where we tune in next.</p></div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="banner">
              <span className="eyebrow">Founding members wanted</span>
              <h2>Help decide what<br />dating sounds like next.</h2>
              <p className="sub" style={{ margin: "0 auto 8px", textAlign: "center" }}>Early members don&apos;t just join the culture — they create it. Bring your best playlist.</p>
              <div style={{ display: "flex", justifyContent: "center" }}><WaitlistForm /></div>
              <div style={{ marginTop: 18 }}><Link className="btn btn-ghost" to="/how-it-works">See the sneak peek <ArrowRight size={16} /></Link></div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
