"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Building2, ImagePlus, Loader2, Sparkles, X } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { BUSINESS_TYPES } from "@/lib/types";
import { createBusiness } from "@/lib/business-store";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

export default function SetupPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);
  const [address, setAddress] = React.useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [keywordInput, setKeywordInput] = React.useState("");
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function addKeywords(raw: string) {
    const parts = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setKeywords((prev) => Array.from(new Set([...prev, ...parts])).slice(0, 12));
    setKeywordInput("");
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeywords(keywordInput);
    } else if (e.key === "Backspace" && !keywordInput && keywords.length) {
      setKeywords((prev) => prev.slice(0, -1));
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Business name is required.";
    if (!type) next.type = "Select a business type.";
    if (!googleReviewUrl.trim()) {
      next.googleReviewUrl = "Google Review URL is required.";
    } else {
      try {
        new URL(googleReviewUrl.trim());
      } catch {
        next.googleReviewUrl = "Enter a valid URL, including https://";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const business = await createBusiness({
        name: name.trim(),
        type,
        logoDataUrl,
        address: address.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        description: description.trim(),
        keywords,
      });
      toast.success("Business created", {
        description: "Your review page and QR code are ready.",
      });
      router.push(`/qr/${business.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Building2 className="size-6" />
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
              Set up your business
            </h1>
            <p className="mt-2 text-muted-foreground">
              We&apos;ll generate a review page and QR code as soon as you save.
            </p>
          </div>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
                    {logoDataUrl ? (
                      <Image
                        src={logoDataUrl}
                        alt="Business logo preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <ImagePlus className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="logo" className="cursor-pointer text-sm font-medium">
                      Business logo
                    </Label>
                    <p className="text-xs text-muted-foreground">PNG or JPG, up to 2MB</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="max-w-56 cursor-pointer text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-xs file:font-medium"
                      />
                      {logoDataUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogoDataUrl(null)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business name</Label>
                    <Input
                      id="name"
                      placeholder="Maple & Kin Studio"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Business type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="type" aria-invalid={!!errors.type} className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business address</Label>
                  <Input
                    id="address"
                    placeholder="221B Baker Street, London"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleUrl">Google Review URL</Label>
                  <Input
                    id="googleUrl"
                    placeholder="https://g.page/r/your-business/review"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    aria-invalid={!!errors.googleReviewUrl}
                  />
                  {errors.googleReviewUrl && (
                    <p className="text-xs text-destructive">{errors.googleReviewUrl}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Customers are sent here after editing their AI-drafted review.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business description</Label>
                  <Textarea
                    id="description"
                    placeholder="A cozy neighborhood studio offering..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Gives the AI helpful context — it won&apos;t copy this into reviews verbatim.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 focus-within:ring-2 focus-within:ring-ring/50">
                    {keywords.map((k) => (
                      <Badge key={k} variant="secondary" className="gap-1 pr-1">
                        {k}
                        <button
                          type="button"
                          onClick={() => setKeywords((prev) => prev.filter((x) => x !== k))}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          aria-label={`Remove ${k}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      id="keywords"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      onBlur={() => addKeywords(keywordInput)}
                      placeholder={keywords.length ? "" : "friendly staff, fast service…"}
                      className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter or comma to add. Used only when they genuinely match a review.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Create review page &amp; QR code
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
