"use client";
import { useState } from "react";
import { FARES } from "@/lib/fares";
import PayPalCheckout from "./components/PayPalCheckout";
import AgentChat from "./components/AgentChat";

export default function Home() {
  const [selected, setSelected] = useState(null);

  return (
    <main>
      <h1>Eswatini Travel AI Agent</h1>
      <p className="sub">Ask the agent for a fare. It searches, picks the cheapest, and you pay with PayPal (sandbox demo).</p>

      <AgentChat />

      <h2 className="all">All sample fares</h2>
      <ul className="fares">
        {FARES.map((f) => (
          <li key={f.id} className={selected?.id === f.id ? "on" : ""}>
            <div>
              <strong>{f.airline}</strong> {f.from} → {f.to} via {f.via}
              <span className="date">{f.depart} · {f.stops} stop{f.stops === 1 ? "" : "s"}</span>
            </div>
            <div className="right">
              <span className="price">${f.price}</span>
              <button onClick={() => setSelected(f)}>Select</button>
            </div>
          </li>
        ))}
      </ul>
      {selected && (
        <section className="pay">
          <h2>Pay for {selected.airline} {selected.from}-{selected.to}: ${selected.price}</h2>
          <PayPalCheckout key={selected.id} fare={selected} />
        </section>
      )}
    </main>
  );
}
