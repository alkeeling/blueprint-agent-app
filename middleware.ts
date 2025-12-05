import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// Tell Next.js which routes to run Clerk middleware on
export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
