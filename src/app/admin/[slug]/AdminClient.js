"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMOJIS = ["🍲", "🎉", "🍂", "🎄", "🌻", "🏖️", "🍁", "🎃", "🥧", "🍕", "🎂", "⭐"];
const COLORS = ["#e07a3f", "#3f7de0", "#4caf6b", "#c2447b", "#7a5cd6", "#d6a33f"];

export default function AdminClient({ event, items, signups, token, isNew, isDuplicated }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: event.title,
    description: event.description || "",
    event_date: event.event_date,
    event_time: event.event_time || "",
    location: event.location || "",
    theme: event.theme || "",
    banner_emoji: event.banner_emoji || "🍲",
    primary_color: event.primary_color || "#e07a3f",
    reminder_start_days: event.reminder_start_days ?? 7,
    reminder_repeat_days: event.reminder_repeat_days ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [itemQty, setItemQty] = useState(() =>
    Object.fromEntries(items.map((it) => [it.id, it.needed_qty ?? ""]))
  );
  const [error, setError] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${siteUrl}/e/${event.slug}`;
  const adminUrl = `${siteUrl}/admin/${event.slug}?token=${token}`;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...form,
          reminder_start_days: form.reminder_start_days === "" ? null : Number(form.reminder_start_days),
          reminder_repeat_days: form.reminder_repeat_days === "" ? null : Number(form.reminder_repeat_days),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addItem() {
    const name = newItem.trim();
    if (!name) return;
    const res = await fetch(`/api/events/${event.slug}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, neededQty: newItemQty ? Number(newItemQty) : null }),
    });
    if (res.ok) {
      setNewItem("");
      setNewItemQty("");
      router.refresh();
    }
  }

  async function removeItem(itemId) {
    if (!confirm("Remove this item? Any sign-ups for it will also be removed.")) return;
    await fetch(`/api/events/${event.slug}/items/${itemId}?token=${token}`, { method: "DELETE" });
    router.refresh();
  }

  async function saveItemQty(itemId) {
    const value = itemQty[itemId];
    await fetch(`/api/events/${event.slug}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, neededQty: value === "" ? null : Number(value) }),
    });
    router.refresh();
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
  }

  async function duplicateEvent() {
    setDuplicating(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.slug}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not duplicate this event");
      router.push(`/admin/${data.slug}?token=${data.adminToken}&new=1&duplicated=1`);
    } catch (err) {
      setError(err.message);
      setDuplicating(false);
    }
  }

  const signupsByItem = {};
  for (const s of signups) {
    if (s.item_id) (signupsByItem[s.item_id] = signupsByItem[s.item_id] || []).push(s);
  }

  return (
    <div className="wrap" style={{ "--primary": event.primary_color }}>
      <div className="hero-card">
        <div className="hero-banner">{event.banner_emoji}</div>
        <h1>{event.title}</h1>
        <p className="subtitle">Host admin page — keep this link private, it's how you manage your event.</p>
        <div className="hero-pills">
          <span className="pill">📅 {event.event_date}</span>
          {event.event_time && <span className="pill">⏰ {event.event_time}</span>}
          {event.location && <span className="pill">📍 {event.location}</span>}
        </div>
      </div>

      {isNew && !isDuplicated && (
        <div className="success-box">
          Your potluck page is live! Share the public link below with guests. Bookmark this admin
          page too — it's the only way back in.
        </div>
      )}

      {isDuplicated && (
        <div className="success-box">
          This is a fresh copy — same items and settings, no sign-ups carried over. Update the date,
          time, and location below, then share the new link.
        </div>
      )}

      <div className="section-title">Share with guests</div>
      <div className="share-box">
        <span style={{ flex: 1 }}>{publicUrl}</span>
        <button className="btn small secondary" onClick={() => copy(publicUrl)}>
          Copy
        </button>
      </div>

      <div className="section-title">Your private admin link</div>
      <div className="share-box">
        <span style={{ flex: 1 }}>{adminUrl}</span>
        <button className="btn small secondary" onClick={() => copy(adminUrl)}>
          Copy
        </button>
      </div>

      <div className="section-title">Reuse this event</div>
      <div className="card">
        <p className="helper" style={{ marginBottom: 10 }}>
          Create a fresh copy of this event with the same theme, look, and items — no sign-ups carried
          over. Handy for a recurring get-together; just update the date, time, and location on the
          new page.
        </p>
        <button className="btn secondary" onClick={duplicateEvent} disabled={duplicating}>
          {duplicating ? "Duplicating..." : "Duplicate this event"}
        </button>
      </div>

      <div className="section-title">Event details</div>
      {error && <div className="error-box">{error}</div>}
      {saved && <div className="success-box">Saved.</div>}
      <div className="card">
        <label>Event name</label>
        <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} />

        <label>Theme</label>
        <input type="text" value={form.theme} onChange={(e) => set("theme", e.target.value)} />

        <label>Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />

        <div className="row">
          <div>
            <label>Date</label>
            <input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          </div>
          <div>
            <label>Time</label>
            <input
              type="text"
              value={form.event_time}
              onChange={(e) => set("event_time", e.target.value)}
              placeholder="e.g. 5:30 PM"
            />
          </div>
        </div>

        <label>Location</label>
        <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} />
      </div>

      <div className="section-title">Look & feel</div>
      <div className="card">
        <label>Icon</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => set("banner_emoji", e)}
              style={{
                fontSize: 22,
                padding: 6,
                borderRadius: 8,
                border: form.banner_emoji === e ? "2px solid #333" : "1px solid #ece2d4",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {e}
            </button>
          ))}
        </div>
        <label>Or type/paste any emoji</label>
        <input
          type="text"
          value={form.banner_emoji}
          onChange={(e) => set("banner_emoji", e.target.value.slice(0, 32))}
          placeholder="🍕"
          style={{ maxWidth: 90, fontSize: 22, textAlign: "center" }}
        />
        <p className="helper">
          Click the box above and press Cmd+Ctrl+Space (Mac) or Win+. (Windows) to open your device's
          emoji picker, or just paste any emoji.
        </p>

        <label>Accent color</label>
        <div style={{ display: "flex", gap: 8 }}>
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => set("primary_color", c)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: c,
                border: form.primary_color === c ? "3px solid #333" : "1px solid #ddd",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <div className="section-title">Guest reminders</div>
      <div className="card">
        <label>Start sending reminders this many days before the event</label>
        <input
          type="number"
          min="0"
          value={form.reminder_start_days}
          onChange={(e) => set("reminder_start_days", e.target.value)}
        />
        <label>Repeat every N days after that (optional)</label>
        <input
          type="number"
          min="1"
          value={form.reminder_repeat_days}
          onChange={(e) => set("reminder_repeat_days", e.target.value)}
          placeholder="Leave blank to send just once"
        />
        <p className="helper">
          Reminders go out once a day via automated check. Only guests who left an email receive them.
        </p>
      </div>

      <button className="btn" onClick={save} disabled={saving} style={{ width: "100%" }}>
        {saving ? "Saving..." : "Save changes"}
      </button>

      <div className="section-title">Items</div>
      <p className="helper" style={{ marginBottom: 10 }}>
        Set "needed" to have an item grey out once enough people have claimed it. Leave blank for no limit.
      </p>
      {items.map((item) => {
        const totalQty = (signupsByItem[item.id] || []).reduce((sum, s) => sum + (s.quantity || 1), 0);
        const needed = item.needed_qty;
        const fulfilled = needed != null && totalQty >= needed;
        return (
          <div key={item.id} className={`item-card${fulfilled ? " fulfilled" : ""}`}>
            <div>
              <div className="item-card-name">{item.name}</div>
              <div className="item-card-claims">
                {(signupsByItem[item.id] || []).map((s) => (
                  <span key={s.id} className="claim-chip">
                    {s.guest_name} ({s.quantity}x)
                  </span>
                ))}
                {!(signupsByItem[item.id] || []).length && <span className="helper">No claims yet</span>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                min="1"
                value={itemQty[item.id] ?? ""}
                onChange={(e) => setItemQty((q) => ({ ...q, [item.id]: e.target.value }))}
                onBlur={() => saveItemQty(item.id)}
                placeholder="Needed"
                style={{ width: 72 }}
              />
              <span className={`qty-badge${fulfilled ? " fulfilled-badge" : ""}`}>
                {totalQty}
                {needed ? `/${needed}` : ""}
              </span>
              <button className="btn small danger" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          </div>
        );
      })}
      <div className="card">
        <div className="row">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          />
          <input
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            placeholder="Needed"
            style={{ maxWidth: 90 }}
          />
          <button className="btn secondary small" onClick={addItem}>
            Add
          </button>
        </div>
      </div>

      <div className="section-title">
        All sign-ups <span className="badge">{signups.length}</span>
      </div>
      <div className="card">
        {signups.length === 0 && <p className="helper">No sign-ups yet.</p>}
        {signups.map((s) => (
          <div key={s.id} className="item-row">
            <div>
              <div className="item-name">{s.guest_name}</div>
              <div className="item-need">
                {s.quantity}x {items.find((i) => i.id === s.item_id)?.name || s.custom_item_name || "item"}
                {s.guest_email ? ` · ${s.guest_email}` : ""}
              </div>
              {s.note && <div className="item-need">Note: {s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
