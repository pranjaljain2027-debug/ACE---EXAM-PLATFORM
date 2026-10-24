import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the PWA service worker to cache core reasoning activities and assets
// autoUpdate reloads the page once a new version is installed. Check for one on every load and hourly,
// so a deploy is picked up on the next visit instead of whenever the browser decides to look.
registerSW({
  immediate: true,
  onRegisteredSW(_url, r) {
    if (!r) return;
    r.update().catch(() => undefined);
    window.setInterval(() => r.update().catch(() => undefined), 60 * 60 * 1000);
  },
  onNeedRefresh() {
    console.info('[Heir of Wisdom PWA] Updated activities or assets available.');
  },
  onOfflineReady() {
    console.info('[Heir of Wisdom PWA] Core reasoning activities cached and ready for offline exploration.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
