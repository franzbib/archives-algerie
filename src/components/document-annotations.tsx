"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [publishingAnnotationId, setPublishingAnnotationId] = useState<
    string | null
  >(null);
  const [pendingAnnotations, setPendingAnnotations] = useState<
    DocumentAnnotation[]
  >([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const annotationTypeLabels = useMemo(
    () =>
      new Map<AnnotationType, string>(
        ANNOTATION_TYPES.map((type) => [type.value, type.label]),
      ),
    [],
  );

  const loadPublishedAnnotations = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      if (!supabaseClient) {
        return;
      }

      try {
        const { data, error: loadError } = await supabaseClient
          .from("document_annotations")
          .select("id, annotation_type, author_name, body, created_at")
          .eq("lot_id", lotId)
          .eq("review_id", reviewId)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (!isCurrent()) {
          return;
        }

        if (loadError) {
          setError(formatSupabaseError("Impossible de charger les annotations publiées", loadError));
          setAnnotations([]);
        } else {
          setAnnotations((data ?? []) as DocumentAnnotation[]);
        }
      } catch (loadError) {
        if (!isCurrent()) {
          return;
        }

        setError(formatSupabaseError("Impossible de charger les annotations publiées", loadError));
        setAnnotations([]);
      }
    },
    [lotId, reviewId],
  );

  useEffect(() => {
    let isCurrent = true;

    if (!supabaseClient) {
      return;
    }

    void Promise.resolve(
      supabaseClient
        .from("document_annotations")
        .select("id, annotation_type, author_name, body, created_at")
        .eq("lot_id", lotId)
        .eq("review_id", reviewId)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    )
      .then(({ data, error: loadError }) => {
        if (!isCurrent) {
          return;
        }

        if (loadError) {
          setError(formatSupabaseError("Impossible de charger les annotations publiées", loadError));
          setAnnotations([]);
        } else {
          setAnnotations((data ?? []) as DocumentAnnotation[]);
        }
      })
      .catch((loadError) => {
        if (!isCurrent) {
          return;
        }

        setError(formatSupabaseError("Impossible de charger les annotations publiées", loadError));
        setAnnotations([]);
      });

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

    try {
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
        setError(formatSupabaseError("L'annotation n'a pas pu être enregistrée", insertError));
      } else {
        setAuthorName("");
        setBody("");
        setAnnotationType("note");
        setSuccessMessage(
          "Annotation enregistrée. Elle devra être relue avant publication.",
        );
      }
    } catch (insertError) {
      setError(formatSupabaseError("L'annotation n'a pas pu être enregistrée", insertError));
    }

    setIsSubmitting(false);
  }

  async function handleLoadPendingAnnotations(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!supabaseClient) {
      return;
    }

    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      setAdminError("Mot de passe requis.");
      setAdminMessage(null);
      setPendingAnnotations([]);
      return;
    }

    setAdminError(null);
    setAdminMessage(null);
    setIsAdminLoading(true);

    try {
      const { data, error: rpcError } = await supabaseClient.rpc(
        "list_pending_document_annotations",
        {
          admin_password: trimmedPassword,
          page_lot_id: lotId,
          page_review_id: reviewId,
        },
      );

      if (rpcError) {
        if (isMissingRpcError(rpcError)) {
          setAdminError(
            "Le module de validation n'est pas encore activé dans Supabase.",
          );
        } else {
          setAdminError(formatSupabaseError("Impossible de charger les annotations en attente", rpcError));
        }
        setPendingAnnotations([]);
      } else {
        const pendingRows = (data ?? []) as DocumentAnnotation[];
        setPendingAnnotations(pendingRows);
        setAdminMessage(
          pendingRows.length > 0
            ? `${pendingRows.length} annotation(s) en attente.`
            : "Aucune annotation en attente pour cette page, ou mot de passe incorrect.",
        );
      }
    } catch (rpcError) {
      setAdminError(formatSupabaseError("Impossible de charger les annotations en attente", rpcError));
      setPendingAnnotations([]);
    }

    setIsAdminLoading(false);
  }

  async function handlePublishAnnotation(annotationId: string) {
    if (!supabaseClient) {
      return;
    }

    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      setAdminError("Mot de passe requis.");
      setAdminMessage(null);
      return;
    }

    setAdminError(null);
    setAdminMessage(null);
    setPublishingAnnotationId(annotationId);

    try {
      const { data, error: rpcError } = await supabaseClient.rpc(
        "publish_document_annotation",
        {
          admin_password: trimmedPassword,
          annotation_id: annotationId,
        },
      );

      if (rpcError) {
        if (isMissingRpcError(rpcError)) {
          setAdminError(
            "Le module de validation n'est pas encore activé dans Supabase.",
          );
        } else {
          setAdminError(formatSupabaseError("Impossible de publier cette annotation", rpcError));
        }
      } else if (data === true) {
        setPendingAnnotations((current) =>
          current.filter((annotation) => annotation.id !== annotationId),
        );
        await loadPublishedAnnotations();
        setAdminMessage("Annotation publiée comme proposition de relecture.");
      } else {
        setAdminError("Publication refusée ou annotation déjà traitée.");
      }
    } catch (rpcError) {
      setAdminError(formatSupabaseError("Impossible de publier cette annotation", rpcError));
    }

    setPublishingAnnotationId(null);
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
          {annotations.length > 0 ? (
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

        <section className="border-t border-paper-border pt-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Relecture administrateur
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Publier une annotation la rend visible comme proposition de
            relecture. Cela ne valide pas une transcription.
          </p>

          <form className="mt-4 flex flex-col gap-3" onSubmit={handleLoadPendingAnnotations}>
            <label
              className="font-mono text-xs font-semibold uppercase tracking-widest text-warm"
              htmlFor="annotation-admin-password"
            >
              Mot de passe
            </label>
            <input
              className="border border-paper-border bg-background px-3 py-2 text-sm text-foreground"
              id="annotation-admin-password"
              onChange={(event) => setAdminPassword(event.target.value)}
              type="password"
              value={adminPassword}
            />
            <button
              className="self-start border border-paper-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-warm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAdminLoading}
              type="submit"
            >
              {isAdminLoading ? "Verification..." : "Voir les annotations en attente"}
            </button>
          </form>

          {adminError && <p className="mt-3 text-sm text-red-700">{adminError}</p>}
          {adminMessage && (
            <p className="mt-3 text-sm font-medium text-foreground">
              {adminMessage}
            </p>
          )}

          {pendingAnnotations.length > 0 && (
            <div className="mt-4 space-y-3">
              {pendingAnnotations.map((annotation) => (
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
                  <button
                    className="mt-4 border border-warm px-3 py-2 text-sm font-semibold text-warm transition hover:bg-warm hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={publishingAnnotationId === annotation.id}
                    onClick={() => handlePublishAnnotation(annotation.id)}
                    type="button"
                  >
                    {publishingAnnotationId === annotation.id
                      ? "Publication..."
                      : "Publier cette annotation"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
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

function isMissingRpcError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.message?.toLowerCase().includes("could not find the function") === true
  );
}

function formatSupabaseError(context: string, error: unknown): string {
  if (isFailedFetchError(error)) {
    return `${context}. Connexion Supabase impossible (Failed to fetch). Vérifiez NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY dans Vercel, et la connectivité du projet Supabase.`;
  }

  if (isSupabaseError(error) && error.message) {
    return `${context}. ${error.message}`;
  }

  if (error instanceof Error && error.message) {
    return `${context}. ${error.message}`;
  }

  return `${context}. Erreur Supabase inconnue.`;
}

function isFailedFetchError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("failed to fetch")
  );
}

function isSupabaseError(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}
