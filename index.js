var swSortFiles = require('./sort-files')

module.exports = function (spec, version) {
  spec = spec.options.scanSpecForFiles(spec, true)
  var out = swSortFiles(spec)
  var cacheName = 'v' + version + '::'
  var self = this

  self.addEventListener('install', e => {
        // once the SW is installed, go ahead and fetch the resources
        // to make this work offline
    e.waitUntil(
      [
        caches.open(cacheName + 'layout').then(cache => {
          return cache.addAll(out.layout)
        }),
        caches.open(cacheName + 'components').then(cache => {
          return cache.addAll(out.components)
        }),
        caches.open(cacheName + 'pages').then(cache => {
          return cache.addAll(out.pages)
        }),
        caches.open(cacheName + 'specs').then(cache => {
                    // can these be version?
          return cache.addAll(out.specs)
        }),
        caches.open(cacheName + 'extras').then(cache => {
                    // these files should be hashed.
          return cache.addAll(out.extras)
        }),
        caches.open(cacheName + 'routes').then(cache => {
          fetch('/pages/layout.html').then(function (layout) {
            out.routes.forEach(function (route) {
              cache.put(route, layout.clone())
            })
          })
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
                fetch(request)
                    .then(response => response)
                    .then(response => addToCache(cacheName + 'specs', request, response))
                    .catch(() => {
                        // fallback to the cache.
                      return caches
                                .match(request)
                                .then(response => response)
                    })
            )
    } else {
      return event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)))
    }
  })

  self.addEventListener('activate', event => {
    event.waitUntil(
            caches.keys()
            .then(function (keys) {
              return Promise.all(keys
                .filter(function (key) {
                  return key.indexOf(cacheName) !== 0
                })
                .map(function (key) {
                  return caches.delete(key)
                })
                )
            })
        )
    console.log('activated and cache updated')
  })
}

var addToCache = function (cacheKey, request, response) {
  if (response.ok) {
    var copy = response.clone()
    caches.open(cacheKey).then(cache => {
      cache.put(request, copy)
    })
    return response
  }
  return false
}

