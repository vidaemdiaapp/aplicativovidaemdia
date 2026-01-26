import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical mounting error:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px; font-family: sans-serif;">
      <h2 style="margin-top: 0;">Oops! Algo deu errado.</h2>
      <p>Erro no carregamento do app. Verifique os logs do navegador.</p>
      <pre style="white-space: pre-wrap; font-size: 12px;">${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
