
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make sure we handle potential null by using an error message
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Failed to find the root element");
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error loading the extension. Please reload.</div>';
} else {
  createRoot(rootElement).render(<App />);
}
