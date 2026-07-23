import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const category = searchParams.get("category") || "xp";

  // If we ever support other categories, we'd handle them here.
  // For now, only 'xp' is supported from Supabase directly.
  if (category !== "xp") {
    return NextResponse.json({ error: "Unsupported category" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("address, xp, username, avatar_url")
      .order("xp", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      rows: data.map(r => ({
        address: r.address,
        total: r.xp,
        username: r.username,
        avatar_url: r.avatar_url
      }))
    });
  } catch (err: unknown) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
