"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseClient, supabaseDiagnostics } from "@/lib/supabaseClient";

const ANNOTATION_TYPE_LABELS = new Map<string, string>([
  ["note", "Note de lecture"],
  ["correction_proposal", "Proposition de correction"],
  ["transcription_proposal", "Proposition de transcription"],
  ["translation_note", "Note de traduction"],
  ["metadata_note", "Note de metadonnees"],
]);

type PendingAnnotation = {
  id: string;
  annotation_type: string;
  author_name: string | null;
  body: string;
  created_at: string;
  lot_id: string;
  review_id: string;
  status: string;
  updated_at: string;
};

export function AnnotationReviewDashboard() {
  const [adminPassword, setAdminPassword] = useState("");
  const [annotations, setAnnotations] = useState<PendingAnnotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [processingAnnotationId, setProcessingAnnotationId] = useState<
    string | null
  >(null);

  async function handleLoadAnnotations(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword) {
      setError("Mot de passe requis.");
      setMessage(null);
      setAnnotations([]);
      return;
    }

    await loadPendingAnnotations(trimmedPassword);
  }

  async function loadPendingAnnotations(trimmedPassword: string) {
    if (!supabaseClient) {
      setError("Les annotations persistantes ne sont pas encore activees sur cette installation.");
      setAnnotations([]);
      return;
    }

    setError(null);
    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error: rpcError } = await supabaseClient.rpc(
        "list_all_pending_document_annotations",
        {
          admin_password: trimmedPassword,
        },
      );

      if (rpcError) {
        if (isMissingRpcError(rpcError)) {
          setError(
            formatSupabaseError(
              "Le module de relecture globale n'est pas encore active dans Supabase",
              rpcError,
            ),
          );
        } else {
          setError(
            formatSupabaseError(
              "Impossible de charger les annotations en attente",
              rpcError,
            ),
          );
        }
        setAnnotations([]);
      } else {
        const rows = (data ?? []) as PendingAnnotation[];
        setAnnotations(rows);
        setMessage(
          rows.length > 0
            ? `${rows.length} annotation(s) en attente.`
            : "Aucune annotation en attente.",
        );
      }
    } catch (rpcError) {
      setError(
        formatSupabaseError(
          "Impossible de charger les annotations en attente",
          rpcError,
        ),
      );
      setAnnotations([]);
    }

    setIsLoading(false);
  }

  async function handlePublishAnnotation(annotationId: string) {
    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword || !supabaseClient) {
      setError("Mot de passe requis.");
      return;
    }

    setError(null);
    setMessage(null);
    setProcessingAnnotationId(annotationId);

    try {
      const { data, error: rpcError } = await supabaseClient.rpc(
        "publish_document_annotation",
        {
          admin_password: trimmedPassword,
          annotation_id: annotationId,
        },
      );

      if (rpcError) {
        setError(
          formatSupabaseError("Impossible de publier cette annotation", rpcError),
        );
      } else if (data === true) {
        setAnnotations((current) =>
          current.filter((annotation) => annotation.id !== annotationId),
        );
        setMessage("Annotation publiee.");
      } else {
        setError("Publication refusee ou annotation deja traitee.");
      }
    } catch (rpcError) {
      setError(
        formatSupabaseError("Impossible de publier cette annotation", rpcError),
      );
    }

    setProcessingAnnotationId(null);
  }

  async function handleDeleteAnnotation(annotationId: string) {
    const confirmed = window.confirm(
      "Supprimer cette annotation ? Cette action est irreversible.",
    );
    if (!confirmed) {
      return;
    }

    const trimmedPassword = adminPassword.trim();
    if (!trimmedPassword || !supabaseClient) {
      setError("Mot de passe requis.");
      return;
    }

    setError(null);
    setMessage(null);
    setProcessingAnnotationId(annotationId);

    try {
      const { data, error: rpcError } = await supabaseClient.rpc(
        "delete_document_annotation",
        {
          admin_password: trimmedPassword,
          annotation_id: annotationId,
        },
      );

      if (rpcError) {
        setError(
          formatSupabaseError("Impossible de supprimer cette annotation", rpcError),
        );
      } else if (data === true) {
        setAnnotations((current) =>
          current.filter((annotation) => annotation.id !== annotationId),
        );
        setMessage("Annotation supprimee.");
      } else {
        setError("Suppression refusee ou annotation deja traitee.");
      }
    } catch (rpcError) {
      setError(
        formatSupabaseError("Impossible de supprimer cette annotation", rpcError),
      );
    }

    setProcessingAnnotationId(null);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.35fr)_minmax(0,0.65fr)]">
        <aside className="border border-paper-border bg-paper p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Acces de relecture
          </p>
          <form className="mt-4 space-y-4" onSubmit={handleLoadAnnotations}>
            <div>
              <label
                className="font-mono text-xs font-semibold uppercase tracking-widest text-warm"
                htmlFor="global-annotation-review-password"
              >
                Mot de passe
              </label>
              <input
                className="mt-2 w-full border border-paper-border bg-background px-3 py-2 text-sm text-foreground"
                id="global-annotation-review-password"
                onChange={(event) => {
                  setAdminPassword(event.target.value);
                  setAnnotations([]);
                  setMessage(null);
                  setError(null);
                }}
                type="password"
                value={adminPassword}
              />
            </div>
            <button
              className="border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Chargement..." : "Charger les annotations"}
            </button>
          </form>

          {error && (
            <div className="mt-4">
              <p className="text-sm text-red-700">{error}</p>
              <SupabaseDiagnosticDetails
                technicalMessage={getShortTechnicalMessage(error)}
              />
            </div>
          )}
          {message && (
            <p className="mt-4 text-sm font-medium text-foreground">{message}</p>
          )}
          {!supabaseClient && <SupabaseDiagnosticDetails />}
        </aside>

        <div className="space-y-4">
          {annotations.length > 0 ? (
            annotations.map((annotation) => (
              <article
                className="border border-paper-border bg-paper p-5"
                key={annotation.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-paper-border pb-4">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
                      {ANNOTATION_TYPE_LABELS.get(annotation.annotation_type) ??
                        annotation.annotation_type}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                      {annotation.lot_id} / {annotation.review_id}
                    </h2>
                  </div>
                  <Link
                    className="text-sm font-medium text-warm underline decoration-paper-border underline-offset-4 hover:text-foreground"
                    href={`/lots/${annotation.lot_id}/${annotation.review_id}`}
                  >
                    Ouvrir le document
                  </Link>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <MetaItem label="LotId" value={annotation.lot_id} />
                  <MetaItem label="ReviewId" value={annotation.review_id} />
                  <MetaItem
                    label="Auteur"
                    value={annotation.author_name ?? "Non renseigne"}
                  />
                  <MetaItem label="Date" value={formatAnnotationDate(annotation.created_at)} />
                  <MetaItem label="Statut" value={annotation.status} />
                </dl>

                <div className="mt-5 whitespace-pre-wrap border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/85">
                  {annotation.body}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="border border-warm px-3 py-2 text-sm font-semibold text-warm transition hover:bg-warm hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={processingAnnotationId === annotation.id}
                    onClick={() => handlePublishAnnotation(annotation.id)}
                    type="button"
                  >
                    {processingAnnotationId === annotation.id
                      ? "Traitement..."
                      : "Publier"}
                  </button>
                  <button
                    className="border border-paper-border px-3 py-2 text-sm font-semibold text-foreground/70 transition hover:border-red-700 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={processingAnnotationId === annotation.id}
                    onClick={() => handleDeleteAnnotation(annotation.id)}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="border border-paper-border bg-paper p-6 text-sm leading-6 text-foreground/70">
              Saisir le mot de passe pour afficher les annotations en attente.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SupabaseDiagnosticDetails({
  technicalMessage,
}: {
  technicalMessage?: string | null;
}) {
  return (
    <dl className="mt-3 grid gap-1 border border-paper-border bg-background p-3 text-xs leading-5 text-foreground/70">
      <div>
        <dt className="inline font-semibold">Supabase configure : </dt>
        <dd className="inline">
          {supabaseDiagnostics.configured ? "oui" : "non"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Domaine Supabase detecte : </dt>
        <dd className="inline">
          {supabaseDiagnostics.hostname ?? "non detecte"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">URL invalide : </dt>
        <dd className="inline">
          {supabaseDiagnostics.invalidUrl ? "oui" : "non"}
        </dd>
      </div>
      <div>
        <dt className="inline font-semibold">Message technique court : </dt>
        <dd className="inline">{technicalMessage ?? "aucun"}</dd>
      </div>
    </dl>
  );
}

function formatAnnotationDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSupabaseError(context: string, error: unknown): string {
  if (isFailedFetchError(error)) {
    return `${context}. Connexion Supabase impossible (Failed to fetch). Verifiez les variables Vercel et la connectivite du projet Supabase.`;
  }

  if (isSupabaseError(error) && error.message) {
    return `${context}. ${formatSupabaseTechnicalDetails(error)}`;
  }

  if (error instanceof Error && error.message) {
    return `${context}. ${error.message}`;
  }

  return `${context}. Erreur Supabase inconnue.`;
}

function formatSupabaseTechnicalDetails(error: {
  code?: string;
  message: string;
}): string {
  return error.code ? `${error.code}: ${error.message}` : error.message;
}

function getShortTechnicalMessage(message: string): string {
  if (message.toLowerCase().includes("failed to fetch")) {
    return "TypeError: Failed to fetch";
  }

  const [, technicalMessage] = message.split(". ");
  return technicalMessage?.trim() || message;
}

function isFailedFetchError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("failed to fetch")
  );
}

function isMissingRpcError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.message?.toLowerCase().includes("could not find the function") === true
  );
}

function isSupabaseError(
  error: unknown,
): error is { code?: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}
