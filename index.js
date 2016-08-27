var swSortFiles = require('./sort-files');

module.exports = function(spec, version, extraFiles) {

    var out = swSortFiles(spec);

    var cacheName = 'v' + version + '::';
    var self = this;
    self.addEventListener('activate', event => {
         //console.log('activated');
    });

    self.addEventListener('install', e => {
        // once the SW is installed, go ahead and fetch the resources
        // to make this work offline
        e.waitUntil(
            [
                caches.open(cacheName + 'layout').then(cache => {
                    return cache.addAll(out.layout).then(() => self.skipWaiting());
                }),
                caches.open(cacheName + 'components').then(cache => {
                    return cache.addAll(out.components);
                }),
                caches.open(cacheName + 'pages').then(cache => {
                    return cache.addAll(out.pages);
                }),
                caches.open(cacheName + 'specs').then(cache => {
                    return cache.addAll(out.specs);
                }),
                caches.open(cacheName + 'extras').then(cache => {
                    return cache.addAll(extraFiles);
                })
            ]
        )

    })


        // when the browser fetches a url, either response with
    // the cached object or go ahead and fetch the actual url
    self.addEventListener('fetch', event => {
        var request = event.request
        if (request.url.indexOf('/api/speclate') > 0) {
            return event.respondWith(
                // try the network first
                fetch(request)
                    .then( response => response)
                    .then( response => addToCache(cacheName + 'specs', request, response))
                    .catch( () => {
                        // fallback to the cache.
                        return caches.match(request).then(response => response);
                    })
            );
        } else {
            return event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
        }
    });

}


var addToCache = function(cacheKey, request, response) {

  if (response.ok) {
    var copy = response.clone();
    caches.open(cacheKey).then( cache => {
      cache.put(request, copy);
    });
    return response;
  }
  return false;

};