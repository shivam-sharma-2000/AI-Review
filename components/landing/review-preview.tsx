"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const DRAFT =
  "The staff went out of their way to help me pick the right fit. Fast service, clean space, and everything felt genuinely thought through. Would happily come back.";

export function ReviewPreview() {
  const [charCount, setCharCount] = React.useState(0);
  const [phase, setPhase] = React.useState<"rating" | "typing" | "done">("rating");

  React.useEffect(() => {
    let raf: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function run() {
      while (!cancelled) {
        setPhase("rating");
        setCharCount(0);
        await wait(1300);
        if (cancelled) return;
        setPhase("typing");
        for (let i = 0; i <= DRAFT.length; i += 2) {
          if (cancelled) return;
          setCharCount(i);
          await wait(18);
        }
        setCharCount(DRAFT.length);
        setPhase("done");
        await wait(2600);
      }
    }
    function wait(ms: number) {
      return new Promise<void>((resolve) => {
        raf = setTimeout(resolve, ms);
      });
    }
    run();
    return () => {
      cancelled = true;
      clearTimeout(raf);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Ambient glow */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="rounded-[2rem] border border-border bg-card p-2 shadow-2xl shadow-primary/10">
        <div className="rounded-[1.6rem] border border-border/60 bg-gradient-to-b from-muted/60 to-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold font-display">
                MK
              </span>
              <div>
                <p className="text-sm font-medium leading-tight">Maple &amp; Kin Studio</p>
                <p className="text-xs text-muted-foreground">Leave a review</p>
              </div>
            </div>
            <QrCode className="size-4 text-muted-foreground" />
          </div>

          <div className="mb-4 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.span
                key={n}
                animate={{
                  scale: phase === "rating" && n <= 5 ? [0.6, 1.15, 1] : 1,
                }}
                transition={{ delay: phase === "rating" ? n * 0.12 : 0, duration: 0.35 }}
              >
                <Star
                  className={cn(
                    "size-5 transition-colors",
                    n <= 5 ? "fill-primary text-primary" : "fill-transparent text-muted-foreground"
                  )}
                />
              </motion.span>
            ))}
          </div>

          <div className="min-h-[7.5rem] rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed text-foreground/90">
            <AnimatePresence mode="wait">
              {phase === "rating" ? (
                <motion.p
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground"
                >
                  Tap a rating and tell us what you liked…
                </motion.p>
              ) : (
                <motion.p key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {DRAFT.slice(0, charCount)}
                  {phase === "typing" && (
                    <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" />
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-colors",
                phase === "done"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <Sparkles className="size-3.5" />
              {phase === "typing" ? "Generating…" : "Generate Review"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
