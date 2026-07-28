"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "md" | "lg";
  className?: string;
}

const LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

export function StarRating({ value, onChange, size = "lg", className }: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHovered(null)}
        role="radiogroup"
        aria-label="Overall rating"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(n)}
            onFocus={() => setHovered(n)}
            onBlur={() => setHovered(null)}
            onClick={() => onChange(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <Star
              className={cn(
                size === "lg" ? "size-9 sm:size-10" : "size-6",
                "transition-colors",
                n <= display
                  ? "fill-primary text-primary"
                  : "fill-transparent text-muted-foreground/50"
              )}
            />
          </button>
        ))}
      </div>
      <p className="h-5 text-sm font-medium text-muted-foreground">
        {display > 0 ? LABELS[display - 1] : "Tap to rate"}
      </p>
    </div>
  );
}
