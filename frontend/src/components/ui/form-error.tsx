import { cn } from "@/lib/utils";

const formErrorClassName =
  "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive";

export function FormError({
  children,
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p role="alert" className={cn(formErrorClassName, className)} {...props}>
      {children}
    </p>
  );
}
