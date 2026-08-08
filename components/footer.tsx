import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2 font-display">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <span className="text-base font-semibold tracking-tight">ReviewPilot</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Turn happy customers into 5-star Google reviews with an drafted
            starting point they edit and post themselves.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">Product</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <Link href="/#features" className="transition-colors hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/setup" className="transition-colors hover:text-foreground">
                  Business setup
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Support</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <Link href="/#faq" className="transition-colors hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:88277shiv@gmail.com" className="transition-colors hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Legal</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <span className="cursor-default">Privacy</span>
              </li>
              <li>
                <span className="cursor-default">Terms</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} ReviewPilot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
