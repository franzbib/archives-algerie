"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

const ANNOTATION_TYPES = [
  { label: "Note de lecture", value: "note" },
  { label: "Proposition de correction", value: "correction_proposal" },
  { label: "Proposition de transcription", value: "transcription_proposal" },
  { label: "Note de traduction", value: "translation_note" },
  { label: "Note de métadonnées", value: "metadata_note" },
] as const;

type AnnotationType = (typeof ANNOTATION_TYPES)[number]["value"];

type DocumentAnnotation = {
  id: string;
  annotation_type: AnnotationType;
  author_name: string | null;
  body: string;
  created_at: string;
};

type DocumentAnnotationsProps = {
  lotId: string;
  reviewId: string;
};

export function DocumentAnnotations({
  lotId,
  reviewId,
}: DocumentAnnotationsProps) {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [annotationType, setAnnotationType] = useState<AnnotationType>("note");
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const annotationTypeLabels = useMemo(
    () =>
      new Map<AnnotationType, string>(
        ANNOTATION_TYPES.map((type) => [type.value, type.label]),
      ),
    [],
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadPublishedAnnotations() {
      if (!supabaseClient) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data, error: loadError } = await supabaseClient
        .from("document_annotations")
        .select("id, annotation_type, author_name, body, created_at")
        .eq("lot_id", lotId)
        .eq("review_id", reviewId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!isCurrent) {
        return;
      }

      if (loadError) {
        setError("Impossible de charger les annotations publiees.");
        setAnnotations([]);
      } else {
        setAnnotations((data ?? []) as DocumentAnnotation[]);
      }

      setIsLoading(false);
    }

    loadPublishedAnnotations();

    return () => {
      isCurrent = false;
    };
  }, [lotId, reviewId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabaseClient) {
      return;
    }

    const trimmedBody = body.trim();
    const trimmedAuthorName = authorName.trim();

    if (!trimmedBody) {
      setError("Le texte de l'annotation est obligatoire.");
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const { error: insertError } = await supabaseClient
      .from("document_annotations")
      .insert({
        annotation_type: annotationType,
        author_name: trimmedAuthorName || null,
        body: trimmedBody,
        lot_id: lotId,
        review_id: reviewId,
        status: "pending",
      });

    if (insertError) {
      setError("L'annotation n'a pas pu etre enregistree.");
    } else {
      setAuthorName("");
      setBody("");
      setAnnotationType("note");
      setSuccessMessage(
        "Annotation enregistrée. Elle devra être relue avant publication.",
      );
    }

    setIsSubmitting(false);
  }

  if (!supabaseClient) {
    return (
      <section className="border border-paper-border bg-paper p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Annotations
        </p>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Les annotations persistantes ne sont pas encore activées sur cette
          installation.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-paper-border bg-paper">
      <div className="border-b border-paper-border bg-background/60 px-5 py-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
          Annotations
        </p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
          Propositions publiees
        </h2>
      </div>

      <div className="space-y-6 p-5">
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-foreground/70">
              Chargement des annotations publiées...
            </p>
          ) : annotations.length > 0 ? (
            annotations.map((annotation) => (
              <article
                className="border border-paper-border bg-background p-4 text-sm"
                key={annotation.id}
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-paper-border pb-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-warm">
                    {annotationTypeLabels.get(annotation.annotation_type) ??
                      annotation.annotation_type}
                  </span>
                  <span className="text-foreground/40">/</span>
                  <span className="text-foreground/60">
                    {formatAnnotationDate(annotation.created_at)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap leading-6 text-foreground/85">
                  {annotation.body}
                </p>
                {annotation.author_name && (
                  <p className="mt-3 text-xs font-medium text-foreground/60">
                    Proposé par {annotation.author_name}
                  </p>
                )}
              </article>
            ))
          ) : (
            <p className="text-sm text-foreground/70">
              Aucune annotation publiée pour cette page.
            </p>
          )}
        </div>

        <form className="space-y-4 border-t border-paper-border pt-5" onSubmit={handleSubmit}>
          <div className="border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
            Les annotations sont des propositions de relecture. Elles ne
            remplacent pas l&apos;image source et ne constituent pas une
            transcription validée.
          </div>

          <div>
            <label
              className="font-mono text-xs font-semibold uppercase tracking-widest text-warm"
              htmlFor="annotation-type"
            >
              Type
            </label>
            <select
              className="mt-2 w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground"
              id="annotation-type"
              onChange={(event) =>
                setAnnotationType(event.target.value as AnnotationType)
              }
              value={annotationType}
            >
              {ANNOTATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="font-mono text-xs font-semibold uppercase tracking-widest text-warm"
              htmlFor="annotation-body"
            >
              Annotation
            </label>
            <textarea
              className="mt-2 min-h-32 w-full border border-paper-border bg-background px-3 py-2 text-sm leading-6 text-foreground"
              id="annotation-body"
              maxLength={5000}
              onChange={(event) => setBody(event.target.value)}
              required
              value={body}
            />
          </div>

          <div>
            <label
              className="font-mono text-xs font-semibold uppercase tracking-widest text-warm"
              htmlFor="annotation-author-name"
            >
              Nom, optionnel
            </label>
            <input
              className="mt-2 w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground"
              id="annotation-author-name"
              maxLength={120}
              onChange={(event) => setAuthorName(event.target.value)}
              type="text"
              value={authorName}
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
          {successMessage && (
            <p className="text-sm font-medium text-foreground">{successMessage}</p>
          )}

          <button
            className="border border-warm bg-warm px-4 py-2 text-sm font-semibold text-paper transition hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Enregistrement..." : "Proposer l'annotation"}
          </button>
        </form>
      </div>
    </section>
  );
}

function formatAnnotationDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
