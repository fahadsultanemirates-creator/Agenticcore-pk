# Sample asset manifest — AgenticCore Pakistan

The "See what we can create" gallery, the hero collage and the service detail examples all read `data/samples.json`.

**Current state:**
- **Installed:** none. Every sample currently shows a CSS mock-up (with fictional example text) and the "Sample concept" label.
- **Not used:** the reference board the owner shared in chat (samples 1–8) is not used on the site, as instructed.

## How to install an image

1. Save the file at the exact path below (WebP, sRGB). Keep the "source" size and export a copy at most 200 KB where possible.
2. In `data/samples.json`, set `"installed": true` for that entry. Keep `width`/`height` equal to the file's real size.
3. Deploy. The mock-up is replaced automatically; the "Sample concept" label stays.

`tests/p2.test.mjs` fails if a sample is marked installed but its file is missing.

## Rules for every sample

- It is a **demonstration**, not client work: no real client names, logos, phone numbers, testimonials or results.
- Use fictional project names (e.g. "Sample Residencia"). Use `0300 000 0000`-style or blank phone numbers.
- Prices and areas are examples only.
- A "Listed on AgenticCore Estate" mark and QR are fine; the QR should point to `https://agenticcore.estate`, not a fake listing.
- No approval, NOC or government claims unless marked as an example (as in the approval-kit mock-up).

## Files needed

| # | Path | Size (source) | Shows | Alt text (EN) | Used in |
|---|---|---|---|---|---|
| 1 | `images/samples/property-flyer.webp` | 1080×1350 | "For sale" flyer: photo, price badge, facts, agency block, QR | Sample property flyer for a 10 marla house | hero collage, gallery (Property), service 10/11 |
| 2 | `images/samples/whatsapp-property-card.webp` | 1080×1350 | WhatsApp card: photo, white fact sheet, price, "Contact now" | Sample WhatsApp property card | hero collage, gallery, service 7 |
| 3 | `images/samples/social-property-post.webp` | 1080×1080 | Square Instagram/Facebook post | Sample square social media property post | hero collage, gallery (Social), service 11/31 |
| 4 | `images/samples/property-brochure.webp` | 1600×1130 (landscape preview of an A4 spread) | Brochure cover plus an inside page | Sample property brochure spread | gallery (Print), service 6/7 |
| 5 | `images/samples/project-payment-plan.webp` | 1600×900 | Payment-plan table for a fictional project | Sample project payment plan | gallery (Project), service 4 |
| 6 | `images/samples/reel-cover.webp` | 1280×720 | Reel/video cover with play button and duration | Sample property reel cover | hero collage, gallery (Video), service 22/23 |
| 7 | `images/samples/property-workflow.webp` | 1600×600 | Agent input → AgenticCore output strip | Sample workflow from agent notes to marketing outputs | reserved for the workflow section (currently built in HTML/CSS; the image is optional) |
| 8 | `images/og-share.jpg` | 1200×630, ≤200 KB | "Turn properties into marketing that sells." with the logo on the brand background | – (Open Graph) | `og:image` / `twitter:image` on every page (currently the Estate icon) |

Optional later additions, which need a new entry in `samples.json`:
- a progress-reel still (service 27)
- a WhatsApp catalogue (7-cat)
- an approval-kit layout (8)
- an Estate QR share card screenshot (a real feature: take the screenshot on agenticcore.estate)

## Performance

- The gallery images are `loading="lazy"` with explicit `width`/`height`, so there's no layout shift.
- Cards show them at about 240 px tall with `object-fit: cover`, so a 1080-wide WebP around 120–200 KB is plenty.
- Don't use the full reference collage as a background.
