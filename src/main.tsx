import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the PWA service worker to cache core reasoning activities and assets
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[Heir of Wisdom PWA] Updated activities or assets available.');
  },
  onOfflineReady() {
    console.info('[Heir of Wisdom PWA] Core reasoning activities cached and ready for offline exploration.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
