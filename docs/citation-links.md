# Citation links: `/cite/{entry_id}/{locator_key}`

Portal side of elvira-portal#46. It depends on the extraction locators in EvilFlowersCatalog#171, which are
**not implemented yet**. This file lists what the portal expects, so the catalog can confirm or correct it.

## The route

`/cite/:entryId/:key` sits behind login. A logged-out visitor goes to `/login` and comes back to the link
afterwards (`AuthProvider` keeps `state.from`). The route always navigates on with `replace`, so Back skips it.

1. `GET /api/v1/locators/{entry_id}/{key}`
2. Act on the answer:

| Answer | Portal |
|---|---|
| 200 with `page` | Opens the viewer at `page`. The highlight is `bbox` (paragraph outline) plus `quads` (sentence), passed as `initialFocus`. |
| 200 with `resolution: relocated` | As above, plus a toast: "the text moved after reprocessing". |
| 200 with `resolution: page_only` | Opens the page with no highlight, plus a toast: "exact passage not found". |
| 200 with `how_to_unlock` set, or no `page` | The entry's detail page (borrow), not the viewer. |
| Readium LCP entry (`config.readium_enabled`) | The detail page. LCP titles are never opened in this viewer. |
| 403 | The detail page. Uses `entry.catalog_id` from the body when present. |
| 404, or the entry detail fails to load | The not-found page. |

## Expected response (`response` wrapper as usual)

```json
{
  "key": "K7Q2…",
  "entry_id": "…",
  "kind": "paragraph",
  "page": 42,
  "source_page": 41,
  "bbox": {"x0": 0.1, "y0": 0.2, "x1": 0.9, "y1": 0.3},
  "quads": [{"x0": …}],
  "quads_page": 43,
  "resolution": "exact",
  "quote": "…",
  "how_to_unlock": null,
  "entry": {"id": "…", "catalog_id": "…", "title": "…"}
}
```

- `page` uses reader numbering, as #171 says (`reader_source_pages`).
- Boxes are page fractions with the origin at the top left, the same as agent highlights.
- `quads_page` is an assumption, not in #171. It is the page the sentence's quads are on when the sentence
  continues onto the next page, mirroring `sentence_page` on citations.
- `entry` on 200 and 403 is an assumption. Without it the portal fetches the entry detail itself.

## Chat citations

When an `IAssistantCitation` carries `locator_key`, every citation chip and figure card opens through
`/cite/…` instead of using the stored `bbox`/`quads`. That covers the portal chat and the viewer's chat
(`openCitationFunc`). Citations without the key keep working as before.

## Viewer

`initialFocus` (page, bbox, quads, regionId) is in the viewer source but not in a released viewer: 0.7.9
lacks it. Until a release ships, links open at the right page with no highlight.
