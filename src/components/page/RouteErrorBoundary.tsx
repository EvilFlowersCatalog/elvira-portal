import { Component, ErrorInfo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import i18next from 'i18next';
import { currentTraceId, reportRenderError } from '../../lib/telemetry';
import { config } from '../../lib/config';
import { trackRenderError } from '../../lib/analytics';

interface Props {
  children: ReactNode;
  /** The boundary resets when this changes (the pathname), so navigating away recovers. */
  resetKey: string;
}

interface State {
  hasError: boolean;
  /** True when the failure looks like a lazy chunk that failed to load. */
  isChunkError: boolean;
  /** The trace of the screen that broke (Faro on), quoted like the "Ref" on error toasts. */
  traceId?: string;
}

/**
 * Catches render-time errors in the routed subtree. Most importantly it recovers from failed
 * lazy-chunk loads (a network blip while `React.lazy` fetches a route chunk). Without it,
 * code-splitting turns a transient failure into a blank white screen.
 *
 * Reports to Faro as `kind=exception`, type `render`, with the component stack (#60). Not
 * `FaroErrorBoundary`: that one calls the Faro API unguarded, so on a build without a receiver it
 * would throw from inside the error handler, and it cannot reset on navigation. Context-free
 * (i18next directly, no providers) so it still renders when the surrounding app is broken.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkError = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(message);
    return { hasError: true, isChunkError, traceId: currentTraceId() };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Route error boundary caught:', error, info.componentStack);
    reportRenderError(error, info.componentStack);
    // The error screen itself, in Umami and Faro, with the trace the reader can quote.
    trackRenderError(this.state.isChunkError ? 'chunk' : 'render', this.state.traceId);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, isChunkError: false, traceId: undefined });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const t = (key: string) => i18next.t(`errorBoundary.${key}`);

    return (
      <div
        role='alert'
        className='flex flex-1 h-full flex-col items-center justify-center gap-4 p-6 text-center text-black dark:text-white'
      >
        <h1 className='text-2xl font-bold'>{t('title')}</h1>
        <p className='max-w-md text-sm text-zinc-600 dark:text-zinc-400'>{t(this.state.isChunkError ? 'chunk' : 'render')}</p>
        <button
          type='button'
          onClick={() => window.location.reload()}
          className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-onPrimary transition-opacity hover:opacity-90'
        >
          {t('reload')}
        </button>
        {this.state.traceId && (
          <p className='text-xs text-zinc-600 dark:text-zinc-400'>
            {t('reference')}{' '}
            <span className='select-all font-mono'>Ref {this.state.traceId}</span>
          </p>
        )}
      </div>
    );
  }
}

/**
 * Development only: `?__throw=<flag>` breaks the content inside one boundary, to check its fallback and
 * Faro record (#60). `render` = the App boundary, `admin` = the AdminLayout boundary.
 */
const DEV_THROW = import.meta.env.DEV || config.ELVIRA_FARO_ENVIRONMENT === 'development';
const ThrowOnFlag = ({ search, flag }: { search: string; flag: string }) => {
  if (new URLSearchParams(search).get('__throw') === flag) throw new Error(`Test render error (__throw=${flag})`);
  return null;
};

/** One per layout (App, AdminLayout), so a broken page keeps the navigation around it usable. */
const RouteErrorBoundary = ({ children, testFlag = 'render' }: { children: ReactNode; testFlag?: string }) => {
  const { pathname, search } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      {DEV_THROW && <ThrowOnFlag search={search} flag={testFlag} />}
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
