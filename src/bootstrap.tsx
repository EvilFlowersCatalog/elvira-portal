// Imported by main.tsx only after the runtime config (/config.json, #61) has loaded, so every module
// below may read `config` at load time.
// Browser tracing: before any other import can capture fetch/XHR (no-op without ELVIRA_FARO_URL).
import './lib/telemetry';
// The one analytics layer (Umami + Faro); loads the Umami tracker when configured.
import './lib/analytics';
import './lib/errorReference';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/router';
import { queryClient } from './lib/reactQuery';
import 'react-toastify/dist/ReactToastify.css';
import './main.css';

// The data router (routes/router.tsx) owns navigation; the providers that need it live in its root route.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
