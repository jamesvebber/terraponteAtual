import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import ErrorBoundary from '@/components/ErrorBoundary'

// Redirect builder domain to production domain
const host = window.location.hostname;
if (host === 'terraponte.base44.app') {
  const prodUrl = 'https://terraponte.app' + window.location.pathname + window.location.search + window.location.hash;
  window.location.replace(prodUrl);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)