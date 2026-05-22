import Link from "next/link";
import { ArrowLeft, FolderOpen, Layers, Library, Search } from "lucide-react";

export default function DossiersPage() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Espace de travail
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl font-medium text-foreground">
            Dossiers documentaires
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80 font-serif">
            Constituez des sélections de documents à partir de plusieurs lots pour préparer une enquête, une relecture thématique ou une chronologie. Un espace personnel pour regrouper et annoter vos recherches.
          </p>
          
          <div className="mt-8 inline-flex items-center gap-2 border border-warm/30 bg-warm/5 px-4 py-3 text-sm font-medium text-warm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-warm"></span>
            </span>
            Fonctionnalité en cours de préparation (Prototype)
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-8">
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Cas d&apos;usage envisagés
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="border border-paper-border bg-paper p-5 transition-colors hover:border-warm/30">
                <FolderOpen className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Enquête thématique
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/75">
                  Regroupez toutes les pages mentionnant une personnalité (ex: Amirouche) ou un lieu (ex: Boghari) réparties dans différents lots d&apos;archives.
                </p>
              </article>

              <article className="border border-paper-border bg-paper p-5 transition-colors hover:border-warm/30">
                <Library className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Carnet de relecture
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/75">
                  Rassemblez les documents dont l&apos;OCR ou la lecture assistée est difficile pour organiser une session de validation humaine ciblée.
                </p>
              </article>

              <article className="border border-paper-border bg-paper p-5 transition-colors hover:border-warm/30">
                <Layers className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Récit pédagogique
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/75">
                  Sélectionnez les pièces maîtresses d&apos;un événement pour préparer un support d&apos;exposition ou de transmission familiale, accompagné de vos notes.
                </p>
              </article>

              <article className="border border-paper-border bg-paper p-5 transition-colors hover:border-warm/30">
                <Search className="h-6 w-6 text-warm mb-4" />
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Recherche IA ciblée (Futur)
                </h3>
                <p className="mt-2 text-sm leading-6 text-foreground/75">
                  À terme, les dossiers permettront de borner strictement l&apos;assistance IA (Gemini) aux seuls documents de votre sélection, pour éviter les sur-interprétations.
                </p>
              </article>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="border border-paper-border bg-paper p-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-warm">
                Méthodologie
              </p>
              <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
                Cadre de travail
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/80">
                <li className="flex gap-2">
                  <span className="text-warm mt-0.5">•</span>
                  <span>Un dossier documentaire n&apos;est pas un lot d&apos;archives officiel, c&apos;est une sélection intellectuelle.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warm mt-0.5">•</span>
                  <span>L&apos;image source reste systématiquement la référence absolue de tout travail.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warm mt-0.5">•</span>
                  <span>Vos notes de dossier personnelles ne constitueront pas une validation historique formelle.</span>
                </li>
              </ul>
            </div>

            <div className="border border-paper-border bg-background p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground/50">
                Prochaines étapes de développement
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between border-b border-paper-border pb-2 text-sm">
                  <span className="text-foreground/70">Cadrage conceptuel</span>
                  <span className="font-mono text-xs text-warm">FAIT</span>
                </div>
                <div className="flex items-center justify-between border-b border-paper-border py-2 text-sm">
                  <span className="text-foreground/70">Structure base de données</span>
                  <span className="font-mono text-xs text-foreground/40">À FAIRE</span>
                </div>
                <div className="flex items-center justify-between border-b border-paper-border py-2 text-sm">
                  <span className="text-foreground/70">Boutons &quot;Ajouter&quot; sur les pages</span>
                  <span className="font-mono text-xs text-foreground/40">À FAIRE</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="text-foreground/70">Interface de gestion des dossiers</span>
                  <span className="font-mono text-xs text-foreground/40">À FAIRE</span>
                </div>
              </div>
            </div>
          </aside>
          
        </div>
      </section>
    </main>
  );
}
