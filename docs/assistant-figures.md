# Assistant: figures in answers (portal ⇄ catalog contract)

Status: portal side done (2026-11-15); catalog side proposed in EvilFlowersCatalog issue "Assistant: figures in
answers". Inspired by Consensus ("see the figures behind your answer") — charts and tables next to the claim they
support — and by the catalog's own content layer (`search_figures`, `get_region`, locators).

## What the portal does today (no catalog change needed)

- `[F#]` in the answer → a figure card under the paragraph that cites it (crop, caption, page, marks).
- A crop that fails to load (403 outside IP ranges, 404 after re-extraction) → a caption-only card.
- One lightbox per answer: every figure of the answer (cited ones, then shown ones, then source ones), ← / → to step,
  "open in the reader", "ask about this figure", "copy link" (`/cite/{entry_id}/{locator_key}`).
- "N figures in the sources": `F#` sources of the `evidence` frame the answer did not cite (readable, with a crop)
  as a folded thumbnail strip under the answer.

## What the catalog is asked to add

### 1. `show_figures` directive tool + `figures` SSE frame

A directive like `displayBooks`: no lookup, the model names `F#` labels it already holds.

```json
{"name": "show_figures", "description": "Show figures and tables (F#) as images.",
 "parameters": {"type": "object", "properties": {"labels": {"type": "array", "items": {"type": "string"}}},
                "required": ["labels"]}}
```

- Only labels in the chat's ledger and allowed for this turn (same rule as citations, #162); at most 8.
- The turn emits a `citation` frame for each shown label that was not cited yet (so the portal has the crop), then
  `event: figures` / `data: {"labels": ["F2", "F5"]}`.
- Stored on the message as `displayed_figures: ["F2", "F5"]` (like `displayed_entries`) and its citations in
  `citations`, so history replays the gallery.
- Activity: `status`/`activity` with `tool: "show_figures"`, `count`.
- `is_directive()` covers it; the model does not restate what the gallery shows.

Portal parsing: `F\d+` strings only, normalised, de-duplicated, capped at 8; unknown labels are dropped.

### 2. Richer figure citations (`citations.complete` → `_region`)

| field | when | source |
|---|---|---|
| `printed_label` | `snippet` tier | `region.label` ("Table 8.1") — the portal names figures by it, the extractor's kind is sometimes wrong |
| `description` | `snippet` tier | `region.description` (vision) |
| `markdown` | `passage` tier, tables | `region.markdown` |
| `latex` | `passage` tier, equations | `region.latex` |

All optional; the portal treats them as untrusted text (no HTML, capped at 20 000 chars) and keeps the crop primary
with an "extracted automatically" note — `markdown` from the extractor sometimes drops columns.

Catalog status (2026-11-16): §1–§3 built on catalog `develop` (#185 closed). "Cited" is derived from the
answer text (`evidenceLabelsIn`); shown-only figures are tagged "shown" in the sources panel.

## Cite these sources and the access card (catalog #186, elvira-portal#49)

- **Cite** under every finished answer with addressable sources (`answerSources`: labels in the text, then
  shown figures; `uri`, else a `/cite` link; max 50) → `CiteDialog` → `POST /api/v1/cite {uris, style}` →
  `{response: {style, references: [{uri, text | csl}]}}`. ISO 690 default, APA, BibTeX, CSL-JSON; copy one,
  copy all, download `.txt` / `.bib` / `.json`; the last style is remembered per browser. One unseen address →
  404 for the whole request ("no longer available").
- **References for this chat** under the conversation once two or more answers cite something (same dialog,
  every answer's addresses, de-duplicated).
- **`access` frame** → `AccessCard` per publication (live only): reason `lcp` / `budget` / other, buttons from
  `how_to_unlock` (`sign_in` → login, `borrow` → detail, else "open the detail"), `campus_network` as a hint;
  `local_processor` is not shown. Entry id must look like a UUID; unknown ways are dropped.

### 3. Figure-only retrieval

`search_library_text` with `figures: "only"` (or a `kinds` argument) runs `figure_search` (the `search_figures` MCP
tool / `GET /api/v1/search`) by *what the figure shows*, labelling hits `F#` into the ledger. No new tool on the
round-1 list. Prompt: when the question is about data, a diagram or a table, look for figures and show them.
