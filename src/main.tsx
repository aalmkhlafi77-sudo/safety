import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { initRuntimeDiagnostics } from './utils/diagnostics.ts';
import './index.css';

// Initialize safe unhandled error listener and service worker cache protection
initRuntimeDiagnostics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);


