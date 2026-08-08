"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Store,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  ArrowLeft,
  Loader2,
  PenLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { ThemeToggle } from "@/components/theme-toggle";

import { getBusiness } from "@/lib/business-store";
import { copyToClipboard } from "@/lib/clipboard";
import { LANGUAGES, type Business, type Language } from "@/lib/types";

type Step = "collect" | "result";

// Ratings this high or above get an instant AI draft with no extra
// questions. Anything below asks the customer to write it themselves.
const AI_ELIGIBLE_MIN_RATING = 4;

export default function ReviewPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [business, setBusiness] = React.useState<Business | null | undefined>(undefined);

  const [step, setStep] = React.useState<Step>("collect");
  const [rating, setRating] = React.useState(0);
  const [language, setLanguage] = React.useState<Language>("English");
  const [comments, setComments] = React.useState("");
  const [manualDraft, setManualDraft] = React.useState("");

  const [generating, setGenerating] = React.useState(false);
  const [review, setReview] = React.useState("");
  const [isManual, setIsManual] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);

  // Business profiles now live on the server (any device can look them
  // up), so we fetch on mount / when the route param changes.
  React.useEffect(() => {
    let active = true;
    // Reset to the loading state when businessId changes so a stale
    // business from the previous ID isn't shown while the new fetch runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusiness(undefined);
    getBusiness(businessId)
      .then((result) => {
        if (active) setBusiness(result);
      })
      .catch(() => {
        if (active) setBusiness(null);
      });
    return () => {
      active = false;
    };
  }, [businessId]);

  const isAiEligible = rating >= AI_ELIGIBLE_MIN_RATING;
  const isManualFlow = rating > 0 && rating < AI_ELIGIBLE_MIN_RATING;

  async function generateReview() {
    if (!business || generating) return;

    // Cancel any in-flight request before starting a new one so overlapping
    // clicks (e.g. a fast double click) can't race and corrupt a request.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          rating,
          liked: "",
          comments: comments.trim(),
          language,
          businessId: business.id, // Pass business ID for trial verification checks
          business: {
            name: business.name,
            type: business.type,
            description: business.description,
            keywords: business.keywords,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate review");
      }

      setReview(data.review);
      setIsManual(false);
      setStep("result");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  function handleGenerateClick() {
    if (rating === 0) {
      toast.error("Please choose a star rating");
      return;
    }
    generateReview();
  }

  function handleContinueManual() {
    if (!manualDraft.trim()) {
      toast.error("Please write a few words about your experience");
      return;
    }
    setReview(manualDraft.trim());
    setIsManual(true);
    setStep("result");
  }

  async function handleRegenerate() {
    await generateReview();
  }

  async function handleCopy() {
    const success = await copyToClipboard(review);
    if (success) {
      toast.success("Review copied to clipboard");
    } else {
      toast.error("Couldn't copy automatically — select and copy the text above");
    }
  }

  function handleContinueToGoogle() {
    if (!business) return;

    // Automatically copy review to clipboard in case they forgot
    copyToClipboard(review).then((success) => {
      if (success) {
        toast.success("Review automatically copied to clipboard!");
      }
    });

    window.open(business.googleReviewUrl, "_blank", "noopener,noreferrer");
  }

  function handleEditAnswers() {
    setStep("collect");
    setError(null);
  }

  if (business === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (business === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm rounded-2xl border-border shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="font-medium">We couldn&apos;t find this review page</p>
            <p className="text-sm text-muted-foreground">
              This link doesn&apos;t match a business on this server. Please
              double-check the QR code or link and try again.
            </p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Back home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <span className="font-display">ReviewPilot</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {business.logoDataUrl ? (
                <Image
                  src={business.logoDataUrl}
                  alt={`${business.name} logo`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Store className="size-6 text-muted-foreground" />
              )}
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
              {business.name}
            </h1>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              We&apos;d love your feedback. Rate your experience to get started.
            </p>
          </div>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {step === "collect" ? (
                  <motion.div
                    key="collect"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-7"
                  >
                    <div>
                      <Label className="mb-3 block text-center text-sm font-medium">
                        Overall rating
                      </Label>
                      <StarRating value={rating} onChange={setRating} />
                    </div>

                    <AnimatePresence mode="wait">
                      {isAiEligible && (
                        <motion.div
                          key="ai-flow"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-7 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="language">Preferred language</Label>
                            <Select
                              value={language}
                              onValueChange={(v) => setLanguage(v as Language)}
                            >
                              <SelectTrigger id="language" className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LANGUAGES.map((l) => (
                                  <SelectItem key={l} value={l}>
                                    {l}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="comments">What did you like? (Optional)</Label>
                            <Textarea
                              id="comments"
                              rows={3}
                              placeholder="E.g., Great service, friendly staff, delicious food..."
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                            />
                          </div>

                          <Button
                            type="button"
                            size="lg"
                            className="w-full"
                            disabled={generating}
                            onClick={handleGenerateClick}
                          >
                            {generating ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Sparkles className="size-4" />
                            )}
                            {generating ? "Generating your review…" : "Generate Review"}
                          </Button>
                          {error && (
                            <p className="text-center text-xs text-destructive">{error}</p>
                          )}
                        </motion.div>
                      )}

                      {isManualFlow && (
                        <motion.div
                          key="manual-flow"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="manual" className="flex items-center gap-1.5">
                              <PenLine className="size-3.5" />
                              Tell us what happened, in your own words
                            </Label>
                            <Textarea
                              id="manual"
                              rows={5}
                              placeholder="We're sorry your experience wasn't perfect. Please share what happened so we can improve…"
                              value={manualDraft}
                              onChange={(e) => setManualDraft(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              For ratings under {AI_ELIGIBLE_MIN_RATING} stars, we ask you to
                              write the review yourself rather than generating one.
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="lg"
                            className="w-full"
                            onClick={handleContinueManual}
                          >
                            Continue
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      {isManual ? (
                        <>
                          <PenLine className="size-4" />
                          Your review
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Your AI-drafted review
                        </>
                      )}
                    </div>

                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={7}
                      className="resize-none text-[15px] leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Feel free to edit this before posting — it&apos;s yours.
                    </p>

                    <div className={isManual ? "" : "grid grid-cols-2 gap-2"}>
                      {!isManual && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRegenerate}
                          disabled={generating}
                        >
                          {generating ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          Regenerate
                        </Button>
                      )}
                      <Button type="button" variant="outline" onClick={handleCopy}>
                        <Copy className="size-4" />
                        Copy Review
                      </Button>
                    </div>

                    <Button size="lg" className="w-full" onClick={handleContinueToGoogle}>
                      Continue to Google Review
                      <ExternalLink className="size-4" />
                    </Button>

                    <button
                      type="button"
                      onClick={handleEditAnswers}
                      className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="size-3" />
                      Edit my answers
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
