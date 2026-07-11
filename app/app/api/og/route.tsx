import { ImageResponse } from "next/og";
import { formatUnits } from "viem";
import { publicClient } from "../../../lib/clients";
import { contracts } from "../../../lib/contracts";

export async function GET() {
  try {
    const periodId = await publicClient.readContract({
      ...contracts.potVault,
      functionName: "currentPeriod",
    });
    
    const info = await publicClient.readContract({
      ...contracts.potVault,
      functionName: "periodInfo",
      args: [periodId],
    });
    
    const potSize = Number(formatUnits(info.jaraPot, 18)).toFixed(2);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            fontFamily: "sans-serif",
            backgroundImage: "linear-gradient(to bottom right, #f0fdf4, #ffffff)",
          }}
        >
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: "#17c964" }}>
            Ajora Daily Pot
          </div>
          <div style={{ display: "flex", fontSize: 100, fontWeight: 800, marginTop: 20, color: "#111827" }}>
            {potSize} cUSD
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#4b5563", marginTop: 40 }}>
            Save. Pick a number. Win the pot.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0fdf4",
          }}
        >
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, color: "#17c964" }}>
            Ajora Daily Pot
          </div>
          <div style={{ display: "flex", fontSize: 40, color: "#4b5563", marginTop: 20 }}>
            Play now on MiniPay
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
