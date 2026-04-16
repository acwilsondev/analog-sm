import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Analog SM",
  description: "A self-hostable Indie social media platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">Analog SM</Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Timeline</Link>
              <Link href="/friends" className="text-sm font-medium hover:text-primary transition-colors">Friends</Link>
              <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">Search</Link>
              <div className="h-8 w-8 rounded-full bg-muted" />
            </nav>
          </div>
        </header>
        <main className="container max-w-2xl py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
