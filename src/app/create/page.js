"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMOJIS = ["🍲", "🎉", "🍂", "🎄", "🌻", "🏖️", "🍁", "🎃", "🥧", "🍕", "🎂", "⭐"];
const COLORS = ["#e07a3f", "#3f7de0", "#4caf6b", "#c2447b", "#7a5cd6", "#d6a33f"];

const DEFAULT_ITEMS = ["Main dish", "Side dish", "Dessert", "Drinks", "Plates & napkins"];

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [newItem, setNewItem] = useState("");
  const [reminderStartDays, setReminderStartDays] = useState(7);
  const [reminderRepeatDays, setReminderRepeatDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addItem() {
    const v = newItem.trim();
    if (!v) return;
    setItems([...items, v]);
    setNewItem("");
}

  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
}

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!title || !hostName || !hostEmail || !eventDate) {
      setError("Please fill in the event name, your name, your email, and the date.");
      return;
}
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          hostName,
          hostEmail,
          description,
          eventDate,
          eventTime,
          location,
          theme,
          emoji,
          color,
          items,
          reminderStartDays: reminderStartDays === "" ? null : Number(reminderStartDays),
          reminderRepeatDays: reminderRepeatDays === "" ? null : Number(reminderRepeatDays),
}),
});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/admin/${data.slug}?token=${data.adminToken}&new=1`);
} catch (err) {
      setError(err.message);
      setLoading(false);
}
}

  return (
    <div className="wrap">
      <h1>Create a potluck</h1>
      <p className="subtitle">Fill in the details, then share the link with your guests.</p>
{error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <label>Event name *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friendsgiving 2026" />

          <label>Theme (optional)</label>
          <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Fall harvest, ugly sweater, luau..." />

          <label>Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anything guests should know" />

          <div className="row">
            <div>
              <label>Date *</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <label>Time</label>
              <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
            </div>
          </div>

          <label>Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="123 Main St, or a Zoom link" />
        </div>

        <div className="card">
          <div className="section-title">Look & feel</div>
          <label>Icon</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  fontSize: 22,
                  padding: 6,
                  borderRadius: 8,
                  border: emoji === e ? "2px solid #333" : "1px solid #ece2d4",
                  background: "#fff",
                  cursor: "pointer",
}}
              >
{e}
              </button>
            ))}
          </div>
          <label>Accent color</label>
          <div style={{ display: "flex", gap: 8 }}>
{COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid #333" : "1px solid #ddd",
                  cursor: "pointer",
}}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Items to bring</div>
          <p className="helper">Guests will be able to sign up for these, or add their own.</p>
{items.map((it, i) => (
            <div key={i} className="item-row">
              <span className="item-name">{it}</span>
              <button type="button" className="btn small danger" onClick={() => removeItem(i)}>
                Remove
              </button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10 }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add an item (e.g. Ice)"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
            />
            <button type="button" className="btn secondary small" onClick={addItem}>
              Add
            </button>
          </div>
        </div>

        <div className="card">
          <div className="section-title">You (the host)</div>
          <div className="row">
            <div>
              <label>Your name *</label>
              <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} />
            </div>
            <div>
              <label>Your email *</label>
              <input type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
            </div>
          </div>
          <p className="helper">We'll email you here whenever someone signs up, plus your private admin link.</p>
        </div>

        <div className="card">
          <div className="section-title">Guest reminders</div>
          <label>Start sending reminders this many days before the event</label>
          <input type="number" min="0" value={reminderStartDays} onChange={(e) => setReminderStartDays(e.target.value)} />
          <label>Repeat reminder every N days after that (optional)</label>
          <input
            type="number"
            min="1"
            value={reminderRepeatDays}
            onChange={(e) => setReminderRepeatDays(e.target.value)}
            placeholder="Leave blank to send just once"
          />
          <p className="helper">
            Only guests who leave an email get reminders. Set start days to 0 to disable reminders entirely.
          </p>
        </div>

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
{loading ? "Creating..." : "Create my potluck page"}
        </button>
      </form>
    </div>
  );
}
