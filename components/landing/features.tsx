import {
  Sparkles,
  QrCode,
  Languages,
  PenLine,
  ShieldCheck,
  Timer,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI drafts, grounded in real answers",
    description:
      "Every review is written strictly from what the customer told you — no invented details, no exaggerated claims.",
  },
  {
    icon: QrCode,
    title: "One QR code per business",
    description:
      "Print it on receipts, tables, or packaging. Customers scan and land straight on your review page.",
  },
  {
    icon: Languages,
    title: "Reviews in four languages",
    description:
      "Customers write in the language they're comfortable in — English, Hindi, Gujarati, or Marathi.",
  },
  {
    icon: PenLine,
    title: "Always editable",
    description:
      "The AI draft is a starting point. Customers can tweak wording before it ever reaches Google.",
  },
  {
    icon: ShieldCheck,
    title: "Honest by design",
    description:
      "Prompts are constrained to sound natural and authentic — never fake, never over the top.",
  },
  {
    icon: Timer,
    title: "Live in under two minutes",
    description:
      "Add your business details once and get a shareable review page and QR code instantly.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Everything you need to turn feedback into reviews
          </h2>
          <p className="mt-4 text-muted-foreground">
            ReviewPilot handles the awkward blank-page moment for your
            customers, so more of them actually finish leaving a review.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group bg-card p-7 transition-colors hover:bg-accent/40">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-105">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 font-medium text-foreground">{title}</h3>
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
