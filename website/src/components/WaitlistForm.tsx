import { useState } from "react";
import { ArrowRight } from "lucide-react";

const KEY = "vibematch_waitlist";

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(() => {
    try { return !!localStorage.getItem(KEY); } catch { return false; }
  });
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Enter a valid email to join the waitlist.");
      return;
    }
    setError("");
    try {
      const raw = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(v)) localStorage.setItem(KEY, JSON.stringify([...list, v]));
      else localStorage.setItem(KEY, raw as string);
    } catch { /* private mode — still show success */ }
    setDone(true);
  };

  if (done) {
    return (
      <div className="waitlist-ok" role="status">
        <span><b>You&apos;re on the list.</b> We&apos;ll text you when your city opens. Tell a friend with great taste.</span>
      </div>
    );
  }

  return (
    <div id="waitlist">
      <form className="waitlist" onSubmit={submit}>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email for waitlist"
        />
        <button className="btn btn-primary" type="submit">
          {compact ? "Notify me" : "Join waitlist"} <ArrowRight size={16} />
        </button>
      </form>
      {error ? <div className="micro" style={{ color: "#ff9db8" }}>{error}</div> : <div className="micro">Free to join</div>}
    </div>
  );
}
