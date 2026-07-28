import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewPreview } from "@/components/landing/review-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid fade-mask-b opacity-60" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[36rem] w-[72rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:grid-cols-2 lg:pt-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <Star key={i} className="size-3 fill-primary text-primary" />
              ))}
            </span>
            Built for local businesses
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
            Collect More Google Reviews with AI
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Customers scan a QR code, answer a few questions, and receive an
            AI-generated review draft they can edit before posting to Google.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="group h-12 px-6 text-base">
              <Link href="/setup">
                Get Started
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <p>No app for customers to install</p>
            <p className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <p>Reviews stay 100% editable</p>
          </div>
        </div>

        <ReviewPreview />
      </div>
    </section>
  );
}
