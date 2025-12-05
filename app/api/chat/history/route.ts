import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY! // For read access, anon is fine
  );

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (sessions.length === 0)
    return NextResponse.json({ sessions: [] });

  // load messages for newest session
  const newestSession = sessions[0];

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", newestSession.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ sessionId: newestSession.id, messages });
}