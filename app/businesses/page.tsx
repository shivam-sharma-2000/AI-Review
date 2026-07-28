"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { 
  Building2, 
  Search, 
  Plus, 
  ExternalLink, 
  QrCode, 
  Star, 
  MapPin, 
  Loader2,
  Calendar,
  Store
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_TYPES } from "@/lib/types";
import { listBusinesses } from "@/lib/business-store";
import type { Business } from "@/lib/types";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("all");

  React.useEffect(() => {
    listBusinesses()
      .then((data) => {
        setBusinesses(data);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load businesses";
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredBusinesses = React.useMemo(() => {
    return businesses.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
        (b.address && b.address.toLowerCase().includes(search.toLowerCase()));
      const matchesType = selectedType === "all" || b.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [businesses, search, selectedType]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Businesses
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Manage your active businesses, generate customer review QR codes, and run AI-drafted review campaigns.
              </p>
            </div>
            <Button asChild className="sm:w-auto self-start">
              <Link href="/setup" className="gap-2">
                <Plus className="size-4" />
                <span>Add Business</span>
              </Link>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search businesses by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="w-full sm:w-56">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List of Businesses */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Loading businesses...</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <Card className="rounded-2xl border-border shadow-sm bg-background">
              <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Building2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">No businesses found</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {businesses.length === 0 
                      ? "Create your first business profile to get access to custom QR codes and smart customer review templates."
                      : "We couldn't find any businesses matching your search criteria. Try adjusting your filters."}
                  </p>
                </div>
                {businesses.length === 0 && (
                  <Button asChild className="mt-2">
                    <Link href="/setup">Create Business Profile</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((b) => (
                <Card key={b.id} className="rounded-2xl border-border bg-background shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
                  <CardContent className="p-6 flex flex-col flex-1">
                    
                    {/* Business Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                        {b.logoDataUrl ? (
                          <Image
                            src={b.logoDataUrl}
                            alt={`${b.name} logo`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Store className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base leading-snug truncate">
                          {b.name}
                        </h3>
                        {b.type && (
                          <Badge variant="secondary" className="mt-1 text-xs px-2 py-0">
                            {b.type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 mb-6 flex-1 text-sm text-muted-foreground">
                      {b.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="size-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{b.address}</span>
                        </div>
                      )}
                      {b.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 shrink-0" />
                          <span>Created {new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                          <Link href={`/qr/${b.id}`}>
                            <QrCode className="size-3.5" />
                            <span>QR Code</span>
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                          <Link href={`/review/${b.id}`}>
                            <Star className="size-3.5" />
                            <span>Review Flow</span>
                          </Link>
                        </Button>
                      </div>
                      
                      {b.googleReviewUrl && (
                        <Button asChild variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <a href={b.googleReviewUrl} target="_blank" rel="noopener noreferrer">
                            <span>Google Business Review</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </Button>
                      )}
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
