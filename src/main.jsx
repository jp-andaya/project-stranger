import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Web shell — replaces the prototype's <IOSDevice> frame. The .app element is
// position:absolute/inset:0, so it needs a positioned host (.app-device).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="app-root">
      <div className="app-device">
        <App />
      </div>
    </div>
  </StrictMode>
);
