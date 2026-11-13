// Guarda la app en el celular para que funcione sin internet.
// Cambia el número de versión cada vez que modifiques index.html para forzar la actualización.
const VERSION = 'cotizador-v2';
const PROPIOS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
const EXTERNOS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(PROPIOS);
    // Los externos no deben impedir la instalación si alguno falla
    await Promise.all(EXTERNOS.map(u => c.add(u).catch(() => null)));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const propio = new URL(req.url).origin === self.location.origin;
  const guardar = res => {
    if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
    return res;
  };
  if (propio) {
    // Archivos de la app: primero la red (para recibir actualizaciones), si no hay, lo guardado
    e.respondWith(fetch(req).then(guardar).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
  } else {
    // Librerías y fuentes: primero lo guardado, porque no cambian
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(guardar)));
  }
});
