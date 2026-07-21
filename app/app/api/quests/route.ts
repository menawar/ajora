import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    // 1. Fetch all quests
    const { data: quests, error: questsError } = await supabase
      .from("quests")
      .select("*");

    if (questsError) throw questsError;

    // 2. Fetch user's progress
    const { data: userProgress, error: progressError } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_address", address.toLowerCase());

    if (progressError) throw progressError;

    // 3. Merge them together
    const mapped = quests.map((q: any) => {
      const progress = userProgress.find((up: any) => up.quest_id === q.id);
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        xpReward: q.xp_reward,
        progress: progress?.progress || 0,
        total: q.target_count,
        completed: progress?.completed || false,
        type: q.quest_type,
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("Quests API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Claim a quest
  try {
    const { address, questId } = await request.json();
    
    if (!address || !questId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify quest exists and progress
    const { data: uq, error: fetchError } = await supabase
      .from("user_quests")
      .select("*, quests(target_count, xp_reward)")
      .eq("user_address", address.toLowerCase())
      .eq("quest_id", questId)
      .single();

    if (fetchError || !uq) {
      return NextResponse.json({ error: "Quest progress not found" }, { status: 404 });
    }

    // Since we don't have on-chain events synced right now, 
    // we'll simulate claiming it if progress == total.
    // Ideally, a cron job updates the progress.
    if (uq.progress >= uq.quests.target_count && !uq.completed) {
      // Mark as completed
      await supabase
        .from("user_quests")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", uq.id);

      // Award XP
      await supabase.rpc('increment_xp', {
        user_addr: address.toLowerCase(),
        amount: uq.quests.xp_reward
      });

      return NextResponse.json({ success: true, awarded: uq.quests.xp_reward });
    }

    return NextResponse.json({ error: "Quest not ready to claim" }, { status: 400 });

  } catch (error: any) {
    console.error("Quests POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
