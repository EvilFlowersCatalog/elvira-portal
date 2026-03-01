import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import BaseRoutes from './routes/BaseRoutes';
import AuthProvider from './providers/AuthProvider';
import AppProvider from './providers/AppProvider';
import CookiesProvider from './providers/CookiesProvider';
import 'react-toastify/dist/ReactToastify.css';
import './main.css';
import 'swiper/swiper-bundle.css';

// For zotero to update
document.dispatchEvent(
  new Event('ZoteroItemUpdated', {
    bubbles: true,
    cancelable: true,
  })
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <CookiesProvider>
      <AppProvider>
        <AuthProvider>
          <BaseRoutes />
        </AuthProvider>
      </AppProvider>
    </CookiesProvider>
  </BrowserRouter>
);
