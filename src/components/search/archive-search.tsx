"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AlertTriangle, Search as SearchIcon } from "lucide-react";
import type { ArchiveSearchDocument, ArchiveSearchResult } from "@/lib/searchIndex";

type ArchiveSearchProps = {
  documents: ArchiveSearchDocument[];
};

const SEARCH_LIMIT = 10;
const EXCERPT_RADIUS = 120;

export function ArchiveSearch({ documents }: ArchiveSearchProps) {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<ArchiveSearchResult[] | null>(null);
  const [warning, setWarning] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    setSearchedQuery(trimmedQuery);

    if (trimmedQuery.length < 2) {
      setResults([]);
      setWarning("Saisir au moins deux caractères pour lancer la recherche.");
      return;
    }

    setResults(searchDocuments(documents, trimmedQuery, SEARCH_LIMIT));
    setWarning(
      "Recherche textuelle simple dans les lectures assistées publiées ; résultats non validés humainement.",
    );
  }

  return (
    <section className="border border-paper-border bg-paper p-6 md:p-10">
      <div className="mb-8 max-w-3xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Recherche V1
        </p>
        <h2 className="mt-2 font-serif text-3xl font-medium text-foreground">
          Chercher dans les lectures assistées publiées
        </h2>
        <p className="mt-4 text-base leading-7 text-foreground/80">
          Cette recherche textuelle simple n&apos;utilise aucune IA. Elle interroge
          directement les lectures assistées des lots prêts pour revue. Index
          actuel : <strong className="font-medium text-foreground">{documents.length}</strong> fiches.
        </p>
      </div>

      <form className="relative max-w-4xl" onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-5 h-6 w-6 text-warm" />
          <input
            aria-label="Recherche dans les lectures assistées"
            className="w-full border-2 border-paper-border bg-background py-5 pl-14 pr-32 font-serif text-lg text-foreground placeholder:text-warm/50 focus:border-foreground focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex: Boghari, Wilaya, ralliements, Tiaret..."
            type="search"
            value={query}
          />
          <button
            className="absolute right-2 top-2 bottom-2 bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            type="submit"
          >
            Chercher
          </button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-warm">
          <AlertTriangle className="h-4 w-4" />
          Les résultats doivent toujours être vérifiés sur l&apos;image source.
        </p>
      </form>

      {results ? (
        <div className="mt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-paper-border pb-4">
            <h3 className="font-serif text-xl font-medium text-foreground">
              {results.length > 0 ? `${results.length} résultat(s) pour “${searchedQuery}”` : "Aucun résultat"}
            </h3>
            <p className="text-sm font-medium text-amber-700">{warning}</p>
          </div>

          {results.length > 0 ? (
            <div className="space-y-6">
              {results.map((result) => (
                <article
                  className="group relative border border-paper-border bg-background transition-colors hover:border-warm/50"
                  key={result.id}
                >
                  <div className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
                            {result.lotId}
                          </span>
                          <span className="text-warm/50">•</span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-warm/80">
                            {result.sourceFileName || "Fichier inconnu"}
                          </span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-foreground">
                          {result.lotTitle}
                        </h4>
                      </div>
                      <Link
                        className="inline-flex shrink-0 items-center justify-center border border-paper-border bg-paper px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                        href={result.href}
                      >
                        Consulter la fiche
                      </Link>
                    </div>

                    <div className="mt-6 border-l-2 border-warm/30 pl-4">
                      <p className="font-serif text-base leading-7 text-foreground/90 italic">
                        &laquo; {result.excerpt} &raquo;
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-paper-border bg-paper/30 px-6 py-3">
                    <p className="text-xs text-warm">
                      Correspondance trouvée dans : <span className="font-medium text-foreground/70">{result.matchedFields.join(", ")}</span>
                      {" "}· <span className="text-amber-700">Lecture non validée</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-paper-border bg-paper p-8 text-center">
              <p className="text-base text-foreground/80">
                Aucun résultat ne correspond à la recherche <strong className="font-medium text-foreground">“{searchedQuery}”</strong>.
              </p>
              <p className="mt-2 text-sm text-warm">
                Essayez d&apos;autres termes ou un nom de lot (ex: boghari).
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function searchDocuments(
  documents: ArchiveSearchDocument[],
  query: string,
  limit: number,
): ArchiveSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const results: ArchiveSearchResult[] = [];

  for (const document of documents) {
    const fields = {
      "Titre du lot": document.lotTitle,
      "ID de revue": document.reviewId,
      "Nom du fichier": document.sourceFileName,
      "Lecture assistée": document.assistedReadingText,
    };
    const matchedFields = Object.entries(fields)
      .filter(([, value]) => {
        const normalizedValue = normalizeSearchText(value);
        if (normalizedValue.includes(normalizedQuery)) return true;

        return tokens.every((token) => normalizedValue.includes(token));
      })
      .map(([field]) => field);

    if (matchedFields.length === 0) continue;

    results.push({
      excerpt: buildExcerpt(document.assistedReadingText, normalizedQuery),
      href: document.href,
      id: document.id,
      lotId: document.lotId,
      lotTitle: document.lotTitle,
      matchedFields,
      reviewId: document.reviewId,
      sourceFileName: document.sourceFileName,
      validationStatus: document.validationStatus,
    });

    if (results.length >= limit) return results;
  }

  return results;
}

function buildExcerpt(text: string, normalizedQuery: string): string {
  if (!text.trim()) return "Lecture assistée vide ou non disponible.";

  const normalizedText = normalizeSearchText(text);
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) {
    return `${text.slice(0, EXCERPT_RADIUS * 2).trim()}${text.length > EXCERPT_RADIUS * 2 ? "..." : ""}`;
  }

  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(text.length, index + normalizedQuery.length + EXCERPT_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
