"use client";

import * as React from "react";
import Image from "next/image";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateQrPngDataUrl,
  generateQrSvgString,
  downloadDataUrl,
  downloadSvg,
} from "@/lib/qr";
import { copyToClipboard } from "@/lib/clipboard";

interface QrCodeDisplayProps {
  url: string;
  filenamePrefix: string;
  logoDataUrl?: string | null;
  size?: number;
}

export function QrCodeDisplay({ url, filenamePrefix, logoDataUrl, size = 260 }: QrCodeDisplayProps) {
  const [pngDataUrl, setPngDataUrl] = React.useState<string | null>(null);
  const [svgString, setSvgString] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [includeLogo, setIncludeLogo] = React.useState(true);

  const activeLogo = includeLogo ? logoDataUrl ?? undefined : undefined;

  // Regenerating the QR image is an async call to an external library
  // keyed on `url`/logo choice; clearing stale state here avoids showing
  // an old code while the new one renders.
  React.useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPngDataUrl(null);
    setSvgString(null);
    Promise.all([
      generateQrPngDataUrl(url, { logoUrl: activeLogo }),
      generateQrSvgString(url, { logoUrl: activeLogo }),
    ]).then(([png, svg]) => {
      if (!active) return;
      setPngDataUrl(png);
      setSvgString(svg);
    });
    return () => {
      active = false;
    };
  }, [url, activeLogo]);

  const isReady = pngDataUrl && svgString;

  function handleDownloadPng() {
    if (!pngDataUrl) return;
    downloadDataUrl(pngDataUrl, `${filenamePrefix}-qr.png`);
    toast.success("QR code downloaded as PNG");
  }

  function handleDownloadSvg() {
    if (!svgString) return;
    downloadSvg(svgString, `${filenamePrefix}-qr.svg`);
    toast.success("QR code downloaded as SVG");
  }

  async function handleCopyLink() {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy automatically — select and copy the link above");
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-white"
        style={{ width: size + 48, height: size + 48 }}
      >
        {isReady ? (
          <Image
            src={pngDataUrl!}
            alt="QR code linking to the customer review page"
            width={size}
            height={size}
            unoptimized
          />
        ) : (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        )}
      </div>

      <p className="mt-4 max-w-full truncate rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {url}
      </p>

      {logoDataUrl && (
        <Button
          type="button"
          variant={includeLogo ? "default" : "outline"}
          size="sm"
          className="mt-4"
          onClick={() => setIncludeLogo((v) => !v)}
        >
          {includeLogo ? "Logo: on" : "Logo: off"}
        </Button>
      )}

      <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={handleDownloadPng} disabled={!isReady}>
          <Download className="size-4" />
          PNG
        </Button>
        <Button variant="outline" onClick={handleDownloadSvg} disabled={!isReady}>
          <Download className="size-4" />
          SVG
        </Button>
        <Button variant="outline" onClick={handleCopyLink}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          Copy link
        </Button>
      </div>
    </div>
  );
}
