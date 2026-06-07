import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'react-quill/dist/quill.snow.css';
import './styles/index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-900 dark:text-white' }} />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
