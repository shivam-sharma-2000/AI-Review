import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Ready to turn happy customers into reviews?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Set up your business page in under two minutes and get a QR code
          you can start sharing today.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="group h-12 px-6 text-base">
            <Link href="/setup">
              Get Started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
