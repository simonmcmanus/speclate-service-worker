var swSortFiles = require('./sort-files');

module.exports = function(spec) {

    var out = swSortFiles(spec);

    // we'll version our cache (and learn how to delete caches in
    // some other post)
    var cacheName = 'v1.2::static::';



    self.addEventListener('activate', event => {
         console.log('activated');
    });

    self.addEventListener('install', e => {
        console.log('installed');
        // once the SW is installed, go ahead and fetch the resources
        // to make this work offline

        e.waitUntil(
            [
                caches.open(cacheName + 'layout').then(cache => {
                    return cache.addAll(out.layout).then(() => self.skipWaiting());
                }),
                caches.open(cacheName + 'components').then(cache => {
                    return cache.addAll(out.components).then(() => self.skipWaiting());
                }),
                caches.open(cacheName + 'pages').then(cache => {
                    return cache.addAll(out.pages).then(() => self.skipWaiting());
                }),
                caches.open(cacheName + 'specs').then(cache => {
                    return cache.addAll(out.specs).then(() => self.skipWaiting());
                })
            ]
        )

        // when the browser fetches a url, either response with
        // the cached object or go ahead and fetch the actual url
        self.addEventListener('fetch', event => {
        // return event.respondWith(
        //   new Response('<h1>heading</h1>',
        //   { headers: {'Content-Type': 'text/html'} }
        // ));
            event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
        });
    })
}