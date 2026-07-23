import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("unlocked_themes, xp_balance, current_theme")
      .eq("address", address.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found, return defaults
        return NextResponse.json({
          unlocked_themes: ['light', 'dark'],
          xp_balance: 0,
          current_theme: 'system'
        });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Themes API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { address, themeId, price } = await request.json();
    
    if (!address || !themeId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // In a real implementation, you'd use a transaction or RPC to deduct XP and add to array safely
    // For this MVP, we do it via RPC
    const { data, error } = await supabase.rpc('unlock_theme', {
      user_addr: address.toLowerCase(),
      theme_to_unlock: themeId,
      cost: price
    });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Themes POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
