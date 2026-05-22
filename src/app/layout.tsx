import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import {
  ClipboardCheck,
  ClipboardList,
  Layers3,
  Library,
  Search,
} from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Archives Algerie",
  description:
    "Consultation documentaire par lots, recherche prudente et suivi technique du corpus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-background text-foreground`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-paper-border bg-background/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-3 text-foreground transition-opacity hover:opacity-80"
            >
              <Library className="h-6 w-6 stroke-[1.5]" />
              <span className="font-serif text-xl font-medium tracking-wide">
                Archives Algerie
              </span>
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
              <div className="flex items-center gap-6">
                <Link
                  href="/lots"
                  className="flex items-center gap-2 text-sm font-medium text-warm hover:text-foreground transition-colors"
                >
                  <Layers3 className="h-4 w-4 stroke-[2]" />
                  Lots
                </Link>
                <Link
                  href="/questionnement"
                  className="flex items-center gap-2 text-sm font-medium text-warm hover:text-foreground transition-colors"
                >
                  <Search className="h-4 w-4 stroke-[2]" />
                  Recherche
                </Link>
                <Link
                  href="/inventaire"
                  className="flex items-center gap-2 text-sm font-medium text-warm hover:text-foreground transition-colors"
                >
                  <ClipboardList className="h-4 w-4 stroke-[2]" />
                  Registre
                </Link>
              </div>
              <div className="flex items-center gap-4 border-l border-paper-border pl-6">
                <Link
                  href="/relecture"
                  className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/80 transition-colors"
                  title="Espace de travail modération"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Relecture</span>
                </Link>
              </div>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
