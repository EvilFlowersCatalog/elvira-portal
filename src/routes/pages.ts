/**
 * Page modules that are also loaded ahead of navigation. The router's `lazy` and the preloads share these
 * functions, so a preload warms exactly the chunk the route will ask for.
 */
export const loadViewer = () => import('../pages/common/Viewer');
export const loadEntryPage = () => import('../pages/common/EntryPage');

export const loadEntryDialog = () => import('../components/items/entry/details/EntryDetail');

/** The publication dialog's code, when a card is hovered or focused (the dialog opens without waiting). */
export const preloadEntryDialog = () => {
  loadEntryDialog().catch(() => undefined);
};

/** Start downloading the reader (~the largest chunk) when a "Read" control is hovered or focused. */
export const preloadReader = () => {
  loadViewer().catch(() => undefined);
};
