# Content policies and settings in the admin

Portal side of elvira-portal#47. It depends on EvilFlowersCatalog#174 (content policies) and #20 (settings
store). Neither is implemented yet. Shapes marked *assumed* are not in the backend issues; please confirm or
correct them there.

Both pages work before the backend exists. When a list route answers 404, 405 or 501, the page shows one
notice linking the backend issue instead of errors. When the policies list is unavailable or empty, the
assignment pickers render nothing.

## Pages

| Route | What |
|---|---|
| `/administration/content-policies` | Policy list, "New from preset", editor drawer (Edit · History · Explain), and an Explain tab |
| `/administration/settings` | Every registry key: a typed field, its default, a source chip (database · environment · built-in), Save and Reset |
| Catalog drawer, entry config | A "Content policy" picker with "Inherit" as the default; it lists policies and cannot edit them |

The administration is superuser-only (`AdminGuard`), so the pickers are only shown to superusers. The
backend still has to enforce that a catalog `manage` user may assign policies but never edit them.

## Content policies (`/api/v1/content-policies`)

- `GET /` returns a list: an array, `{items}` or `{results}`. Each item:
  `{key, title, version, updated_at?, created_at?, updated_by?, assigned?}`.
  - *assumed* `assigned: {default?: bool, catalogs?: [{id, title}], entries?: number}` fills the "Used by"
    column.
- `GET /schema` returns the JSON Schema, wrapped or bare. The form is generated from it. It supports objects,
  `enum`, `oneOf`/`anyOf` of consts, `$ref` to `$defs`/`definitions`, booleans, numbers, strings, arrays of
  enums or strings, `title`, `description`, `default` and `required`. Anything else gets a JSON box. If the
  schema fails to load, the whole document is edited as JSON.
- `GET /{key}` returns `{key, title, version, document}`.
- `PUT /{key}` with `{key, title, document}` saves a new version and returns it (`version` is read for the toast).
- `POST /` with `{key, title, document}` creates a policy. "New from preset" copies an existing policy's
  `document` into the editor first.
- `document.key` and `document.title` are kept in sync with the form fields, as in the #174 YAML.
- `GET /{key}/versions` returns a list of `{version, title, document, updated_by?, created_at}`. The portal
  diffs any two versions leaf by leaf (`utils/func/documentDiff.ts`).
- Validation errors are read from `detail`/`title` plus `errors[]` with `path` or `loc` and `message` or `msg`,
  so the schema path of the error shows under the editor (#174: "refused with the schema path").

### Explain

`POST /explain` with `{entry_id, user_id?, processor?, surface?}`.

- *assumed* `policy` (a key) and `document` (an unsaved draft) let an admin explain a change before saving it.
  The editor's Explain tab sends the draft whenever there are unsaved changes.
- The answer is shown as
  `{basis, policy: "key@version", base_tier?, caps: [{cap, value?, applied, tier?, reason?}], tier}`.

## Settings (`/api/v1/settings`) — #20 has no contract yet

- *assumed* `GET /` returns a list of
  `{key, type, value, default, source: "db"|"env"|"default", title?, description?, choices?, schema?, secret?, readonly?}`.
  - `type` is one of `string`, `text`, `url`, `email`, `integer`, `number`, `boolean` or `json`.
  - `choices` renders as a select; `schema` overrides `type`.
  - `secret` values are never sent back, and the field stays empty until typed.
- *assumed* `PUT /{key}` with `{value}` stores the value in the database.
- *assumed* `DELETE /{key}` drops the stored value, so the environment or the built-in default applies again.
  The Reset button only appears when `source` is `db`.

## Assignment

- Catalog: `catalogs.content_policy` (nullable), read from the catalog detail. It is sent on
  `PUT /api/v1/catalogs/{id}` only when changed, so a catalog without #174 never receives the key.
- Entry: `config.content_policy`. "Inherit" removes the key rather than sending `null`.
