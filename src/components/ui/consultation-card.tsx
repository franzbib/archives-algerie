import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ConsultationCardProps {
  title: string;
  subtitle?: string;
  code?: string;
  description?: string;
  href: string;
  footer?: ReactNode;
  tags?: string[];
}

export function ConsultationCard({ title, subtitle, code, description, href, footer, tags }: ConsultationCardProps) {
  return (
    <div className="group relative flex flex-col justify-between border-2 border-paper-border bg-paper p-6 transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#e4e2db] hover:border-warm">
      {/* Simulation de reliure ou de fiche perforée sur la gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-dashed border-paper-border/60 bg-sepia/10 flex flex-col items-center justify-evenly py-4">
        <div className="h-2 w-2 rounded-full border border-paper-border bg-background"></div>
        <div className="h-2 w-2 rounded-full border border-paper-border bg-background"></div>
        <div className="h-2 w-2 rounded-full border border-paper-border bg-background"></div>
      </div>
      
      <div className="pl-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {code && (
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-warm">
                {code}
              </p>
            )}
            <h3 className="mt-2 font-serif text-xl font-medium text-foreground group-hover:text-black">
              <Link href={href} className="before:absolute before:inset-0">
                {title}
              </Link>
            </h3>
            {subtitle && <p className="mt-1 text-sm text-warm">{subtitle}</p>}
          </div>
          <ArrowRight className="h-5 w-5 text-warm opacity-0 transition-all group-hover:-translate-x-1 group-hover:opacity-100" />
        </div>
        
        {description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">
            {description}
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="border border-paper-border/60 bg-sepia px-2 py-0.5 font-mono text-[10px] uppercase text-warm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {footer && (
        <div className="ml-6 mt-6 border-t border-dashed border-paper-border pt-4 text-xs text-warm">
          {footer}
        </div>
      )}
    </div>
  );
}
