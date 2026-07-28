"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FancyQrDisplayProps {
  url: string;
  filenamePrefix: string;
  logoDataUrl?: string | null;
  size?: number;
}

type ColorPreset = "brand" | "midnight" | "classic";

const COLOR_PRESETS: Record<ColorPreset, { label: string; dots: string; corners: string }> = {
  brand: { label: "Brand blue", dots: "#2563eb", corners: "#1d4ed8" },
  midnight: { label: "Midnight", dots: "#0f172a", corners: "#0f172a" },
  classic: { label: "Classic black", dots: "#000000", corners: "#000000" },
};

export function FancyQrDisplay({ url, filenamePrefix, logoDataUrl, size = 260 }: FancyQrDisplayProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrInstanceRef = React.useRef<any>(null);
  const [preset, setPreset] = React.useState<ColorPreset>("brand");
  const [includeLogo, setIncludeLogo] = React.useState(true);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      setReady(false);
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled || !containerRef.current) return;

      const colors = COLOR_PRESETS[preset];
      const qr = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data: url,
        image: includeLogo && logoDataUrl ? logoDataUrl : undefined,
        margin: 8,
        qrOptions: { errorCorrectionLevel: "H" },
        imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.35 },
        dotsOptions: { color: colors.dots, type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "extra-rounded", color: colors.corners },
        cornersDotOptions: { type: "dot", color: colors.corners },
      });

      containerRef.current.innerHTML = "";
      qr.append(containerRef.current);
      qrInstanceRef.current = qr;
      if (!cancelled) setReady(true);
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url, preset, includeLogo, logoDataUrl, size]);

  function handleDownload(extension: "png" | "svg") {
    if (!qrInstanceRef.current) return;
    qrInstanceRef.current.download({ name: `${filenamePrefix}-qr-fancy`, extension });
    toast.success(`Fancy QR code downloaded as ${extension.toUpperCase()}`);
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-white"
        style={{ width: size + 48, height: size + 48 }}
      >
        {!ready && <Loader2 className="absolute size-8 animate-spin text-muted-foreground" />}
        <div ref={containerRef} className={ready ? "" : "opacity-0"} />
      </div>

      <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Select value={preset} onValueChange={(v) => setPreset(v as ColorPreset)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(COLOR_PRESETS) as ColorPreset[]).map((key) => (
              <SelectItem key={key} value={key}>
                {COLOR_PRESETS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {logoDataUrl && (
          <Button
            type="button"
            variant={includeLogo ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeLogo((v) => !v)}
          >
            {includeLogo ? "Logo: on" : "Logo: off"}
          </Button>
        )}
      </div>

      <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => handleDownload("png")} disabled={!ready}>
          <Download className="size-4" />
          PNG
        </Button>
        <Button variant="outline" onClick={() => handleDownload("svg")} disabled={!ready}>
          <Download className="size-4" />
          SVG
        </Button>
      </div>
    </div>
  );
}
