import { useState } from "react";

const CELO_GREEN = "#35d07f";
const CELO_GOLD = "#fbcc5c";

/**
 * Placeholder Ajora Mini App shell.
 *
 * This is the Week-1 UI scaffold. The real flow (Save → Pick → Spray → Draw → Claim)
 * wires up to the PotVault / DrawManager contracts via viem + the MiniPay injected
 * provider. See AJORA_SPEC.md §11 for the full screen spec.
 */
export function App() {
  const [tickets, setTickets] = useState(0);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 420,
        margin: "0 auto",
        padding: 24,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <header style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>Ajora 🎉</h1>
        <p style={{ color: "#555", marginTop: 4 }}>Save small, keep every cent, chop jara.</p>
      </header>

      <section
        style={{
          background: `linear-gradient(135deg, ${CELO_GREEN}, ${CELO_GOLD})`,
          borderRadius: 16,
          padding: 20,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.9 }}>Today&apos;s jara pot</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>—.— cUSD</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>Draw at 8:00 PM</div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => setTickets((t) => t + 10)}
          style={{
            padding: "16px",
            fontSize: 18,
            fontWeight: 600,
            borderRadius: 12,
            border: "none",
            background: CELO_GREEN,
            color: "#fff",
          }}
        >
          Save 0.10 cUSD → +10 tickets
        </button>
        <div style={{ textAlign: "center", color: "#555" }}>
          You have <strong>{tickets}</strong> tickets for tonight&apos;s draw
        </div>
      </section>

      <footer style={{ marginTop: "auto", textAlign: "center", color: "#999", fontSize: 12 }}>
        Wallet + contract wiring is stubbed — see AJORA_SPEC.md
      </footer>
    </main>
  );
}
