import { cn } from "@/lib/utils";
import { EMPTY_DISPLAY } from "@/constants";

export interface DetailRowProps {
  label: string;
  value: string | null | undefined;
  className?: string;
  empty?: boolean;
}

export function DetailRow({ label, value, className, empty }: DetailRowProps) {
  const display =
    value != null && String(value).trim() !== "" ? value : EMPTY_DISPLAY;
  const isEmpty = empty ?? display === EMPTY_DISPLAY;
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 py-2",
        isEmpty && "opacity-70",
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{display}</span>
    </div>
  );
}
