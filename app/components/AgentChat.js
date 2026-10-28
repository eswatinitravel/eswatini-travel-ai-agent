"use client";
import { useEffect, useRef, useState } from "react";
import PayPalCheckout from "./PayPalCheckout";

const EXAMPLES = [
  "Cheapest Johannesburg to Lahore in December, 1 stop max",
  "Lahore to Johannesburg in January",
  "Any fare JNB to LHE, I don't mind 2 stops"
];

export default function AgentChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Tell me where and when you want to fly, and I'll find the cheapest fare and set up PayPal checkout." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, loading]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent error");
      setMessages([...next, { role: "assistant", content: data.reply, meta: { toolCalls: data.toolCalls, mode: data.mode, model: data.model, notice: data.notice } }]);
      if (data.fare) setPick(data.fare);
    } catch (err) {
      setMessages([...next, { role: "assistant", content: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="agent">
      <h2>Ask the AI agent</h2>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <p>{m.content}</p>
            {m.meta && (
              <div className="trace">
                <span className="badge">{m.meta.mode === "llm" ? `LLM · ${m.meta.model}` : "Rule-based agent"}</span>
                {m.meta.toolCalls?.map((c, j) => (
                  <code key={j}>🔧 {c.name}({JSON.stringify(c.arguments)}) → {c.resultCount} result{c.resultCount === 1 ? "" : "s"}</code>
                ))}
                {m.meta.notice && <span className="notice">{m.meta.notice}</span>}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="bubble assistant"><p>Searching fares…</p></div>}
        <div ref={endRef} />
      </div>
      <div className="examples">
        {EXAMPLES.map((e) => (
          <button key={e} type="button" className="chip" onClick={() => send(e)} disabled={loading}>{e}</button>
        ))}
      </div>
      <form className="ask" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. cheapest Johannesburg to Lahore in December, 1 stop max" aria-label="Message the travel agent" />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>

      {pick && (
        <div className="pick">
          <div className="fare-card">
            <div>
              <span className="tag">Agent pick</span>
              <strong>{pick.airline}</strong> {pick.from} → {pick.to} via {pick.via}
              <span className="date">{pick.depart} · {pick.stops} stop{pick.stops === 1 ? "" : "s"} · {pick.id}</span>
            </div>
            <span className="price">${pick.price}</span>
          </div>
          <PayPalCheckout key={pick.id} fare={pick} />
        </div>
      )}
    </section>
  );
}
