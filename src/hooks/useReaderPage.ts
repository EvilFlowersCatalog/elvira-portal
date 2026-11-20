import { useSyncExternalStore } from 'react';
import type { ViewerController } from '../pages/common/Viewer';

const noSubscribe = () => () => {};
const noState = () => null;

/**
 * The page the reader shows, read from the mounted viewer's state (EvilFlowersViewer docs/host-integration.md,
 * elvira-portal#64): `getState()` keeps its identity until something changes, so it is a snapshot for
 * `useSyncExternalStore` and nothing is mirrored from callbacks. Null until the viewer is mounted and shows
 * a page.
 */
export default function useReaderPage(viewer: ViewerController | null): number | null {
  const state = useSyncExternalStore(
    viewer?.subscribe ?? noSubscribe,
    viewer ? viewer.getState : noState,
  );
  return state?.page || null;
}
