// Nama cache, ubah jika ada pembaruan besar pada aset
const CACHE_NAME = 'ramalan-chiamsi-v4';

// Aset inti yang akan di-cache saat instalasi
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Inter:wght@400;600;700&display=swap',
  'https://placehold.co/192x192/9c1c26/FFFFFF?text=CS',
  'https://placehold.co/512x512/9c1c26/FFFFFF?text=CS'
];

// Event 'install': Aset inti di-cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event 'activate': Membersihkan cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Event 'fetch': Menyajikan aset dari cache atau jaringan
self.addEventListener('fetch', event => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Strategi: Network falling back to cache
  // Mencoba mengambil dari jaringan terlebih dahulu. Jika berhasil, simpan ke cache.
  // Jika gagal (offline), sajikan dari cache.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Periksa apakah kita menerima respons yang valid
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Penting: gandakan respons. Satu untuk browser, satu untuk cache.
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Jika fetch gagal (misalnya, offline), coba cari di cache
        return caches.match(event.request)
          .then(response => {
            // Jika ada di cache, kembalikan. Jika tidak, akan menjadi error standar.
            if (response) {
              return response;
            }
          });
      })
  );
});
