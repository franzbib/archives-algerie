import historicalContextData from "@/data/historical-context.json";

export type HistoricalContextPeriod = {
  id: string;
  title: string;
  periodLabel: string;
  dateStart: number | null;
  dateEnd: number | null;
  category: string[];
  summary: string;
  keywords: string[];
  methodologicalWarning: string;
  sourceNotes: string[];
};

export type HistoricalContextMatch = {
  period: HistoricalContextPeriod;
  matchedYear: number;
  matchReason: string;
  confidence: "low" | "medium";
};

const historicalContextPeriods =
  historicalContextData as HistoricalContextPeriod[];

export function getHistoricalContextPeriods(): HistoricalContextPeriod[] {
  return historicalContextPeriods;
}

export function extractPlausibleYear(input: string | undefined | null): number | null {
  if (!input) {
    return null;
  }

  const matches = input.match(/\b(1[5-9]\d{2}|20\d{2}|2100)\b/g);
  if (!matches) {
    return null;
  }

  const year = Number.parseInt(matches[0], 10);
  return Number.isFinite(year) ? year : null;
}

export function matchHistoricalPeriodByYear(
  year: number,
): HistoricalContextPeriod | null {
  return (
    historicalContextPeriods.find((period) => {
      const afterStart = period.dateStart === null || year >= period.dateStart;
      const beforeEnd = period.dateEnd === null || year <= period.dateEnd;
      return afterStart && beforeEnd;
    }) ?? null
  );
}

export function getHistoricalContextForDateLabel(
  dateLabel: string | undefined | null,
): HistoricalContextMatch | null {
  const year = extractPlausibleYear(dateLabel);
  if (year === null) {
    return null;
  }

  const period = matchHistoricalPeriodByYear(year);
  if (!period) {
    return null;
  }

  return {
    period,
    matchedYear: year,
    matchReason: `Une année située en ${year} semble associée à ce document.`,
    confidence: "medium",
  };
}
