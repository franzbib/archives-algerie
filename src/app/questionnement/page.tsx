import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Quote,
  Search,
  ShieldCheck,
} from "lucide-react";

const exampleQuestions = [
  "Quels documents mentionnent Boghari entre 1958 et 1960 ?",
  "Quels noms propres apparaissent dans les documents FLN recuperes ?",
  "Quels dossiers concernent la frontiere marocaine ?",
  "Quels documents sont prets pour OCR ?",
];

export default function QuestionnementPage() {
  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/50">
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
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-warm">
            Recherche en langage naturel - preparation
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl font-medium text-foreground md:text-5xl">
            Preparer une interrogation sourcee des archives, sans masquer les
            limites du corpus.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page decrit la future recherche en langage naturel. Elle n&apos;est
            pas active en V0: aucune API IA n&apos;est appelee, aucun resultat n&apos;est
            genere, et les exemples ci-dessous servent seulement a definir le
            format attendu.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<Search className="h-5 w-5" />}
              title="Ce que permettra la recherche"
              text="Formuler une question ordinaire et retrouver des passages OCR relies a une collection, une cote, un document et une page."
            />
            <InfoCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Pourquoi elle attendra"
              text="Le corpus doit d'abord etre OCRise, nettoye, decoupe en passages, indexe et relie a des sources verifiables."
            />
            <InfoCard
              icon={<FileText className="h-5 w-5" />}
              title="Conditions necessaires"
              text="OCR brut conserve, texte nettoye separe, chunks courts, index de recherche, metadonnees et liens stables vers les documents."
            />
            <InfoCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Garanties attendues"
              text="Citations obligatoires, niveau de certitude, limites explicites et refus de conclure quand les sources ne suffisent pas."
            />
          </section>

          <section className="border border-paper-border bg-paper p-6">
            <div className="mb-5">
              <p className="font-mono text-xs uppercase tracking-widest text-warm">
                Maquette non fonctionnelle
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                Poser une question
              </h2>
            </div>

            <div className="relative">
              <input
                aria-label="Champ de question a venir"
                className="w-full border-2 border-paper-border bg-background px-5 py-4 pr-28 font-serif text-lg text-foreground placeholder:text-warm/50"
                disabled
                placeholder="Ex: Quels dossiers concernent la frontiere marocaine ?"
                type="text"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-800">
                A venir
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-warm">
              Le champ est volontairement desactive. La recherche ne sera activee
              qu&apos;apres rattachement des textes OCR a leurs sources.
            </p>
          </section>

          <section className="border border-paper-border bg-paper p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-warm">
              Exemple de format attendu
            </p>
            <div className="mt-4 border border-dashed border-paper-border bg-background p-5">
              <div className="mb-3 flex items-center gap-2 text-warm">
                <Quote className="h-4 w-4" />
                <p className="font-mono text-xs uppercase tracking-widest">
                  Exemple fictif - pas un resultat reel
                </p>
              </div>
              <p className="text-sm leading-6 text-foreground/80">
                Les documents pertinents seraient presentes avec une reponse
                courte, suivie de citations: collection, cote, document, page,
                extrait OCR et niveau de certitude. Si les sources sont
                insuffisantes, la reponse devrait le signaler clairement.
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <SourceLine
                  label="Citation attendue"
                  text="SHD 1H4382 D1 / Synthese mensuelle de renseignements / page 1"
                />
                <SourceLine label="Certitude" text="Moyenne, a confirmer par lecture de l'image source" />
                <SourceLine
                  label="Limite"
                  text="Aucune conclusion sans OCR relu ou document image consultable"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit border border-paper-border bg-paper p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-warm">
            Questions possibles
          </p>
          <div className="mt-4 space-y-3">
            {exampleQuestions.map((question) => (
              <div
                className="border border-paper-border bg-background px-4 py-3 text-sm leading-6 text-foreground/80"
                key={question}
              >
                &quot;{question}&quot;
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  text,
  title,
}: {
  icon: React.ReactNode;
  text: string;
  title: string;
}) {
  return (
    <article className="border border-paper-border bg-paper p-5">
      <div className="flex items-start gap-3">
        <div className="text-warm">{icon}</div>
        <div>
          <h2 className="font-serif text-xl font-medium text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/75">{text}</p>
        </div>
      </div>
    </article>
  );
}

function SourceLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-t border-paper-border pt-3 first:border-t-0 first:pt-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-warm">
        {label}
      </p>
      <p className="mt-1 text-foreground/80">{text}</p>
    </div>
  );
}
