import QRCode from "qrcode";

const QR_COLOR = {
  dark: "#0f172a",
  light: "#ffffff", // solid white prints reliably and gives the logo overlay a clean base
};

export interface QrOptions {
  /** Data URL (or same-origin image URL) to draw centered on top of the QR. */
  logoUrl?: string;
  width?: number;
}

/**
 * Generates a PNG Data URL for a QR code, optionally with a center logo
 * overlay. Must run in the browser (uses <canvas> / <img>).
 */
export async function generateQrPngDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const { logoUrl, width = 800 } = options;

  // 1. Generate the base QR code onto a canvas.
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width,
    margin: 1,
    color: QR_COLOR,
    // "H" (High) error correction recovers up to ~30% data loss, which is
    // what lets a logo sit on top without breaking the scan.
    errorCorrectionLevel: logoUrl ? "H" : "M",
  });

  if (!logoUrl) {
    return canvas.toDataURL("image/png");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");

  let logo: HTMLImageElement;
  try {
    logo = await loadImage(logoUrl);
  } catch {
    // If the logo fails to load for any reason, fall back to a clean QR
    // rather than throwing and blocking the whole download.
    return canvas.toDataURL("image/png");
  }

  // Logo size relative to the QR canvas (~22% of total width keeps it
  // comfortably inside the "H" error-correction budget).
  const logoSize = width * 0.22;
  const logoX = (width - logoSize) / 2;
  const logoY = (width - logoSize) / 2;

  // White rounded backing behind the logo so QR modules don't show through.
  const padding = 12;
  const bgSize = logoSize + padding;
  const bgX = (width - bgSize) / 2;
  const bgY = (width - bgSize) / 2;

  ctx.fillStyle = "#ffffff";
  drawRoundedRectPath(ctx, bgX, bgY, bgSize, bgSize, 16);
  ctx.fill();

  ctx.save();
  drawRoundedRectPath(ctx, logoX, logoY, logoSize, logoSize, 12);
  ctx.clip();
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Generates an SVG markup string for a QR code, optionally with a center
 * logo overlay embedded as a base64 <image>.
 */
export async function generateQrSvgString(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const { logoUrl } = options;

  const svg = await QRCode.toString(text, {
    type: "svg",
    margin: 1,
    color: QR_COLOR,
    errorCorrectionLevel: logoUrl ? "H" : "M",
  });

  if (!logoUrl) return svg;

  const dimensionMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const size = dimensionMatch ? Number(dimensionMatch[1]) : 290;

  let logoDataUrl = logoUrl;
  // Convert non-data-URL logo sources (e.g. same-origin image URLs) to a
  // data URL so the SVG stays a single, portable file.
  if (!logoUrl.startsWith("data:")) {
    try {
      logoDataUrl = await urlToDataUrl(logoUrl);
    } catch {
      return svg; // fall back to a clean QR if the logo can't be embedded
    }
  }

  const logoSize = size * 0.22;
  const logoPos = (size - logoSize) / 2;
  const padding = size * 0.015;
  const bgSize = logoSize + padding * 2;
  const bgPos = (size - bgSize) / 2;
  const bgRadius = bgSize * 0.14;
  const logoRadius = logoSize * 0.12;
  const clipId = `qr-logo-clip-${Math.random().toString(36).slice(2, 8)}`;

  const overlay = `
    <defs>
      <clipPath id="${clipId}">
        <rect x="${logoPos}" y="${logoPos}" width="${logoSize}" height="${logoSize}" rx="${logoRadius}" />
      </clipPath>
    </defs>
    <rect x="${bgPos}" y="${bgPos}" width="${bgSize}" height="${bgSize}" rx="${bgRadius}" fill="#ffffff" />
    <image href="${logoDataUrl}" x="${logoPos}" y="${logoPos}" width="${logoSize}" height="${logoSize}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice" />
  `;

  return svg.replace("</svg>", `${overlay}</svg>`);
}

/** Draws a rounded-rect path, using the native API when available and a
 * manual arc-based fallback for older browsers without CanvasRenderingContext2D.roundRect. */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Loads an <img> from a data URL or same-origin URL. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/** Fetches an image URL and converts it to a base64 data URL. */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}
