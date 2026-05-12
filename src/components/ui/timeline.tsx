import { ReactNode } from "react";

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative pl-6 before:absolute before:bottom-0 before:left-[11px] before:top-2 before:w-[1px] before:bg-paper-border">
      <div className="flex flex-col gap-8">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <div className="absolute -left-6 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-warm bg-paper" />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-semibold text-warm">
                {item.date}
              </span>
              <h4 className="font-serif text-lg text-foreground">{item.title}</h4>
              {item.description && (
                <p className="text-sm text-foreground/70">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
