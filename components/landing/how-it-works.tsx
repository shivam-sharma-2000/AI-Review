import { Settings2, QrCode, MessagesSquare, Send } from "lucide-react";

const STEPS = [
  {
    icon: Settings2,
    title: "Set up your business",
    description:
      "Add your name, logo, and Google Review link. We generate a unique review page and QR code.",
  },
  {
    icon: QrCode,
    title: "Share the QR code",
    description:
      "Print it on a table tent, receipt, or packaging insert — anywhere customers will see it.",
  },
  {
    icon: MessagesSquare,
    title: "Customer answers 3 questions",
    description:
      "A star rating, what they liked, and any extra comments — in their preferred language.",
  },
  {
    icon: Send,
    title: "They edit and post to Google",
    description:
      "AI drafts a natural review from those answers. The customer edits it, then posts it themselves.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From scan to 5-star review, in four steps
          </h2>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block"
            aria-hidden
          />
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative">
              <div className="relative z-10 flex size-12 items-center justify-center rounded-full border border-border bg-background font-display text-sm font-semibold text-primary shadow-sm">
                {String(i + 1).padStart(2, "0")}
              </div>
              <Icon className="mt-4 size-5 text-primary" />
              <h3 className="mt-3 font-medium text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
