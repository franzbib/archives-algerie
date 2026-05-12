import { Filter } from "lucide-react";

export function SidebarFilters() {
  return (
    <div className="flex flex-col gap-6 rounded border border-paper-border bg-paper p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-paper-border pb-3">
        <Filter className="h-4 w-4 text-warm" />
        <h3 className="font-serif text-lg font-medium">Filtres</h3>
      </div>
      
      <div className="flex flex-col gap-5">
        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-wide text-warm">Période</h4>
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-paper-border text-foreground focus:ring-foreground accent-foreground" />
              <span className="group-hover:text-black">Avant 1900</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-paper-border text-foreground focus:ring-foreground accent-foreground" />
              <span className="group-hover:text-black">1900 - 1945</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-paper-border text-foreground focus:ring-foreground accent-foreground" />
              <span className="group-hover:text-black">Après 1945</span>
            </label>
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-wide text-warm">Statut</h4>
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-paper-border text-foreground focus:ring-foreground accent-foreground" />
              <span className="group-hover:text-black">Inventorié</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-paper-border text-foreground focus:ring-foreground accent-foreground" />
              <span className="group-hover:text-black">En traitement</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
