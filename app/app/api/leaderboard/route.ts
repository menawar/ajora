import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "savers"; // 'savers', 'streaks', 'crews'
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const supabase = getServiceSupabase();

  try {
    if (category === "savers") {
      const { data, error } = await supabase
        .from("users")
        .select("address, total_saved_usd")
        .order("total_saved_usd", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Map to frontend expected shape
      const mapped = data.map((u: any, i: number) => ({
        rank: i + 1,
        address: u.address,
        score: u.total_saved_usd,
      }));
      return NextResponse.json(mapped);
    } 
    
    if (category === "streaks") {
      const { data, error } = await supabase
        .from("users")
        .select("address, current_streak")
        .order("current_streak", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const mapped = data.map((u: any, i: number) => ({
        rank: i + 1,
        address: u.address,
        score: u.current_streak,
      }));
      return NextResponse.json(mapped);
    }

    if (category === "crews") {
      const { data, error } = await supabase
        .from("crews")
        .select("name, total_volume_usd")
        .order("total_volume_usd", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const mapped = data.map((c: any, i: number) => ({
        rank: i + 1,
        address: c.name, // Using name as address field for the UI
        score: c.total_volume_usd,
      }));
      return NextResponse.json(mapped);
    }

    return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
