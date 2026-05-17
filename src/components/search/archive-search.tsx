"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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
    <section className="border border-paper-border bg-paper p-6 md:p-8">
      <div className="mb-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Recherche V1
        </p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
          Chercher dans les lectures assistées publiées
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/75">
          Recherche textuelle simple, sans embeddings et sans IA. Elle interroge
          les lectures assistées des lots prêts pour revue, ainsi que les titres
          de lots, identifiants et noms de fichiers. Index V1 chargé :{" "}
          {documents.length} lecture(s).
        </p>
      </div>

      <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <input
          aria-label="Recherche dans les lectures assistées"
          className="w-full border-2 border-paper-border bg-background px-4 py-3 text-base text-foreground placeholder:text-warm/50"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex: Boghari, Wilaya, ralliements, Tiaret..."
          type="search"
          value={query}
        />
        <button
          className="border border-foreground bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          type="submit"
        >
          Rechercher
        </button>
      </form>

      <p className="mt-3 text-xs leading-5 text-warm">
        Les résultats proviennent de lectures assistées non validées humainement.
        Ils doivent toujours être vérifiés sur l&apos;image.
      </p>

      {results ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-warm">
              {results.length} résultat(s)
            </p>
            <p className="text-xs leading-5 text-warm">{warning}</p>
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result) => (
                <article
                  className="border border-paper-border bg-background p-4"
                  key={result.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-warm">
                        {result.lotId} · {result.reviewId}
                      </p>
                      <h3 className="mt-1 font-serif text-lg font-medium text-foreground">
                        {result.lotTitle}
                      </h3>
                    </div>
                    <Link
                      className="w-fit border border-foreground px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                      href={result.href}
                    >
                      Ouvrir
                    </Link>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-foreground/75">
                    {result.excerpt}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-warm">
                    Fichier : {result.sourceFileName || "Non renseigné"} · Lecture
                    assistée non validée · Champs : {result.matchedFields.join(", ")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="border border-paper-border bg-background px-4 py-3 text-sm text-warm">
              Aucun résultat ne correspond à “{searchedQuery}” dans les lectures
              assistées publiées.
            </p>
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
      lotTitle: document.lotTitle,
      reviewId: document.reviewId,
      sourceFileName: document.sourceFileName,
      text: document.assistedReadingText,
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
