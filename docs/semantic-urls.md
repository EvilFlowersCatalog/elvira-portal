# Semantic URLs

Status: implemented 2026-11-18 (portal). Viewer side: EvilFlowersViewer#154 (events, merged) and #155 (`linkFunction`,
in progress; the portal already passes it).

**Takeaway:** every place, filter, open dialog and reading position in the portal has one stable, readable address.
Pasted into another browser, refreshed, or opened by an agent, the address shows the same thing. Access is still
decided by the catalog, so a link can show anything but grants nothing.

Diagram: [`diagrams/sequence-portal-link-resolution.svg`](diagrams/sequence-portal-link-resolution.svg)

## 1. What "the same thing" means

A link reproduces:

- **the resource:** a publication, a file, a passage, a list;
- **the view state:** filters, sort, tab, the open dialog, and the reader's page, search and Navigator section.

A link does **not** reproduce:

- **entitlements:** loans, IP range, content tier and role are the recipient's own;
- **feature switches:** a switched-off feature answers 404;
- **personal data:** `/shelf`, `/loans`, `/history` always mean *mine*;
- **presentation:** language, theme and zoom are the recipient's own.

## 2. Addresses

| URL | Shows |
|---|---|
| `/entries/:id` | The publication page: the canonical address of a publication. |
| `/entries/:id/:tab` | The same, with a tab: `contents` · `reviews` · `chapters` · `related` · `figures`. |
| `/entries/:id/read` | The reader. Query: `page`, `label`, `loc`, `p`, `r`, `q`, `panel`, `file`, `catalog`. |
| `?entry-detail-id=:id[&entry-tab=…]` | The same publication as a dialog over any page. One host in App renders it everywhere. |
| `/cite/:entryId/:key` | Redirects to `/entries/:id/read?loc=<key>` (#46), so a refresh keeps the highlight. |
| `/viewer/:entry-id/:index` | Old reader address, redirected (the index is mapped to the file id). |
| `/login?next=…` | Login returns to `next`, which is a same-origin path only (`safeNext`). |
| `/explore?focus=…&arrange=content` | The map, focused and arranged. |

Reader query:

| Param | Meaning |
|---|---|
| `page` | Physical page. Follows the reader: replaced while reading (settled after 400 ms of scrolling), pushed for jumps (link · outline · search · citation · host), so Back returns to where a jump started. Back/Forward move the viewer. |
| `label` | A printed page label, applied with `goToLabel` once loaded. |
| `loc` | A catalog locator key, re-resolved on every open: `relocated` and `page_only` show notes, and 403 sends the reader to the publication page. Moving away from the passage drops it (with `p`/`r`), so a refresh stays put. |
| `q`, `panel` | The in-book search and the Navigator section (`toc`, `pages`, `search`, `highlights`). Written from the viewer's `search` and `panel-change` events, and replayed on load. |
| `file` | An acquisition **id**, only when it isn't the publication's readable PDF. |
| `catalog` | Only when the publication is outside the portal's own catalog. |

Query names are unchanged: the assistant (`portal_context`, `navigate` frames) and links already sent rely on them. They
are declared once, with their kind, in `src/lib/links/params.ts`.

## 3. Architecture

- **`src/lib/links/`.** `paths.ts` builds every address (`entryPath`, `readerPath`, `citePath`, `loginPath`,
  `safeNext`, `absoluteUrl`, `matchEntryPath`). `params.ts` is the param registry: filter / view / dialog, plus the
  assistant-context flag. Four hand-kept lists became the registry: ItemContainer, listSearch, ToolsContainer and
  portalContext.
- **Data router (`src/routes/router.tsx`).** It replaces `<BrowserRouter><Routes>`:
  - **`lazy` routes.** The router fetches the next page's chunk before committing, so the current page stays on
    screen with a thin progress bar (App `NavigationProgress`) instead of a Suspense flash.
  - **Loaders** (`routes/loaders.ts`):
    - `entryLoader` starts the publication query in parallel with the page chunk.
    - `readerLoader` resolves the file, or sends a reader who can't read here to the publication page. It also
      starts the personal copy and the locator (`routes/readerSession.ts`) while the reader's chunk downloads.
    - Redirect loaders handle `/cite` and `/viewer`.
  - **`shouldRevalidate`.** The reader's own URL writes (page, q, panel) never re-run the loader or remount the
    reader.
  - **`errorElement`** shows loader failures inside the app chrome.
- **One publication cache (`hooks/api/entries/entryQueries.ts`).** The dialog, the page and the reader read the same
  React Query entry:
  - hovering, focusing or touching a card or a passage prefetches it (`prefetchEntry`);
  - edits, shelf changes, reviews and loans invalidate it (`invalidateEntry`);
  - it is cleared on logout, since it holds per-user fields.
- **One dialog host (`EntryDialogHost`, App).** It replaces seven per-page copies, and the borrow dialog now works
  on every page (Explore, the assistant page and the reader included).
  - `useEntryDialog` is the only way to open one.
  - Opening pushes a history entry, so Back closes the dialog. Closing a dialog opened in-app steps back, so Back
    doesn't reopen it.
  - Cards are real links (`EntryLink`): a plain click opens the dialog; a new tab or Copy link address gets
    `/entries/:id`.
- **Reader.**
  - `ReaderRoute` is keyed by entry and file.
  - `useReaderUrlSync` keeps the URL and the viewer in step, both ways, through the #154 events.
  - `leaveReader` goes back past the reader's own page jumps; opened from outside, Close goes to the publication page.
  - A failed open lands on the publication page with the reason, not on Home.
- **Auth guard.** It renders at once when the stored access token (JWT `exp`) is still valid, and refreshes in the
  background. Before, every page load waited one refresh round-trip on a blank screen.

## 4. Security and licensing

- **A link is an address, never a grant.** No portal URL carries a token, a signed URL or document text. Every
  address resolves through the same gates as a click:
  - 404 → not found (existence not revealed);
  - 403 → the publication page with the reason;
  - Readium LCP or no readable file → the publication page (borrow).
- **The capability share is separate.** The viewer's Share (`shareFunction`: an expiring, page-ranged acquisition)
  is the only link that grants access. Copy link (dialog, page, and the viewer's `linkFunction`) never does.
- **Fixed: the access token was in a meta tag.**
  - `citation_pdf_url` in `<head>` held the reader's access token, which Zotero and Mendeley store and sync. The
    static `citation_*` tags are gone from `index.html`.
  - The publication page publishes Highwire tags without a file URL (`useCitationMeta`).
  - The reader leaves its tags to the viewer (`citationBib`, #154).
- **Open redirect closed.** `next` and all return targets go through `safeNext`.
- **Referrer.** `<meta name="referrer" content="strict-origin-when-cross-origin">` keeps queries and filters from
  leaking to sites a reader clicks through to.
- **Logout** clears the query cache, so the next user of the tab never sees the previous user's shelf, loans or
  detail.
- **Still open:**
  - figure `image_url`s carry `?access_token=` (`withAccessToken`); they should move to signed URLs (catalog);
  - search text (`query`, `q`) is in URLs that analytics records.

## 5. Not done yet

- `/feeds/:id`, `/categories/:id` and `/authors/:id` paths (today `/feeds?parent-id=…` and `/library?categories=…`).
- A locator for a selection, so the viewer's Copy link on a selection can be `?loc=` instead of `?page=` (catalog).
- Public `/entries/:id` for publications in public catalogs (a policy decision, behind a feature switch).
- `/doi/…` and `/isbn/…` resolvers, and an OPDS `alternate` link to `/entries/:id`.
