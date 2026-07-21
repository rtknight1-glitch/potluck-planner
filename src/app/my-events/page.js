"use client";

import { useState } from "react";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MyEventsPage() {
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [duplicatingSlug, setDuplicatingSlug] = useState(null);
  const [error, setError] = useState("");

  async function search(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    setEvents(null);
    try {
      const res = await fetch(`/api/my-events?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function duplicate(ev) {
    setError("");
    setDuplicatingSlug(ev.slug);
    try {
      const res = await fetch(`/api/events/${ev.slug}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ev.admin_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not duplicate this event");
      window.location.href = `/admin/${data.slug}?token=${data.adminToken}&new=1&duplicated=1`;
    } catch (err) {
      setError(err.message);
      setDuplicatingSlug(null);
    }
  }

  return (
    <div className="wrap">
      <h1>My events</h1>
      <p className="subtitle">Enter the email you used when creating your potluck pages.</p>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={search} className="card">
        <label>Your email</label>
        <div className="row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button className="btn" type="submit" disabled={loading} style={{ flex: "0 0 auto" }}>
            {loading ? "Searching..." : "Find events"}
          </button>
        </div>
      </form>

      {events && events.length === 0 && (
        <p className="helper" style={{ textAlign: "center" }}>
          No events found for that email.
        </p>
      )}

      {events &&
        events.map((ev) => (
          <div key={ev.slug} className="item-card" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="item-card-name">
                {ev.banner_emoji} {ev.title}
              </div>
              <div className="helper" style={{ marginBottom: 10 }}>
                {formatDate(ev.event_date)}
                {ev.event_time ? ` · ${ev.event_time}` : ""}
                {ev.location ? ` · ${ev.location}` : ""}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a className="btn small secondary" href={`/e/${ev.slug}`}>
                  View public page
                </a>
                <a className="btn small secondary" href={`/admin/${ev.slug}?token=${ev.admin_token}`}>
                  Manage
                </a>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => duplicate(ev)}
                  disabled={duplicatingSlug === ev.slug}
                >
                  {duplicatingSlug === ev.slug ? "Duplicating..." : "Duplicate for next time"}
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
