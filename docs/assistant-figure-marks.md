# Assistant figure marks: drawing on a figure

The assistant can already show a figure the answer cites (`[F2]`, IP-030 Phase 3). The portal can now also
draw **marks** over it: boxes, ellipses, arrows and points, each numbered, with a short label and a sentence of
explanation in a legend underneath ("1 Component interface: both the core object and every decorator
implement it"). Readers can hide the marks to see the figure as printed. The frontend is done, and nothing is
drawn until the catalog sends marks.

## Wire format

Marks travel **on the figure's citation**, in the same `citation` / `citations` frames and the stored
`citations` column. A reloaded chat therefore shows them again with no extra storage.

```json
{
  "label": "F61",
  "kind": "figure",
  "entry_id": "40656246-145c-4347-835e-9443a7633ceb",
  "region_id": "32f764c6-da66-48d2-b341-e799c6eeb80d",
  "page": 486,
  "caption": "Figure 11.1: Decorator pattern in UML",
  "image_url": "https://…/regions/32f764c6-….webp",
  "marks": [
    { "shape": "box", "x0": 0.30, "y0": 0.02, "x1": 0.70, "y1": 0.30,
      "label": "Component interface", "note": "Both the core object and every decorator implement it." },
    { "shape": "arrow", "x0": 0.85, "y0": 0.75, "x1": 0.62, "y1": 0.30,
      "label": "Wraps", "note": "A decorator holds a component and delegates to it." },
    { "shape": "point", "x0": 0.21, "y0": 0.88, "label": "Core" }
  ]
}
```

| field            | notes |
|------------------|-------|
| `shape`          | `box`, `ellipse` (framed by x0,y0–x1,y1), `arrow` (from x0,y0 to x1,y1), `point` (x0,y0). |
| `x0 y0 x1 y1`    | Fractions of the **crop** (not the page), origin top-left, the same convention as a region's `bbox`. |
| `label`          | A few words (≤ 60 chars). |
| `note`           | One sentence (≤ 280 chars), shown in the legend. |

The portal treats marks as untrusted. It keeps known shapes only, clamps coordinates to 0–1, drops a mark
missing a coordinate it needs, and draws at most 12. Labels and notes are rendered as plain text.

## How the catalog can produce them

The model can't see pixels. Something has to turn "the interface box" into coordinates. Options, best first:

1. **`annotate_figure` tool backed by the multimodal image service.** The catalog already runs a multimodal
   model for region descriptions (`Region.description`, image-service captions). Add a tool
   `annotate_figure(label: "F61", targets: [{label, note, hint}])`. For each `hint` ("the Interface class
   box", "the arrow from Decorator1 to Interface"), ask a grounding-capable vision model (e.g. a Qwen-VL class
   model, which returns boxes in image coordinates) to locate it in the crop. Normalise the result to crop
   fractions and attach it to the citation as `marks`. The chat model only decides *what* to point at and
   *why*.
2. **OCR words inside the region.** If the extraction keeps word boxes (hOCR) for the region's area, the tool
   can match `hint` against the words ("Decorator1", "Core") and box them without a vision call. This is cheap
   and exact for labelled diagrams, UML and tables, but blind to unlabelled shapes.
3. **Table cells / equation parts.** For `table` regions with `markdown`, a mark can frame a row or column
   found by text; for equations, a term found in `latex`. Both need the cell or term geometry from extraction.

Suggested model-facing description: *"Draw marks on a figure you are showing, to point the reader at its parts.
Give the figure's F-label and, for each mark, what to point at (hint), a short label and a one-sentence note.
Use it when explaining a diagram, a chart or a table. At most 6 marks."*

After the tool runs, the turn's `citations` frame carries the figure with `marks`. A `citation` frame for
the label, sent again with the marks added, also works, because the portal merges by label. Nothing else changes:
the answer text still cites `[F61]`, and the figure card renders under the paragraph that cites it.

## Related

- Quiz items with a figure (IP-030 study, catalog issue on `study`) can reuse the same marks. A "which pattern is
  this?" question shows the crop, and the explanation after answering adds the marks.
- `portal_context.focus` tells the catalog which publication is open. "Show me the figure on this page" in the
  reader can pick the region by page.
