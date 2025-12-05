import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Blueprint Agent App</h1>

      <SignedOut>
        <p className="text-lg">You are currently signed out.</p>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
          <p className="text-lg">You are signed in. 🎉</p>
        </div>
      </SignedIn>
    </main>
  );
}
