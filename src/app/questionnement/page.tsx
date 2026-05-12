import Link from "next/link";
import { ArrowLeft, Search, Sparkles } from "lucide-react";

export default function QuestionnementPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-paper-border bg-paper/50">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>

      <section className="flex flex-1 flex-col items-center px-6 pb-12 pt-24">
        <div className="w-full max-w-2xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-12 w-12 items-center justify-center border border-paper-border bg-paper shadow-sm">
              <Search className="h-5 w-5 text-warm" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-warm">
              Recherche future
            </p>
            <h1 className="mt-3 font-serif text-3xl font-medium text-foreground md:text-4xl">
              Interroger l&apos;inventaire
            </h1>
            <p className="mt-4 max-w-md text-foreground/70">
              La recherche plein texte et l&apos;analyse semantique seront ajoutees
              apres OCR, normalisation, indexation et embeddings.
            </p>
          </div>

          <div className="relative">
            <input
              className="w-full border-2 border-paper-border bg-paper px-6 py-5 pl-14 font-serif text-lg text-foreground shadow-sm placeholder:text-warm/50"
              disabled
              placeholder="Ex: Cartes administratives de Constantine avant 1920..."
              type="text"
            />
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-warm" />
            <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-1">
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-800">
                Bientot
              </span>
            </div>
          </div>

          <div className="mt-12 border-t border-paper-border pt-8">
            <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-warm">
              Exemples de questions futures
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Example text="Montre-moi les registres d'etat civil d'Alger" />
              <Example text="Correspondances prefectorales bilingues" />
              <Example text="Documents fragiles necessitant restauration" />
              <Example text="Quels fonds couvrent la periode 1850-1860 ?" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Example({ text }: { text: string }) {
  return (
    <div className="border border-paper-border bg-paper/50 px-4 py-3 text-sm text-foreground/80 opacity-70">
      &quot;{text}&quot;
    </div>
  );
}
