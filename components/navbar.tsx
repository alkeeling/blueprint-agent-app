"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav className="w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Blueprint Agent
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-sm hover:underline">
            Chat
          </Link>

          <SignedOut>
            <SignInButton>
              <button className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
