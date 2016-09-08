var swSortFiles = require('./sort-files');
var url = require('url');

module.exports = function(spec, version) {

    var out = swSortFiles(spec);


    console.log('sorted files', out);
    var cacheName = 'v' + version + '::';
    var self = this;
    self.addEventListener('activate', event => {
         console.log('activated');
    });

    self.addEventListener('install', e => {
        // once the SW is installed, go ahead and fetch the resources
        // to make this work offline
        e.waitUntil(
            [
                caches.open(cacheName + 'layout').then(cache => {
                    // hash
                    return cache.addAll(out.layout);
                }),
                caches.open(cacheName + 'components').then(cache => {
                    // hash
                    return cache.addAll(out.components);
                }),
                caches.open(cacheName + 'pages').then(cache => {
                    // hash
                    return cache.addAll(out.pages);
                }),
                caches.open(cacheName + 'specs').then(cache => {
                    // can these be version?
                    return cache.addAll(out.specs);
                }),
                caches.open(cacheName + 'extras').then(cache => {

                    // these files should be hashed.
                    return cache.addAll(out.extras);
                }),
                caches.open(cacheName + 'routes').then(cache => {

                    fetch('/pages/layout.html').then(function(layout) {

                        out.routes.forEach(function(route) {

                            cache.put(route, layout.clone());
                        })
                    });
                })
            ]
        )
    })

    // when the browser fetches a url, either response with
    // the cached object or go ahead and fetch the actual url
    self.addEventListener('fetch', event => {
        var request = event.request;
        var urlObj = url.parse(request.url);


        var key = urlObj.pathname.slice(1);


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
            // return  fetch(event.request).catch((e) => {
            //     console.log('caught', e)
            // })
            return event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
        }
    });


}
// remove old keys from the cache
var cleanup = function(cacheKey) {

    caches.keys().then(function(cacheNames) {
    return Promise.all(
        cacheNames.map(function(cacheName) {
        if(cacheName.slice(0, cacheKey.length) != cacheKey) {
            return caches.delete(cacheName);
        }
        })
    );
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