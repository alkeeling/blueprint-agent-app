// app/api/chat/history/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export async function GET() {
  try {
    const { userId } = auth();

    // If not signed in or no DB, just return empty history
    if (!userId || !sql) {
      return NextResponse.json([], { status: 200 });
    }

    // Pull recent messages for this user
    const rows = await sql<{
      role: "user" | "assistant";
      content: string;
    }>`
      select m.role, m.content
      from chat_messages m
      join chat_sessions s on m.session_id = s.id
      where s.user_id = ${userId}
      order by m.created_at asc
      limit 50
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("Error in /api/chat/history:", err);
    return NextResponse.json([], { status: 200 });
  }
}
