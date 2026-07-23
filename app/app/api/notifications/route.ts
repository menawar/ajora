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
      .from("notifications")
      .select("*")
      .eq("user_address", address.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const mapped = data.map((n: { id: string, type: string, title: string, message: string, created_at: string, is_read: boolean }) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: n.created_at, // The UI will format this relative
      read: n.is_read
    }));

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { address, notificationIds } = await request.json(); // array of IDs to mark read
    
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_address", address.toLowerCase());

    if (notificationIds && notificationIds.length > 0) {
      query = query.in("id", notificationIds);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Notifications POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
