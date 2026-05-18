import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import {
  Archive,
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
            <nav className="flex flex-wrap items-center justify-end gap-4 sm:gap-6">
              <Link
                href="/lots"
                className="flex items-center gap-2 text-sm font-medium text-warm transition-colors hover:text-foreground"
              >
                <Layers3 className="h-4 w-4 stroke-[2]" />
                Lots d&apos;archives
              </Link>
              <Link
                href="/questionnement"
                className="flex items-center gap-2 text-sm font-medium text-warm transition-colors hover:text-foreground"
              >
                <Search className="h-4 w-4 stroke-[2]" />
                Recherche V1
              </Link>
              <Link
                href="/inventaire"
                className="flex items-center gap-2 text-sm font-medium text-warm transition-colors hover:text-foreground"
              >
                <ClipboardList className="h-4 w-4 stroke-[2]" />
                Etat du corpus
              </Link>
              <Link
                href="/relecture"
                className="flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                <ClipboardCheck className="h-4 w-4 stroke-[2]" />
                Relecture
              </Link>
              <Link
                href="/collections"
                className="flex items-center gap-2 border-l border-paper-border pl-4 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground sm:pl-6"
              >
                <Archive className="h-4 w-4 stroke-[2]" />
                Reperes V0
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
