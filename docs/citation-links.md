# Citation links: `/cite/{entry_id}/{locator_key}`

Portal side of elvira-portal#46, on the extraction locators of EvilFlowersCatalog#171 (catalog `05cf002`, live
on dev). The catalog's `content.cite_base_url` setting is the base it hands to agents for these links.

## The route

Since 2026-11-18 (docs/semantic-urls.md), `/cite/:entryId/:key` is a redirect: it lands on
`/entries/:entryId/read?loc=:key`. The locator travels in the reader's address, so a refresh or a copied link keeps
the highlight. The reader resolves it on every open; the outcomes below are unchanged. Behind login, `?next=`
returns to the link afterwards.

1. `GET /api/v1/locators/{entry_id}/{key}` returns
   `{key, entry_id, kind, resolution, page, source_page, bbox, quads, readable, quote, detached_at, readium}`.
   `page` is in the viewer's numbering: the reader's copy carries the licence page at index 1, so source page 30
   is reader page 31.
2. The portal acts on it:

| Answer | Portal |
|---|---|
| 200, `exact` | The viewer at `page`, with `bbox` (paragraph) and `quads` (best sentence) as `initialFocus` |
| 200, `relocated` | The same, plus a note: "the text moved after reprocessing" |
| 200, `page_only` | The page with no highlight, plus a note: "exact passage not found" |
| Readium LCP entry | The detail page with borrow. LCP titles are never opened in this viewer. |
| 403 | The detail page |
| 404 (unknown key, or an entry the reader can't see) | The not-found page |

## Chat citations

Citations issued since #171 carry `locator_key` (and `resolution`). Chips and figure cards with a key open
through `/cite/…`, in the portal chat and in the viewer chat (`openCitationFunc`), so they keep working after a
re-extraction. Citations without a key keep using their stored page and boxes.

## Viewer

The released viewer (0.7.9) has no `initialFocus`, so links land on the right page without a highlight until a
viewer release ships it. Checked on dev: a paragraph locator of *Finite Difference Computing with PDEs*
(source page 30) opens reader page 31 with that paragraph on it.
