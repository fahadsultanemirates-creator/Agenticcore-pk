# AgenticCore Pakistan — integration contract (Phase 1: documentation only)

This describes the operations a future Telegram/Grok bot, WhatsApp flow, MCP server or the Estate site can use to work with AgenticCore Pakistan.

**Nothing new is exposed yet.** Every operation below maps to something that already exists: a public data file, a table read under RLS, or a `pk_*` RPC. Phase 2 adds a server-side orchestration endpoint in front of these, so no bot ever holds a service-role key or talks to the database directly.

## Principles

- **Identity.** Every user action runs as that user, with their Supabase session JWT, so RLS and the `pk_*` RPC checks apply unchanged. A bot links a chat to an account first (Phase 2: one-time code shown in the dashboard). It never asks for a password in chat.
- **Money.** Prices come only from `pk_catalog_lines`, the database copy of `data/services.json`. Clients send line IDs and quantities, never prices.
- **Confirmation.** Every ACTION that creates an order, spends money, sends a message or changes a task needs an explicit user confirmation step showing what will happen and the price. Nothing is ordered silently.
- **No admin over public APIs.** Admin RPCs (`pk_admin_*`) stay browser-dashboard-only for users with `role = 'admin'`. They are never part of a bot or MCP surface.
- **Secrets.** The service-role key stays out of every frontend and bot. Any future server component keeps provider keys in environment variables.
- **Data minimisation.** No CNIC, passwords or tokens are ever sent to an AI provider. Brand Kit files and deliverables are private, served only through short-lived signed URLs to their owner or the team.

## READ operations

| Operation | Maps to today | Auth | Authorisation | Input | Output | Side effects |
|---|---|---|---|---|---|---|
| `catalog.list` | `data/services.json`, `data/packages.json` (public, static) | none | public | – | groups, services, price lines (`id, model, price, unit, text, days`), packages | none |
| `catalog.recommend` | `data/discovery.json` intents plus selector rules (deterministic) | none | public | `{ intent }` or `{ what: property\|project\|agency\|developer, goal: sell-faster\|look-professional\|social\|leads\|online\|complete }` | `{ services: [no], package?: id }` (resolve prices via `catalog.list`) | none |
| `estate.listings` | `listings` select where `owner_id = auth.uid()` (`PkDB.getMyEstateListingsFull`) | user JWT | only the caller's own listings are returned | `{ limit? }` | `[{ id, title, type, property_type, city, area, price, size_marla, size_unit, beds, baths, photos[], verified }]` | none |
| `estate.listing` | same query plus `.eq('id', id)` (`PkDB.getOwnedEstateListing`) | user JWT | returns `null` unless `owner_id = auth.uid()`; a non-UUID returns `null` before querying | `{ id: uuid }` | listing or `null` | none |
| `task.get` | `pk_tasks` select (RLS: own rows) | user JWT | own tasks only | `{ public_id: "ACPK-0001" }` | `{ public_id, title, status, due_at, missing[], revisions_used, amount }` | none |
| `task.list` | `pk_tasks` select | user JWT | own tasks only | `{ status? }` | array of the above | none |
| `deliverables.list` | `pk_deliverables` select plus `pk_tasks(public_id, service_no)` | user JWT | own rows only | `{ public_id? }` | `[{ id, task, version, kind, label, created_at }]`: **metadata only** | none |
| `deliverables.url` | `storage.createSignedUrl('pk-deliverables', path, 3600)` | user JWT | storage policy: owner or admin | `{ deliverable_id }` | signed URL valid for 1 hour | none |

## ACTION operations (user confirmation required)

