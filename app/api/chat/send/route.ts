import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, sessionId } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Must be service role
  );

  // Ensure session exists or create one
  let finalSessionId = sessionId;
  if (!sessionId) {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId })
      .select()
      .single();
    finalSessionId = newSession.id;
  }

  // Save user message
  await supabase.from("chat_messages").insert({
    session_id: finalSessionId,
    role: "user",
    content: message,
  });

  // Stream model response
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: [{ role: "user", content: message }],
  });

  // Save assistant message when done
  result.onFinal(async (assistantText) => {
    await supabase.from("chat_messages").insert({
      session_id: finalSessionId,
      role: "assistant",
      content: assistantText,
    });
  });

  return result.toAIStreamResponse();
}
