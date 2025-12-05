import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "../components/navbar";

export const metadata: Metadata = {
  title: "Blueprint Agent",
  description: "Blueprint Agent SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-gray-900">
          <Navbar />
          <main className="pt-20">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
