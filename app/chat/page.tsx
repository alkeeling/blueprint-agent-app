// app/chat/page.tsx
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import ChatClient, { Message } from "./ChatClient";
import { neon } from "@neondatabase/serverless";

// Neon setup
const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export default async function ChatPage() {
  const user = await currentUser();

  // If the user is not signed in, just show a sign-in prompt.
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-2">Blueprint Agent Chat</h1>
        <p className="mb-6 text-gray-600 text-center max-w-xl">
          Please sign in to use the Blueprint Agent and keep your
          conversations saved.
        </p>
        <SignInButton>
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white">
            Sign in to continue
          </button>
        </SignInButton>
      </main>
    );
  }

  // --------- Load history for this user from Neon ---------
  let initialMessages: Message[] = [];

  if (sql) {
    try {
      const rows = await sql<{
        role: string;
        content: string;
      }>`
        select m.role, m.content
        from chat_messages m
        join chat_sessions s on m.session_id = s.id
        where s.user_id = ${user.id}
        order by m.created_at asc
        limit 50
      `;

      initialMessages = rows.map((row) => ({
        role: row.role === "assistant" ? "assistant" : "user",
        content: row.content,
      }));
    } catch (err) {
      console.error("Error loading chat history from Neon:", err);
      // If history fails to load, we just start with an empty conversation
    }
  } else {
    console.warn(
      "DATABASE_URL is not set – chat history will not be loaded."
    );
  }

  // --------- Render page ---------
  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Blueprint Agent Chat</h1>
      <p className="mb-6 text-gray-600 text-center max-w-xl">
        Describe your data or what you&apos;re trying to visualise, and the
        Blueprint Agent will help you evolve it.
      </p>

      <SignedIn>
        <ChatClient userId={user.id} initialMessages={initialMessages} />
      </SignedIn>

      <SignedOut>
        <div className="border rounded-xl p-6 max-w-xl text-center mt-6">
          <p className="mb-4">
            You need to be signed in to use the Blueprint Agent.
          </p>
          <SignInButton>
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white">
              Sign in to continue
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </main>
  );
}
