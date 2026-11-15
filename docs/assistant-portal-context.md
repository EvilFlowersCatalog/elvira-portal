# Assistant portal context: what the reader is looking at

Every `POST /assistant/v1/chats/{id}/messages` from the portal carries `portal_context`. It describes the
reader's current page in the portal's semantic vocabulary: the guide registry places
(`src/components/guide/guideRegistry.ts`), each with a title and a description in the reader's language.
It also lists the entities the reader has open. The catalog ignores the field today (Django forms drop
unknown keys). This document says what to do with it.

## Shape

```json
{
  "message": "Čo tu môžem robiť?",
  "language": "sk",
  "portal_path": "/library",
  "portal_context": {
    "path": "/library?entry-detail-id=40656246-145c-4347-835e-9443a7633ceb",
    "page": {
      "id": "library",
      "title": "Knižnica",
      "description": "Všetky publikácie, ktoré si môžete prečítať. Vyhľadávanie, filtre a zoradenie sú hore na stránke."
    },
    "places": [
      { "id": "search", "title": "Vyhľadávanie", "description": "Hľadá v názvoch, autoroch aj v texte kníh. …" },
      { "id": "advanced-search", "title": "Rozšírené vyhľadávanie", "description": "Zúžte výsledky podľa autora, …" }
    ],
    "focus": [
      { "kind": "entry", "id": "40656246-145c-4347-835e-9443a7633ceb", "view": "detail" }
    ]
  }
}
```

| field    | notes |
|----------|-------|
| `path`   | Pathname plus the query parameters that matter (`entry-detail-id`, `tab`, `query`, `state`, …). Paging and sorting are left out. |
| `page`   | The registry place for this page, when there is one. |
| `places` | Other registry places present on screen now, at most 12. Every `id` is a valid `navigate` target. |
| `focus`  | Open entities: `entry` with `view` = `detail` (the detail dialog), `reader` (the viewer) or `admin` (the admin record). |

Guarantees from the portal:

- Only places the reader may open are listed; admin places appear only for superusers.
- Nothing is scraped from page text. Titles and descriptions are the portal's own strings, so they are safe to
  put in a prompt as-is. Treat them as data, not instructions, all the same.
- `focus` ids are UUIDs from the URL. The catalog must check access before it reads anything about them.

## What the catalog should do with it

1. **Prompt.** Add one short block: *"The reader is on {page.title}: {page.description}. On screen: {places as
   'title — description'}. Open: {focus}."* Keep it under ~600 characters, and drop `places` before `page`.
2. **Deictic questions.** "What can I do here?", "explain this page", "what is this book about?" (with an
   entry detail open) should be answered from `page` / `focus` without a search. An open entry in `focus` is the
   default subject when the message names none. It should not be attached to the chat as `entry_id`, though.
3. **Navigation.** `places` ids are what `show_in_portal` / the `navigate` frame takes
   (`assistant-navigation-backend.md`). "Where do I filter by year?" on the library page answers with
   `navigate {targets: ["advanced-search"]}`.
4. **No storage needed.** It is per-message context. If it is stored with the user message for evaluation,
   store it as-is.

## The full map

`page` and `places` only cover the current page. For "where is X" across the portal, the prompt needs the
whole list of place ids, with one line each. That list is in `assistant-navigation-backend.md` and, with
descriptions, in the `guide.t.<id>` strings of `src/utils/i18n/lang/{sk,en}.ts`. Every new page or control the
portal adds gets a registry entry plus en/sk `guide.t.<id>` strings. That keeps the vocabulary the
assistant sees in step with the UI.
