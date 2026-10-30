import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "./PageHeader";

interface FormPageProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  back: string;
  children: ReactNode;
}

/** Gabarit des écrans de saisie : en-tête, retour, carte de formulaire chargée en flux. */
export function FormPage({ eyebrow, title, subtitle, back, children }: FormPageProps) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        aside={
          <Link
            href={back}
            aria-label="Retour"
            className="grid size-11 place-items-center rounded-xl border border-line-strong bg-night-850 text-ink-soft hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
        }
      />
      <Card>
        <Suspense fallback={<PageSkeleton cards={1} />}>{children}</Suspense>
      </Card>
    </>
  );
}
