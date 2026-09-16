import { useState } from "react";
import { ArrowRight } from "lucide-react";

const KEY = "vibematch_waitlist";
const API_BASE = (import.meta as unknown as { env?: Record<string, string> }).env
  ?.VITE_API_BASE_URL || "http://localhost:8000";

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [done, setDone] = useState(() => {
    try { return !!localStorage.getItem(KEY); } catch { return false; }
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Enter a valid email to join the waitlist.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const raw = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(v)) localStorage.setItem(KEY, JSON.stringify([...list, v]));
    } catch { /* private mode */ }
    try {
      const res = await fetch(`${API_BASE.replace(/\/+$/, "")}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, city: city.trim() || undefined }),
      });
      if (!res.ok && res.status !== 201) console.warn("waitlist API", res.status);
    } catch { /* offline — local cache enough */ }
    finally { setSaving(false); }
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
        <input
          type="text"
          placeholder="City (optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="City for waitlist"
          style={{ maxWidth: 140 }}
        />
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Joining..." : compact ? "Notify me" : "Join waitlist"} <ArrowRight size={16} />
        </button>
      </form>
      {error ? <div className="micro" style={{ color: "#ff9db8" }}>{error}</div> : <div className="micro">Free to join</div>}
    </div>
  );
}
