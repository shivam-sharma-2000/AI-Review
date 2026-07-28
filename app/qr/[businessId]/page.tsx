"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ExternalLink, Hash, Store } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { FancyQrDisplay } from "@/components/fancy-qr-display";

import { getBusiness, getReviewUrl } from "@/lib/business-store";
import type { Business } from "@/lib/types";

export default function QrCodePage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [business, setBusiness] = React.useState<Business | null | undefined>(undefined);
  const [reviewUrl, setReviewUrl] = React.useState("");

  // Business profiles now live on the server (any device can look them
  // up), so we fetch on mount / when the route param changes.
  React.useEffect(() => {
    let active = true;
    // Reset to the loading state when businessId changes so a stale
    // business from the previous ID isn't shown while the new fetch runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBusiness(undefined);
    setReviewUrl(getReviewUrl(businessId));
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
          {business === undefined ? (
            <div className="flex justify-center py-20 text-muted-foreground">Loading…</div>
          ) : business === null ? (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <p className="font-medium">We couldn&apos;t find that business</p>
                <p className="text-sm text-muted-foreground">
                  This ID doesn&apos;t match any business on this server. Double-check
                  the link, or set up a new business below.
                </p>
                <Button asChild>
                  <Link href="/setup">Set up a business</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" />
                  Business created
                </div>
                <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
                  {business.name}&apos;s review QR code
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Print it, share it, or embed it anywhere customers can scan.
                </p>
              </div>

              <Card className="rounded-2xl border-border shadow-sm">
                <CardContent className="flex flex-col items-center p-6 sm:p-8">
                  <div className="mb-6 flex w-full items-center gap-3 rounded-xl border border-border bg-muted/50 p-4">
                    <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
                      {business.logoDataUrl ? (
                        <Image
                          src={business.logoDataUrl}
                          alt={`${business.name} logo`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Store className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{business.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Hash className="size-3" />
                        {business.id}
                      </p>
                    </div>
                    {business.type && (
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        {business.type}
                      </Badge>
                    )}
                  </div>

                  <Tabs defaultValue="classic" className="w-full items-center">
                    <TabsList>
                      <TabsTrigger value="classic">Classic</TabsTrigger>
                      <TabsTrigger value="fancy">Fancy</TabsTrigger>
                    </TabsList>
                    <TabsContent value="classic" className="w-full">
                      <QrCodeDisplay
                        url={reviewUrl}
                        filenamePrefix={business.id}
                        logoDataUrl={business.logoDataUrl}
                      />
                    </TabsContent>
                    <TabsContent value="fancy" className="w-full">
                      <FancyQrDisplay
                        url={reviewUrl}
                        filenamePrefix={business.id}
                        logoDataUrl={business.logoDataUrl}
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/review/${business.id}`} target="_blank">
                        Preview review page
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href="/setup">Add another business</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
