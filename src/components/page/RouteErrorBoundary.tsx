import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** True when the failure looks like a lazy chunk that failed to load. */
  isChunkError: boolean;
}

/**
 * Catches render-time errors in the routed subtree. Most importantly it recovers
 * from failed lazy-chunk loads (a network blip while `React.lazy` fetches a
 * route chunk) — without this, code-splitting turns a transient failure into a
 * blank white screen. Self-contained (no context/i18n) so it still renders when
 * the surrounding app is broken.
 */
class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkError =
      /dynamically imported module|Loading chunk|Importing a module script failed/i.test(
        message
      );
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Route error boundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className='flex flex-1 h-full flex-col items-center justify-center gap-4 p-6 text-center text-black dark:text-white'>
        <h1 className='text-2xl font-bold'>Something went wrong</h1>
        <p className='max-w-md text-sm text-zinc-600 dark:text-zinc-400'>
          {this.state.isChunkError
            ? 'This part of the app failed to load — that usually means a network hiccup or a new version was deployed. Reloading fixes it.'
            : 'An unexpected error occurred while rendering this page.'}
        </p>
        <button
          type='button'
          onClick={() => window.location.reload()}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-onPrimary transition-opacity hover:opacity-90'
        >
          Reload
        </button>
      </div>
    );
  }
}

export default RouteErrorBoundary;
