import type { HumanReviewStatus } from "@/lib/humanReviews";

export type SupabaseConfig = {
  anonKey: string;
  url: string;
};

export type PersistedHumanReviewNote = {
  id: string;
  lotId: string;
  reviewId: string;
  status: HumanReviewStatus;
  proposedTranscription: string | null;
  notes: string | null;
  properNamesNotes: string | null;
  placesNotes: string | null;
  datesNotes: string | null;
  acronymsNotes: string | null;
  reviewedBy: string | null;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateHumanReviewNoteInput = {
  lotId: string;
  reviewId: string;
  status: HumanReviewStatus;
  proposedTranscription?: string | null;
  notes?: string | null;
  properNamesNotes?: string | null;
  placesNotes?: string | null;
  datesNotes?: string | null;
  acronymsNotes?: string | null;
  reviewedBy?: string | null;
  validated?: boolean;
};

export type HumanReviewPersistenceResult<T> =
  | {
      data: T;
      enabled: true;
      error: null;
    }
  | {
      data: null;
      enabled: false;
      error: string;
    }
  | {
      data: null;
      enabled: true;
      error: string;
    };

type SupabaseHumanReviewRow = {
  id: string;
  lot_id: string;
  review_id: string;
  status: HumanReviewStatus;
  proposed_transcription: string | null;
  notes: string | null;
  proper_names_notes: string | null;
  places_notes: string | null;
  dates_notes: string | null;
  acronyms_notes: string | null;
  reviewed_by: string | null;
  validated: boolean;
  created_at: string;
  updated_at: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return {
    anonKey,
    url: url.replace(/\/$/, ""),
  };
}

export function isHumanReviewPersistenceEnabled(): boolean {
  return getSupabaseConfig() !== null;
}

export async function getHumanReviewNotes(
  lotId: string,
  reviewId: string,
): Promise<HumanReviewPersistenceResult<PersistedHumanReviewNote[]>> {
  const config = getSupabaseConfig();
  if (!config) {
    return disabledResult();
  }

  const query = new URLSearchParams({
    lot_id: `eq.${lotId}`,
    order: "created_at.desc",
    review_id: `eq.${reviewId}`,
    select: "*",
  });

  const response = await fetch(
    `${config.url}/rest/v1/human_review_notes?${query.toString()}`,
    {
      headers: getSupabaseHeaders(config),
      method: "GET",
    },
  );

  if (!response.ok) {
    return enabledErrorResult(await formatSupabaseError(response));
  }

  const rows = (await response.json()) as SupabaseHumanReviewRow[];
  return {
    data: rows.map(toPersistedHumanReviewNote),
    enabled: true,
    error: null,
  };
}

export async function createHumanReviewNote(
  input: CreateHumanReviewNoteInput,
): Promise<HumanReviewPersistenceResult<PersistedHumanReviewNote>> {
  const config = getSupabaseConfig();
  if (!config) {
    return disabledResult();
  }

  const response = await fetch(`${config.url}/rest/v1/human_review_notes`, {
    body: JSON.stringify(toSupabaseInsertPayload(input)),
    headers: {
      ...getSupabaseHeaders(config),
      "content-type": "application/json",
      prefer: "return=representation",
    },
    method: "POST",
  });

  if (!response.ok) {
    return enabledErrorResult(await formatSupabaseError(response));
  }

  const rows = (await response.json()) as SupabaseHumanReviewRow[];
  const firstRow = rows[0];
  if (!firstRow) {
    return enabledErrorResult("Supabase n'a retourne aucune note creee.");
  }

  return {
    data: toPersistedHumanReviewNote(firstRow),
    enabled: true,
    error: null,
  };
}

function getSupabaseHeaders(config: SupabaseConfig): Record<string, string> {
  return {
    apikey: config.anonKey,
    authorization: `Bearer ${config.anonKey}`,
  };
}

function toSupabaseInsertPayload(input: CreateHumanReviewNoteInput) {
  return {
    lot_id: input.lotId,
    review_id: input.reviewId,
    status: input.status,
    proposed_transcription: input.proposedTranscription ?? null,
    notes: input.notes ?? null,
    proper_names_notes: input.properNamesNotes ?? null,
    places_notes: input.placesNotes ?? null,
    dates_notes: input.datesNotes ?? null,
    acronyms_notes: input.acronymsNotes ?? null,
    reviewed_by: input.reviewedBy ?? null,
    validated: input.validated ?? false,
  };
}

function toPersistedHumanReviewNote(
  row: SupabaseHumanReviewRow,
): PersistedHumanReviewNote {
  return {
    id: row.id,
    lotId: row.lot_id,
    reviewId: row.review_id,
    status: row.status,
    proposedTranscription: row.proposed_transcription,
    notes: row.notes,
    properNamesNotes: row.proper_names_notes,
    placesNotes: row.places_notes,
    datesNotes: row.dates_notes,
    acronymsNotes: row.acronyms_notes,
    reviewedBy: row.reviewed_by,
    validated: row.validated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function disabledResult<T>(): HumanReviewPersistenceResult<T> {
  return {
    data: null,
    enabled: false,
    error:
      "Persistance Supabase des notes de relecture desactivee: variables d'environnement absentes.",
  };
}

function enabledErrorResult<T>(error: string): HumanReviewPersistenceResult<T> {
  return {
    data: null,
    enabled: true,
    error,
  };
}

async function formatSupabaseError(response: Response): Promise<string> {
  const body = await response.text();
  return `Erreur Supabase ${response.status}: ${body}`;
}
