# ReviewAI

Collect more Google reviews by giving customers an AI-drafted starting
point. Customers scan a QR code, answer three quick questions, and get a
natural, honest review draft they can edit before posting to Google.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Shadcn UI** (New York style) + **Lucide** icons
- **OpenAI API** or **Google Gemini API** for review generation (switch via env var)
- **Framer Motion** for animation, **Sonner** for toasts, **next-themes**
  for light/dark mode
- **qrcode** for QR generation (PNG + SVG)

## Getting started

```bash
npm install
cp .env.local.example .env.local
# then set AI_PROVIDER and the matching API key in .env.local
npm run dev
```

Open http://localhost:3000

### Environment variables

Create `.env.local` from the example file. Choose a provider with
`AI_PROVIDER`, then set the matching key:

```
# "openai" or "gemini" — defaults to "openai"
AI_PROVIDER=openai

# needed when AI_PROVIDER=openai — https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini   (optional override)

# needed when AI_PROVIDER=gemini — https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key
# GEMINI_MODEL=gemini-2.5-flash   (optional override)
```

Both keys are only ever used server-side, inside `lib/ai/openai-provider.ts`
and `lib/ai/gemini-provider.ts` — neither is exposed to the browser. You
only need to set the key for whichever provider `AI_PROVIDER` points to.
Restart `npm run dev` after changing `.env.local` — Next.js only reads env
vars on server start.

## How the app is organized

```
app/
  page.tsx                     Landing page
  setup/page.tsx                Business setup form
  qr/[businessId]/page.tsx      QR code page (Classic + Fancy tabs)
  review/[businessId]/page.tsx  Customer-facing review flow
  api/generate-review/route.ts  Server route — picks a provider, returns the draft
  api/businesses/route.ts       POST — create a business
  api/businesses/[id]/route.ts  GET — fetch a business by ID

components/
  landing/                      Hero, Features, How It Works, FAQ, CTA
  ui/                            Shadcn UI primitives
  navbar.tsx, footer.tsx, theme-toggle.tsx, theme-provider.tsx
  star-rating.tsx                Interactive 1-5 star input
  qr-code-display.tsx            Classic QR: PNG/SVG download, copy link, logo overlay
  fancy-qr-display.tsx           Styled QR (rounded dots, color presets, logo)

lib/
  types.ts                       Shared types (Business, review payloads...)
  business-store.ts              Client wrapper around the businesses API
  server/business-repo.ts        Server-only JSON file store (business data)
  slug.ts                        Shared business-ID slug generator
  qr.ts                          QR code generation + download + logo overlay helpers
  clipboard.ts                   Clipboard copy with execCommand fallback
  utils.ts                       cn() class helper
  ai/prompt.ts                   Shared prompt builder + AiProviderError
  ai/openai-provider.ts          OpenAI implementation
  ai/gemini-provider.ts          Gemini implementation
```

## Data storage (important)

Business profiles (name, logo, address, Google review link, etc.) are
stored **server-side**, as JSON on disk at `.data/businesses.json`
(`lib/server/business-repo.ts`), behind two API routes:

- `POST /api/businesses` - create a business, returns it with a generated ID
- `GET /api/businesses/[id]` - fetch a business by ID

`lib/business-store.ts` is the client-side wrapper that calls these
routes. This is what makes the Setup -> QR -> Customer Review flow work
across **different devices** — a business created on a laptop can be
looked up from any phone that scans its QR code, because the lookup goes
through this server rather than through browser-only storage.

**Earlier versions of this project used localStorage**, which only ever
worked on the single browser that created the business — scanning the QR
code from a different device showed "we couldn't find this review page."
That's fixed by this server-backed store.

**Caveats:**
- This JSON-file store works great for local dev (`npm run dev`) and for
  a normal always-on Node server (`npm run start` on a VPS/your own
  server) — any device on the same network/internet that can reach that
  server will find the business.
- It is **not** suitable for serverless/edge deployments (e.g. Vercel's
  default runtime), because their filesystem is ephemeral and not shared
  across instances — writes can disappear or not be visible to other
  instances.
- For a real production deployment, swap the functions in
  `lib/server/business-repo.ts` for a real database (Postgres, Supabase,
  PlanetScale, etc.). The function signatures were kept simple so that's
  a drop-in change — nothing in the UI or API routes needs to change.

## Customer review flow

The flow branches on the star rating:

- **4-5 stars** — no follow-up questions are asked. The customer only
  picks a language, then gets an instant AI draft based on the rating and
  light business context (never inventing specific details).
- **1-3 stars** — no AI call is made at all. The customer is asked to
  write the review themselves in a plain textarea, since a low-rated
  experience shouldn't be smoothed over by an AI draft.

Both paths land on the same result screen — editable text, a Copy button,
and "Continue to Google Review" — with Regenerate only shown for the
AI-generated (4-5 star) path.

## QR code styles

The QR page offers two tabs:

- **Classic** — a plain black-on-white QR (via the `qrcode` package),
  reliable for print at any size.
- **Fancy** — a styled QR (via `qr-code-styling`) with rounded dots, a
  brand-blue/midnight/classic color preset, and the business logo
  embedded in the center if one was uploaded.

Both support PNG and SVG download.

## AI review generation

`app/api/generate-review/route.ts` reads `AI_PROVIDER` and delegates to
either `lib/ai/openai-provider.ts` or `lib/ai/gemini-provider.ts`. Both
send the customer's star rating, what they liked, their additional
comments, and their chosen language to the model, along with light
business context (name, type, description, keywords) for tone — never as
facts to insert. The shared prompt (`lib/ai/prompt.ts`) explicitly
instructs the model to:

- Only use information the customer actually provided
- Never invent details, names, or events
- Avoid exaggerated or fake-sounding claims
- Stay within 50-120 words
- Match the tone implied by the star rating

The result is always shown in an editable textarea - nothing is posted to
Google automatically. The customer reviews it, optionally edits it, then
clicks "Continue to Google Review" to open the business's Google review
link in a new tab.

## Design notes

- Primary color: `#2563EB` (blue-600), white background, light/dark mode
  via `next-themes` and CSS variables in `app/globals.css`.
- Type system: **Space Grotesk** for display/headings, **Inter** for body
  text, **JetBrains Mono** for IDs/URLs.
- Shadcn components were vendored directly into `components/ui` so the
  project has no dependency on the shadcn CLI/registry at build time.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

## Known limitations (by design, for a demo build)

- Business data is stored as a JSON file on the server
  (`.data/businesses.json`), which works for local dev or a normal
  always-on Node server, but not for serverless/edge deployments. Move to
  a real database before deploying to Vercel or similar.
- No authentication - anyone with the setup link can create a business
  profile. Add auth before exposing `/setup` publicly.
"# AI-Review" 
