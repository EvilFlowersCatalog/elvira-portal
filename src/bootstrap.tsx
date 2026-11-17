// Imported by main.tsx only after the runtime config (/config.json, #61) has loaded, so every module
// below may read `config` at load time.
// Browser tracing: before any other import can capture fetch/XHR (no-op without ELVIRA_FARO_URL).
import './lib/telemetry';
// The one analytics layer (Umami + Faro); loads the Umami tracker when configured.
import './lib/analytics';
import './lib/errorReference';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import BaseRoutes from './routes/BaseRoutes';
import AuthProvider from './providers/AuthProvider';
import AppProvider from './providers/AppProvider';
import CookiesProvider from './providers/CookiesProvider';
import { queryClient } from './lib/reactQuery';
import 'react-toastify/dist/ReactToastify.css';
import './main.css';

// For zotero to update
document.dispatchEvent(
  new Event('ZoteroItemUpdated', {
    bubbles: true,
    cancelable: true,
  })
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <CookiesProvider>
        <AppProvider>
          <AuthProvider>
            <BaseRoutes />
          </AuthProvider>
        </AppProvider>
      </CookiesProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
