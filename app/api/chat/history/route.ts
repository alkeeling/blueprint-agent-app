// app/api/chat/history/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "edge";

const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export async function GET() {
  // If we don't have a DB URL, just return an empty history
  if (!sql) {
    console.warn("DATABASE_URL not set – returning empty chat history.");
    return NextResponse.json({ messages: [] }, { status: 200 });
  }

  try {
    // Pull the most recent 50 messages from all sessions (simple version)
    const rows: any[] = await sql`
      select role, content
      from chat_messages
      order by created_at asc
      limit 50
    `;

    const messages = rows.map((row) => ({
      role: row.role === "assistant" ? "assistant" : "user",
      content: String(row.content ?? ""),
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (err) {
    console.error("Error loading chat history from Neon:", err);
    return NextResponse.json(
      { messages: [], error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
