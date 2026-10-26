import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { TargetIcon } from "@/components/icons";import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GMB Circle Coordinates",
  description: "Generate 360° circle coordinates around a business location for Google My Maps",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <nav className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-fg">
                <TargetIcon className="size-4.5" />
              </span>
              GMB Circle Tool
            </Link>
            <span className="ml-auto hidden text-xs text-muted sm:block">360° coordinates → Google My Maps</span>
            <form action="/api/logout" method="post" className="ml-auto sm:ml-0">
              <button type="submit" className="cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-foreground">
                Logout
              </button>
            </form>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
