import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { AnnotationReviewDashboard } from "@/components/annotation-review-dashboard";

export default function AnnotationReviewPage() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Espace de travail
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground">
            Modération des propositions
          </h1>
          <div className="mt-6 flex max-w-3xl items-start gap-3 border border-paper-border bg-background p-4 text-sm leading-6 text-foreground/80">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-warm" />
            <p>
              Les annotations sont des propositions de relecture. Les publier ne
              transforme pas une annotation en transcription validée.
            </p>
          </div>
        </div>
      </section>

      <AnnotationReviewDashboard />
    </main>
  );
}
