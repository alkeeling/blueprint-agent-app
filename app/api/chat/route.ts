// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge";

// --- Environment setup -------------------------------------------------

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!OPENAI_API_KEY) {
  console.warn(
    "❗ OPENAI_API_KEY is not set. /api/chat will fail until configured."
  );
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY!,
});

// Neon client is optional: if DATABASE_URL is missing, we just skip logging
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

// --- Handler ------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = (body.message as string | undefined)?.trim();
    const userId = (body.userId as string | undefined) || "anon";
    const history =
      (body.history as { role: "user" | "assistant"; content: string }[] |
        undefined) ?? [];

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    // Build chat history for the model. We keep this untyped here
    // and cast once when we call OpenAI to avoid TS union headaches.
    const modelMessages = [
      {
        role: "system" as const,
        content:
          "You are the Blueprint Agent. You help users shape and evolve their data into dashboards and visualisations.",
      },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Call OpenAI (non-streaming)
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: modelMessages as OpenAI.Chat.ChatCompletionMessageParam[],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I couldn't generate a response.";

    // Try to log to Neon, but never break the request if DB fails
    let sessionId: string | null = null;

    if (sql) {
      try {
        const sessions: any[] = await sql`
          insert into chat_sessions (user_id)
          values (${userId})
          returning id
        `;
        sessionId = sessions[0]?.id ?? null;

        if (sessionId) {
          await sql`
            insert into chat_messages (session_id, role, content)
            values (${sessionId}, 'user', ${message}),
                   (${sessionId}, 'assistant', ${reply})
          `;
        }
      } catch (dbErr) {
        console.error("Non-fatal Neon DB error:", dbErr);
      }
    } else {
      console.warn("DATABASE_URL not set – skipping Neon logging.");
    }

    return NextResponse.json(
      { reply, sessionId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json(
      {
        error: err?.message || "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
