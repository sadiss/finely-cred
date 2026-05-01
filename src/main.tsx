import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const __fc_mountEl = document.getElementById('app');

try {
  if (!__fc_mountEl) {
    throw new Error('Mount element #app not found');
  }
  ReactDOM.createRoot(__fc_mountEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e: any) {
  throw e;
}
