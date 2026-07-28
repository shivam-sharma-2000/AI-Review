/**
 * Copies text to the clipboard, trying the modern async Clipboard API
 * first and falling back to a hidden textarea + execCommand("copy") when
 * that API is unavailable or blocked (insecure context, permissions
 * policy, some Windows/Chrome edge cases, older browsers, etc.).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy method below
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}
