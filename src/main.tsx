// App bootstrap + React Query + Router + AuthProvider + global CSS
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { startDevToolsProtection } from './lib/devtools-protection';

// Enable DevTools protection in production
if (import.meta.env.PROD) {
  startDevToolsProtection();
}

const qc = new QueryClient();

const routerOptions: any = {
  // Opt-in to v7 future behaviors to silence deprecation warnings
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
};

const router = createBrowserRouter([
  { path: '/*', element: <App /> },
], routerOptions);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);