import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Analog SM",
  description: "A self-hostable Indie social media platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const username = session?.user?.name;
  const displayName = (session?.user as any)?.displayName as string | undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tight">Analog SM</Link>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Timeline</Link>
                <Link href="/friends" className="text-sm font-medium hover:text-primary transition-colors">Friends</Link>
                <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">Search</Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors">Admin</Link>
                )}
                <ThemeToggle />
                {userId && username && (
                  <UserMenu userId={userId} username={username} displayName={displayName} />
                )}
              </nav>
            </div>
          </header>
          <main className="container max-w-2xl py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
