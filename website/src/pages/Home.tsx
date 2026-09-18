import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Music2, ShieldCheck, MessagesSquare, X, BadgeCheck } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const TASTES = ["SZA", "Frank Ocean", "FKA twigs", "The Weeknd", "R&B", "Indie", "Afrobeats", "Soul", "Jazz", "Bedroom Pop"];

const IMG_MAIN = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop";
const IMG_MAN = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop";
const IMG_WOMAN2 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop";
const IMG_COUPLE = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop";
const IMG_DATE = "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1000&auto=format&fit=crop";
const IMG_CONCERT = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop";

export function Home() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("waitlist")) {
      setTimeout(() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, []);

  return (
    <>
      {/* ── HERO (full-bleed blush band) ── */}
      <header className="hero">
      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow-text">Music-first dating • Private preview soon</span>
          <h1>
            Date someone on your <span className="pop">wave&shy;length.</span>
          </h1>
          <p className="lead">
            VibeMatch starts where chemistry actually starts — <b>what you listen to</b>.
            Your 2am playlist knows you better than six photos. We turn shared taste
            into real dates. No endless swiping, no cold DMs.
          </p>
          <WaitlistForm />
        </div>

        <div className="deck" aria-label="Preview of VibeMatch profiles">
          <div className="deck-behind b1"><img src={IMG_MAN} alt="" loading="lazy" /></div>
          <div className="deck-behind b2"><img src={IMG_WOMAN2} alt="" loading="lazy" /></div>
          <div className="float-card float-1">
            <BadgeCheck size={20} color="#FF3D5C" />
            <span><b>It&apos;s a Match</b><small>You + Maya both loop SZA</small></span>
          </div>
          <div className="profile">
            <img src={IMG_MAIN} alt="Maya, 24 — smiling portrait" fetchPriority="high" decoding="async" />
            <div className="profile-body">
              <div className="profile-name">
                <b>Maya, 24</b>
                <span className="vibe">94% vibe</span>
              </div>
              <div className="profile-sub">Late-night R&amp;B • Same concert energy</div>
              <div className="tags">
                <span className="tag">SZA</span>
                <span className="tag">Frank Ocean</span>
                <span className="tag pop">2:14am taste match</span>
              </div>
            </div>
          </div>
          <div className="float-card float-2">
            <MessagesSquare size={20} color="#FF3D5C" />
            <span><b>Warm openers</b><small>“you were at the SZA show too?”</small></span>
          </div>
          <div className="deck-actions">
            <button className="circle-btn" aria-label="Pass"><X size={24} /></button>
            <button className="circle-btn like" aria-label="Like"><Heart size={24} /></button>
          </div>
        </div>
      </div>
      </header>

      {/* ── taste strip ── */}
      <div className="strip" aria-hidden>
        <div className="strip-track">
          {[...TASTES, ...TASTES].map((t, i) => (
            <span key={i} className={i % 5 === 0 ? "hot" : ""}>♥ {t}</span>
          ))}
        </div>
      </div>

      {/* ── why ── */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="kicker">Why VibeMatch</span>
            <h2 className="h2">Photos start chats.<br />Taste starts <span className="pop">relationships.</span></h2>
            <p className="sub">Endless decks and dead “hey”s are a design choice. We chose differently — mutual, explained, and built to get you offline fast.</p>
          </Reveal>
          <div className="grid-3" style={{ marginTop: 30 }}>
            {[
              { icon: <Music2 size={22} />, pop: true, t: "Your taste does the talking", d: "Artists, moods and 2am loops become your intro. No bio pressure, no performing — just what you actually love." },
              { icon: <Heart size={22} />, pop: false, t: "Mutual by design", d: "Chat only unlocks when both people choose each other. Every thread starts with two yeses — and a shared song." },
              { icon: <ShieldCheck size={22} />, pop: false, t: "Respect is the feature", d: "No cold DMs, no pay-to-spam. Easy block, report and full delete. Your taste powers matching — nothing else." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 90}>
                <div className="card">
                  <div className={`icon ${c.pop ? "pop" : ""}`}>{c.icon}</div>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── how it feels — black dating section ── */}
      <section className="section night">
        <div className="wrap">
          <Reveal>
            <span className="kicker">How it feels</span>
            <h2 className="h2">From playlist<br />to first date.</h2>
            <p className="sub">Three moves. No 200-question quiz, no vibe-check guessing.</p>
          </Reveal>
          <div className="steps">
            {[
              { n: "01", t: "Drop your sound", d: "Artists on repeat, moods you live in. Seconds to set up — endlessly you." },
              { n: "02", t: "Meet your frequency", d: "A tight set of high-fit people, each with a vibe score and a real reason — never a mystery match." },
              { n: "03", t: "Mutual → chat → date", d: "Like who moves you. When it's mutual, chat opens warm with your shared sound front and center." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="step">
                  <span className="step-num">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <Link className="btn btn-pop" to="/how-it-works">See how it works <ArrowRight size={16} /></Link>
              <Link className="btn btn-light" to="/about">Why we&apos;re different</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── proof: couple + chat ── */}
      <section className="section smoke">
        <div className="wrap grid-2">
          <Reveal>
            <div className="photo">
              <img src={IMG_COUPLE} alt="Couple on a date at golden hour" loading="lazy" decoding="async" />
              <div className="badge">
                <span className="heart"><Heart size={19} /></span>
                <span style={{ fontSize: 14 }}><b>First date, already in tune.</b><br /><span style={{ color: "var(--muted)" }}>Bonded over the same closing track.</span></span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <span className="kicker">Chats that start warm</span>
            <h2 className="h2">Never open with “hey” again.</h2>
            <p className="sub">Every match shows its reason, so every conversation has somewhere real to start.</p>
            <div className="chat" style={{ marginTop: 22 }}>
              <div className="chat-head">
                <img src={IMG_MAIN} alt="Maya" loading="lazy" />
                <div><b>Maya, 24 • 94%</b><br /><span style={{ color: "var(--muted)", fontSize: 13 }}>You both loop SZA after midnight</span></div>
              </div>
              <span className="chat-hint">Shared sound opener</span>
              <div className="bubble them">ok wait — you were at the SZA show too?? row F??</div>
              <div className="bubble me pop">ROW F. I cried at “Good Days” don’t judge me</div>
              <div className="bubble them">judging you = instantly asking you out instead ♥</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── date-night + quotes ── */}
      <section className="section">
        <div className="wrap grid-2">
          <Reveal>
            <span className="kicker">Made to be deleted</span>
            <h2 className="h2">Built for the date, not the doom-scroll.</h2>
            <p className="sub">A curated set of high-fit people instead of 500 lookalikes. Less screen time, more across-the-table time — concerts, late drives, soft Sundays.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <span className="tag pop">Curated, not infinite</span>
              <span className="tag">Explainable matches</span>
              <span className="tag">City-by-city launch</span>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <div className="photo">
              <img src={IMG_DATE} alt="Woman laughing with sparkler on a night date" loading="lazy" decoding="async" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal>
            <div className="cta">
              <div className="cta-copy">
                <span className="kicker" style={{ color: "#fff" }}>Founding members • Your city could be first</span>
                <h2>Your person is already <span className="pop">listening.</span></h2>
                <p>We open city by city so day one feels electric — not empty. Join the waitlist to vote for your city and get first access.</p>
                <WaitlistForm />
                <div className="micro">Free to join • Early members shape the culture • Bring your best playlist</div>
              </div>
              <div className="cta-photo">
                <img src={IMG_CONCERT} alt="Couple at a concert date night" loading="lazy" decoding="async" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
