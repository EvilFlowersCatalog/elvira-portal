# Content policies and settings in the admin

Portal side of elvira-portal#47, on the catalog's EvilFlowersCatalog#174 (content policies) and #20 (instance
settings), both in catalog `05cf002` and live on dev. The pages are behind `ELVIRA_EXPERIMENTAL_FEATURES`. On a
catalog without these routes (404, 405 or 501), each page shows one notice and the pickers render nothing.

## Pages

| Route | What |
|---|---|
| `/administration/content-policies` | Policy list (key, version or "built-in", tiers), "New from preset", an editor drawer with Edit · History · Explain tabs, and an Explain tab on the page |
| `/administration/settings` | Every declared key: a field from its JSON Schema, the default, the source (saved here · deployment `EVILFLOWERS_*` · built-in), Save and Reset |
| Catalog drawer (edit), entry edit | A "Content policy" picker with "Inherit" first. It **saves on change** through the assign endpoint. |

## Content policies (`/api/v1/content-policies`)

| Call | Portal use |
|---|---|
| `GET /` → `[{key, version, ref, title, builtin, document}]` | List. `builtin` is the unsaved `parity` (version 0). |
| `GET /schema` | The editor form is generated from it (`SchemaForm`). `key` and `title` are edited above the form. |
| `GET /{key}` | Editor source; also the preset a new policy copies. |
| `PUT /{key}` `{document}` → `{…, changed}` | New version; `changed: false` → "nothing changed". `?dry_run=true` is the **Validate** button. |
| `POST /` `{document}` (`document.key` names it) | Create a policy, and the first save of the built-in `parity`. |
| `GET /{key}/versions` → `[{version, ref, title, updated_by, created_at}]` | History list. It has no documents, so `?version=N` fetches each compared version for the diff. |
| `POST /explain` `{entry_id, user_id?, processor?, policy?}` | Explain. `policy` previews another **stored** policy without assigning it. |
| `POST /{key\|inherit}/assign` `{catalog_id?, entry_ids?}` → `{policy, catalog, entries}` | Pickers. `inherit` clears the assignment. |

Refusals (422) carry `path` and `schema_path`, and the editor shows them under the form.

**How the backend shaped the UI**

- Explain only works on stored policies. The editor's Explain tab explains the saved version; to check a
  change, Validate it and save it first.
- Catalogs don't expose `content_policy`, so the catalog picker reads it with a dry-run
  `POST /inherit/assign {catalog_id}` (`catalog.previous`).
- Entry `config` merges on save, so it could never clear the key. The entry picker therefore assigns through
  the endpoint rather than through the entry form.
- The explain `caps` are every cap's ceiling. The response doesn't include the basis tier, so the portal can't
  tell which cap actually lowered the result, and doesn't claim to.

## Settings (`/api/v1/settings`)

- `GET /` → `[{key, schema, description, default, fallback, permission, value, source: stored|setting|default}]`
- `PUT /{key}` `{value}` saves the value; `{value: null}` resets it, so the deployment setting or the default
  applies again.
- Special cases in the form:
  - `content.default_policy` is a select of the existing policies.
  - `branding.logo` has a preview and an upload that turns the file into a `data:` URI (512 kB cap in the portal).

## API keys

`processor` (`local` | `external`, empty inherits `content.external_processor_default`) is set when a key is
created and shown in the keys table. Only administrators may set `local`; the catalog refuses it for anyone
else.
