import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DriveInventoryBrowser } from "@/components/inventory/drive-inventory-browser";
import type { DriveInventory } from "@/components/inventory/drive-inventory-browser";

const inventoryPath = path.join(
  process.cwd(),
  "data",
  "generated",
  "drive-inventory.pilot.json",
);

export default function DriveInventoryPage() {
  const inventory = readPilotInventory();

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-paper-border bg-paper/60">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <Link
            href="/inventaire"
            className="inline-flex items-center gap-2 text-sm text-warm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au suivi de l&apos;inventaire
          </Link>
        </div>
      </div>

      <section className="border-b border-paper-border bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-warm">
            Inventaire Drive brut
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
            Inventaire Drive pilote
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/80">
            Cette page présente la sortie locale du pilote Drive pour une seule
            collection. Elle ne modifie pas le manifeste principal et ne valide
            aucun document.
          </p>
        </div>
      </section>

      <DriveInventoryBrowser inventory={inventory} />
    </main>
  );
}

function readPilotInventory(): DriveInventory | null {
  if (!existsSync(inventoryPath)) {
    return null;
  }

  const raw = readFileSync(inventoryPath, "utf8");
  return JSON.parse(raw) as DriveInventory;
}
