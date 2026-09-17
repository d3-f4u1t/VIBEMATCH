import { Link } from "react-router-dom";
import { ArrowRight, Heart, Music2, ShieldCheck } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

const IMG_COUPLE = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop";
const IMG_MAIN = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop";
const IMG_MAN = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop";

export function About() {
  return (
    <>
      <div className="wrap" style={{ padding: "72px 0 8px" }}>
        <Reveal>
          <span className="kicker"><i />Our story</span>
          <h1 className="h2" style={{ fontSize: "clamp(38px,5.6vw,64px)" }}>
            Dating should feel like a great <span className="pop">collab</span>, not a catalog.
          </h1>
          <p className="sub">
            We&apos;re building the dating app for people who <b>feel music deeply</b>.
            Not more swiping. Better first dates — matched on taste, mutual by design,
            explained every time. Then off the app and across the table.
          </p>
          <div className="trust">
            <div className="avatars">
              <img src={IMG_MAIN} alt="Member" loading="lazy" />
              <img src={IMG_MAN} alt="Member" loading="lazy" />
            </div>
            <small><b>Founding era</b> — private preview opening city by city</small>
          </div>
        </Reveal>
      </div>

      <section className="section smoke">
        <div className="wrap grid-2">
          <Reveal>
            <div className="photo">
              <img src={IMG_COUPLE} alt="Happy couple on a date" loading="lazy" decoding="async" />
              <div className="badge">
                <span className="heart"><Heart size={19} /></span>
                <span style={{ fontSize: 14 }}><b>Matched on closing tracks.</b><br /><span style={{ color: "var(--muted)" }}>Still together. Still sharing aux.</span></span>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <span className="kicker"><i />Why music</span>
              <h2 className="h2">Because it never lies.</h2>
              <p className="sub">Shared taste predicts shared rhythm — late drives, concert highs, soft Sundays, how you fight and make up. Photos can&apos;t tell you that. Playlists can.</p>
            </Reveal>
            {[
              { icon: <Music2 size={20} />, t: "Taste over thumbnails", d: "Your sound leads — cards, scores, openers. The first thing they love about you is what you'll actually love doing together." },
              { icon: <Heart size={20} />, t: "Mutual, never one-sided", d: "Both people choose. Chat only exists where the feeling is already mutual — no cold situationships baked in." },
              { icon: <ShieldCheck size={20} />, t: "Respect is the feature", d: "No ads, no selling data, easy block and full delete. Your taste powers matching and nothing else." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 80}>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="icon">{c.icon}</div>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section night">
        <div className="wrap">
          <Reveal>
            <span className="kicker"><i />How we keep it fair</span>
            <h2 className="h2">Made for the date,<br />not the doom-scroll.</h2>
            <p className="sub">Other apps sell screen time. We optimize for the across-the-table moment.</p>
          </Reveal>
          <div className="steps">
            {[
              { n: "01", t: "Curated", d: "A tight set of high-fit people. Quality over quantity keeps every open electric." },
              { n: "02", t: "Explained", d: "Every match shows its why — shared artists, shared energy, shared intent." },
              { n: "03", t: "Offline-first", d: "Warm openers, fast to plans. Success = you delete us happily." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="step"><span className="step-num">{s.n}</span><h3>{s.t}</h3><p>{s.d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 88 }}>
        <div className="wrap">
          <Reveal>
            <div className="cta">
              <div className="cta-copy">
                <span className="kicker" style={{ color: "#fff" }}><i />Founding members wanted</span>
                <h2>Help decide what dating <span className="pop">sounds like</span> next.</h2>
                <p>Early members don&apos;t just join the culture — they create it. Bring your best playlist.</p>
                <WaitlistForm />
                <div style={{ marginTop: 18 }}><Link className="btn btn-light" to="/how-it-works">See how it works <ArrowRight size={16} /></Link></div>
              </div>
              <div className="cta-photo">
                <img src={IMG_MAIN} alt="Smiling member portrait" loading="lazy" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
