"use client";
import { useState } from "react";
import { FARES, cheapest } from "@/lib/fares";
import PayPalCheckout from "./components/PayPalCheckout";

export default function Home() {
  const [selected, setSelected] = useState(null);
  const best = cheapest("JNB", "LHE");

  return (
    <main>
      <h1>Eswatini Travel AI Agent</h1>
      <p className="sub">Finds the cheapest fare and lets you pay with PayPal (sandbox demo).</p>
      {best && <p className="best">Agent pick: {best.airline} via {best.via}, ${best.price}</p>}
      <ul className="fares">
        {FARES.map((f) => (
          <li key={f.id} className={selected?.id === f.id ? "on" : ""}>
            <div>
              <strong>{f.airline}</strong> {f.from} → {f.to} via {f.via}
              <span className="date">{f.depart}</span>
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
