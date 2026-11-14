# Assistant navigation: what the catalog needs to add

The portal can now show readers where things are. The assistant takes them to a page and spotlights the
control to look at ("show me"), or walks them through several places (a tour). The frontend is complete. Today
it works without the catalog: the portal spots "where is …" questions itself, so a guide card appears while
the model answers. For the model to *choose* when to guide, the catalog needs one closing tool and one SSE
frame.

## 1. Request: `portal_path`

`POST /assistant/v1/chats/{id}/messages` now carries the page the reader is on:

```json
{ "message": "Kde nájdem moje výpožičky?", "language": "sk", "portal_path": "/administration/users" }
```

It is optional and unknown to the catalog today; Django forms ignore extra keys. Use it in the prompt
("the reader is on …") so "where is X" can be answered relative to here.

## 2. Tool: `show_in_portal`

A pseudo-tool that only emits a frame, the way `display_books` emits `entries` (`turn.py` routes it before
the regular tool call). Offer it to every authenticated chat. Arguments:

| field     | type       | notes                                                                       |
|-----------|------------|-----------------------------------------------------------------------------|
| `targets` | `string[]` | 1–6 place ids from the list below, in order                                 |
| `tour`    | `string?`  | instead of targets: `portal`, `find-book`, `account`, `admin`               |
| `auto`    | `bool?`    | start the guide as soon as the answer finishes ("take me there"); default false |

Suggested description for the model: *"Show the reader where something is in the portal. Use when they ask
where to find a page or setting, how to get somewhere, or ask for a tour. Pick place ids from the list; never
invent URLs. Set auto only when the reader explicitly asks you to take them there."*

The tool emits the frame below and returns `{ "shown": true }`. The portal resolves ids itself, so the
catalog needs no knowledge of routes or the DOM.

## 3. SSE frame: `navigate`

```
event: navigate
data: {"targets": ["loans"], "auto": false}
```

or `{"tour": "admin"}`. The portal:

- drops ids it does not know, and ids the reader may not open (admin places for non-admins);
- renders a "Show me / Go there" card under the answer and replaces its own guess with this frame;
- with `auto: true`, starts the guide when the stream ends (live turns only, never when reading history back);
- logs the call in the activity log as "Found the way in the portal" when the tool is named `show_in_portal`.

The frame is live only; nothing needs storing.

## Place ids

The source of truth is `src/components/guide/guideRegistry.ts` (`GUIDE_TARGETS`, `GUIDE_TOURS`).

- **Menu:** `menu-home`, `menu-library`, `menu-feeds`, `menu-categories`, `menu-ai`, `menu-admin`, `menu-shelf`,
  `menu-history`, `menu-loans`, `menu-profile`, `menu-language`, `menu-theme`, `menu-help`, `assistant-launcher`
- **Reader:** `home`, `home-ai`, `library`, `search`, `advanced-search`, `sort`, `book`, `feeds`, `categories`,
  `ai-chats`
- **Personal:** `shelf`, `history`, `loans`, `profile`, `passphrase`, `notifications`
- **Admin (superusers):** `admin-dashboard`, `admin-publications`, `admin-collections`, `admin-categories`,
  `admin-authors`, `admin-reviews`, `admin-catalogs`, `admin-users`, `admin-access`, `admin-loans`, `admin-jobs`,
  `admin-attention`, `admin-add-entry`, `admin-add-user`

A page id (`loans`, `admin-users`, …) given alone first highlights its menu entry, then the page, so the
reader learns the way. A good prompt list pairs each id with one line of what is there.