| Operation | Maps to today | Auth | Authorisation | Input | Output | Side effects | Confirmation |
|---|---|---|---|---|---|---|---|
| `order.draft` | client-side only: resolve lines, build details, show total from `catalog.list` | user JWT | – | `{ lines: [line_id], details: {...}, use_brand_kit }` | `{ items, display_total }` | **none**: nothing is stored | – |
| `order.create` | RPC `pk_place_order(p_items jsonb, p_source)` | user JWT | caller = client; server re-prices every line from `pk_catalog_lines` | `p_items: [{ line_id, quantity, details, use_brand_kit }]`, `p_source: web\|telegram\|whatsapp` | `[{ task_id, public_id, invoice_number }]` | creates an order, one task per line (status *Waiting on you*), one invoice, notifications | **Yes.** Show lines, total and the invoice/payment note, then confirm. |
| `package.buy` | RPC `pk_buy_package(p_package, p_accept_terms)` | user JWT | caller = client | `{ package_id, accept_terms: true }` | `{ subscription_id, invoice_number }` | pending subscription, set-up tasks, invoice | **Yes.** Must show the minimum term. |
| `task.message` | RPC `pk_post_message(p_task, p_body)` | user JWT | own task (`pk_own_task`) | `{ task_id, body ≤ 2000 chars }` | ok | message on the thread, team notified | **Yes** in bots (echo the text back first). |
| `task.add_details` | RPC `pk_add_details(p_task, p_details, p_note)` | user JWT | own task | `{ task_id, details, note }` | ok | merges details, logs an event | Yes |
| `task.attach` | storage upload to `pk-attachments/<uid>/<public_id>/…`, then RPC `pk_register_attachment` | user JWT | storage policy: own folder; RPC: own task | file (validate type and size first) | `{ path }` | file stored privately | Yes |
| `task.request_changes` | RPC `pk_request_changes(p_task, p_note, p_attachment)` | user JWT | own task; at most 2 free rounds | `{ task_id, note }` | round number | status *Changes requested* | Yes |
| `task.approve` | RPC `pk_approve_delivery(p_task)` | user JWT | own task | `{ task_id }` | ok | status *Delivered* | Yes |
| `task.cancel` | RPC `pk_cancel_task(p_task)` | user JWT | own task, only before work starts | `{ task_id }` | ok | status *Cancelled* | Yes |

**Not exposed (admin only, dashboard UI):** `pk_admin_set_status`, `pk_admin_create_task`, `pk_admin_add_deliverable`, `pk_admin_create_invoice`, `pk_admin_set_invoice_status` (this one credits referral points), `pk_admin_set_subscription_status`, `pk_admin_record_usage`, `pk_admin_clients`.

## Estate → AgenticCore Pakistan handoff ("Promote this listing")

The Estate site can link a listing owner to a prefilled marketing pack:

```
https://agenticcorepk.com/?from=estate&listing=<listing-uuid>&intent=promote
```

1. `index.html` checks `from=estate` and that `listing` is a UUID (anything else is ignored). It then redirects to `dashboard.html#pack/estate/<uuid>`.
2. The dashboard requires login. After login the user returns to the same hash; the login `next` value is validated against `^[a-z0-9-]+\.html(#[A-Za-z0-9/_,-]*)?$`.
3. The listing is read with `id = <uuid> AND owner_id = auth.uid()`:
   - **Match:** safe public fields (title, type, city, area, price, size, beds, baths, description, public photo URLs) prefill the form. The user reviews them and chooses outputs.
   - **No match** (someone else's listing, deleted, or wrong account): nothing is prefilled. The page says "That listing isn't in your AgenticCore account" without revealing whether the listing exists.
4. Nothing is ordered until the user presses **Review order** and then **Place order** (`order.create`). The task `details` carry `estate_listing_id`, `estate_listing_url` and `estate_photos`.
5. The admin task view re-checks that the listing belongs to the ordering client and warns if not.
6. **Applied 1 Oct 2026:** `supabase/migrations/pk_0003_estate_listing_ownership.sql` adds a trigger that rejects any client-created task whose `estate_listing_id` isn't owned by that client. Before applying, it was dry-run in a rolled-back transaction: own listing allowed, unknown or other listing blocked (42501), malformed reference blocked (22023).

To implement on Estate (not done in this phase), add a "Promote this listing" button on the owner's listing and toolkit pages that links to the URL above. No shared secrets are needed, because authorisation is the shared Supabase login.

## Phase 2 orchestration endpoint (design)

`POST /api/pk` (Netlify Function), with `Authorization: Bearer <user JWT>`:

- **Actions:** `catalog.recommend`, `estate.listings`, `order.draft`, `order.create`, `task.get`, `task.message`, `deliverables.list`.
- **Validation:** schema-validates the input, rate-limits per user and IP, and calls Supabase REST/RPC with the user's own token and the public key only.
- **Confirmation handshake:** `order.create` needs a `confirm_token` returned by a preceding `order.draft` within 10 minutes, so a bot can't place an order without an explicit confirm step.
- **Chat bot:** a Telegram/Grok bot calls this endpoint after account linking. The bot token lives only in env; the bot never sees other users' data.
- **AI:** AI steps (caption writing, brief extraction) use the provider-abstracted service pattern already used on Estate (`services/ai.mjs`). They cover input clean-up only; prices, ownership and task state stay deterministic.
