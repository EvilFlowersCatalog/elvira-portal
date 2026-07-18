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
