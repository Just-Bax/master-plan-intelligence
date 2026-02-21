import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

export interface AuthCardProps {
  title: string;
  subtitle: string;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  loading: boolean;
  bottomText: string;
  bottomLinkTo: string;
  bottomLinkLabel: string;
  children: React.ReactNode;
}

export function AuthCard({
  title,
  subtitle,
  error,
  onSubmit,
  submitLabel,
  loading,
  bottomText,
  bottomLinkTo,
  bottomLinkLabel,
  children,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <FormError>{error}</FormError>}
            {children}
            <Button type="submit" className="w-full" disabled={loading}>
              {submitLabel}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {bottomText}{" "}
            <Link
              to={bottomLinkTo}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {bottomLinkLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
