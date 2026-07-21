"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function EventClient({ event, items, signups }) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || "__custom__");
  const [customItem, setCustomItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const signupsByItem = {};
  const customSignups = [];
  for (const s of signups) {
    if (s.item_id) {
      (signupsByItem[s.item_id] = signupsByItem[s.item_id] || []).push(s);
    } else {
      customSignups.push(s);
    }
  }

  const itemsWithMeta = items.map((item) => {
    const claims = signupsByItem[item.id] || [];
    const totalQty = claims.reduce((sum, s) => sum + (s.quantity || 1), 0);
    const fulfilled = item.needed_qty != null && totalQty >= item.needed_qty;
    return { item, claims, totalQty, fulfilled };
  });
  const sortedItems = [...itemsWithMeta].sort((a, b) =>
    a.fulfilled === b.fulfilled ? 0 : a.fulfilled ? 1 : -1
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!guestName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (selectedItemId === "__custom__" && !customItem.trim()) {
      setError("Please enter what you're bringing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestEmail,
          itemId: selectedItemId === "__custom__" ? null : selectedItemId,
          customItemName: selectedItemId === "__custom__" ? customItem : null,
          quantity: Number(quantity) || 1,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess("You're signed up! Thanks for bringing something. Check your email for a confirmation if you left one.");
      setGuestName("");
      setGuestEmail("");
      setCustomItem("");
      setQuantity(1);
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelSignup(id) {
    if (!confirm("Remove this sign-up?")) return;
    await fetch(`/api/events/${event.slug}/signups/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="wrap" style={{ "--primary": event.primary_color }}>
      <div className="hero-card">
        <div className="hero-banner">{event.banner_emoji}</div>
        <h1>{event.title}</h1>
        {event.theme && <p className="subtitle">Theme: {event.theme}</p>}
        {event.description && <p className="subtitle">{event.description}</p>}
        <div className="hero-pills">
          <span className="pill">📅 {formatDate(event.event_date)}</span>
          {event.event_time && <span className="pill">⏰ {event.event_time}</span>}
          {event.location && <span className="pill">📍 {event.location}</span>}
          <span className="pill">🙋 {event.host_name}</span>
        </div>
      </div>

      <div className="section-title">What to bring</div>
      {sortedItems.map(({ item, claims, totalQty, fulfilled }) => (
        <div key={item.id} className={`item-card${fulfilled ? " fulfilled" : ""}`}>
          <div>
            <div className="item-card-name">{item.name}</div>
            <div className="item-card-claims">
              {claims.map((s) => (
                <span key={s.id} className="claim-chip">
                  {s.guest_name} ({s.quantity}x)
                </span>
              ))}
              {!claims.length && <span className="helper">No one signed up yet</span>}
            </div>
          </div>
          <span className={`qty-badge${fulfilled ? " fulfilled-badge" : ""}`}>
            {totalQty}
            {item.needed_qty ? `/${item.needed_qty}` : ""}
          </span>
        </div>
      ))}
      {customSignups.map((s) => (
        <div key={s.id} className="item-card">
          <div>
            <div className="item-card-name">{s.custom_item_name || "Other item"}</div>
            <div className="item-card-claims">
              <span className="claim-chip">
                {s.guest_name} ({s.quantity}x)
              </span>
            </div>
          </div>
        </div>
      ))}

      <div className="section-title">Sign up</div>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="row">
          <div>
            <label>Your name *</label>
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </div>
          <div>
            <label>Email (for reminders + confirmation, optional)</label>
            <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
          </div>
        </div>

        <label>What are you bringing? *</label>
        <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
          <option value="__custom__">Something else...</option>
        </select>

        {selectedItemId === "__custom__" && (
          <>
            <label>Describe what you're bringing</label>
            <input type="text" value={customItem} onChange={(e) => setCustomItem(e.target.value)} placeholder="e.g. Homemade lemonade" />
          </>
        )}

        <div className="row">
          <div>
            <label>Quantity</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        </div>

        <label>Note (optional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergy info, serving size, etc." />

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 14 }}>
          {loading ? "Signing up..." : "Sign me up"}
        </button>
      </form>

      {signups.length > 0 && (
        <>
          <div className="section-title">Everyone who's signed up</div>
          <div className="card">
            {signups.map((s) => (
              <div key={s.id} className="item-row">
                <div>
                  <div className="item-name">{s.guest_name}</div>
                  <div className="item-need">{s.quantity}x {items.find((i) => i.id === s.item_id)?.name || s.custom_item_name || "item"}</div>
                </div>
                <button className="btn small secondary" onClick={() => cancelSignup(s.id)}>
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
