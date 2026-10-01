# Sample asset manifest — AgenticCore Pakistan

The "See what we can create" gallery, the hero collage and the service detail examples all read `data/samples.json`.

**Current state (visual pass, 1 Oct 2026)**

The approved master board (1536×1024) was audited panel by panel. Four panels passed QA and are installed at their **native resolution**: no upscaling, and `width`/`height` in `samples.json` are the real pixel sizes. They are thumbnail-grade, which suits the 150–240 px tiles on the site but not print or full-screen use. Full-resolution exports (sizes below) can replace them without code changes.

| Sample | File | Real size | Size on disk | Notes |
|---|---|---|---|---|
| WhatsApp property card | `images/samples/whatsapp-property-card.webp` | 328×499 | 48 KB | Placeholder phone "0300 123 4567" and slightly garbled "Chat on WhatsApp" replaced with "Sample concept / Illustrative details" |
| Social post | `images/samples/social-property-post.webp` | 333×456 | 40 KB | Portrait as designed on the board (the manifest asked for 1:1) |
| Property brochure | `images/samples/property-brochure.webp` | 466×481 | 53 KB | Book on white; shown on a white tile |
| Reel cover | `images/samples/reel-cover.webp` | 626×242 | 42 KB | Shown whole (letterboxed) so the title is never cropped |
| Share image | `images/og-share.jpg` | 1200×630 | 142 KB | Rebuilt at full size with the **real** logo file, site fonts and two of the sample concepts above; not cropped from panel 8 |

**Kept as CSS mock-ups (rejected panels):**

| Panel | Why |
|---|---|
| Property flyer | Garbled AI text ("HOMЦS", "2?V Lounges", "23r Near Park & Mosque"), a non-functional AI-drawn QR code, and the placeholder phone number |
| Project payment plan | "High ROI" (an investment claim), garbled "Tomorrov", inconsistent "15% / 19%" on possession, and table text unreadable at web size |
| Workflow banner | "Get More Leads and Better Results" conflicts with the site's no-lead-promise policy; garbled text on the phone screens; unreadable on mobile. The site's HTML workflow section does this job. |
| Share-image panel 8 | "Webiste Solutions" typo; 599×180 at 3.3:1 can't become 1200×630 without stretching or upscaling |

**Not used:** the earlier reference board (samples 1–8, first message) is not used on the site, as instructed.

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
