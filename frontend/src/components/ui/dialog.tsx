import * as React from "react";

import { cn } from "@/lib/utils";

function Dialog({
  open,
  onOpenChange,
  children,
  className,
  ...props
}: React.ComponentProps<"dialog"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);
  const handleClose = () => onOpenChange(false);
  return (
    <dialog
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 max-h-[100dvh] w-full max-w-lg border border-border bg-background p-0 text-foreground shadow-lg outline-none backdrop:bg-black/50",
        "open:animate-in open:fade-in-0 open:zoom-in-95",
        "data-[closing]:animate-out data-[closing]:fade-out-0 data-[closing]:zoom-out-95",
        "m-auto rounded-xl",
        className
      )}
      onCancel={handleClose}
      onClick={(e) => {
        if (e.target === ref.current) handleClose();
      }}
      {...props}
    >
      {children}
    </dialog>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2 p-4 pb-2", className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 pb-4", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex justify-end gap-2 border-t border-border p-4 pt-2",
        className
      )}
      {...props}
    />
  );
}

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter };
