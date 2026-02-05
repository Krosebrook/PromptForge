
const CACHE_NAME = 'promptforge-v2.3';

// External assets that the app depends on for styling and logic
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  // Note: esm.sh imports often redirect, making precise caching tricky without a build step.
  // We cache the entry points to speed up subsequent loads.
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0?deps=react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client?deps=react@18.2.0',
  'https://esm.sh/lucide-react@0.344.0?deps=react@18.2.0',
  'https://esm.sh/@google/genai@^1.34.0',
  'https://esm.sh/reactflow@11.10.4?deps=react@18.2.0,react-dom@18.2.0',
  'https://esm.sh/reactflow@11.10.4/dist/style.css',
  'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'
];

const LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/Sidebar.tsx',
  '/ChatStreamView.tsx',
  '/PromptEditor.tsx',
  '/SettingsModal.tsx',
  '/Modal.tsx',
  '/OnboardingWizard.tsx',
  '/TutorialOverlay.tsx',
  '/VersionHistory.tsx',
  '/SchemaBuilder.tsx',
  '/PipelineEditor.tsx',
  '/OnboardingAssistant.tsx',
  '/constants.ts',
  '/types.ts',
  '/documentation.ts',
  '/services/geminiService.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We try to cache local assets, but don't fail if one is missing (e.g. dynamic dev env)
      return cache.addAll([...LOCAL_ASSETS, ...EXTERNAL_ASSETS]).catch(e => console.warn("SW: Cache addAll warning", e));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // For external requests (CDN), use Stale-While-Revalidate
  const isExternal = event.request.url.startsWith('http') && !event.request.url.includes(self.location.origin);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (isExternal) {
        // Fetch and update cache in background
        const fetchPromise = fetch(event.request).then((networkResponse) => {
           if (networkResponse && networkResponse.status === 200) {
             const responseClone = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
             });
           }
           return networkResponse;
        }).catch(() => cachedResponse); // If fetch fails, return cached
        
        return cachedResponse || fetchPromise;
      }

      // For local assets, prefer cache but update if needed (simple Cache First here)
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
