import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("address");

  if (!raw) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const address = raw.toLowerCase();
  const supabase = getServiceSupabase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("address", address)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
      throw error;
    }

    if (!data) {
      return NextResponse.json({ address, xp: 0, username: null, avatar_url: null });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("[profile] Failed to load profile:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, username, avatar_url } = body;

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const addrLower = address.toLowerCase();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        { address: addrLower, username, avatar_url },
        { onConflict: "address" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("[profile] Failed to update profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
