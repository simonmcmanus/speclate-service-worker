var swSortFiles = require('./sort-files')

module.exports = function (spec, version) {
  if (spec.options.scanSpecForFiles) {
    spec = spec.options.scanSpecForFiles(spec, true)
  }
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
          return cache.addAll(out.specs)
        }),
        caches.open(cacheName + 'extras').then(cache => {
          if (out.extras) {
            return cache.addAll(out.extras)
          } else {
            return cache
          }
        }),
        caches.open(cacheName + 'routes').then(cache => {
          out.routes.forEach(function (route) {
            if (route === '/') {
              route = '/index.html'
            }

            if (spec[route].strategy === 'app-shell') {
              fetch('/pages/layout.html').then(function (layout) {
                cache.put(route, layout.clone())
              })
            } else {
              fetch(route).then(function (page) {
                // should we add the blurred class before we add the page to the cache
                cache.put(route, page.clone())
              })
            }
          })
        })
      ])
  })

  self.addEventListener('fetch', event => {
    var request = event.request

    if (request.url.indexOf('.json') > 0) {
      event.respondWith(fromCache(event.request))
      event.waitUntil(
          update(event.request)

          .then(refresh)
      )
    } else {
      return event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)))
    }
  })

  /**
   * Loads the item from the cache.
   * @param {*} request
   */
  function fromCache (request) {
    return caches.open(cacheName + 'specs').then(function (cache) {
      return cache.match(request).then(function (matching) {
        return matching || Promise.reject('no-match')
      })
    })
  }

  /**
   * update the value in the cache.
   * @param {*} request
   */
  function update (request) {
    return caches.open(cacheName + 'specs').then(function (cache) {
      return fetch(request).then(function (response) {
        return cache.put(request, response.clone()).then(function () {
          return response
        })
      })
    })
  }

  /**
   * Notify the user that the item has changed.
   * @param {*} response
   */
  function refresh (response) {
    return self.clients.matchAll().then(function (clients) {
      clients.forEach(function (client) {
        // console.log(response)
        var message = {
          type: 'spec-refresh',
          url: response.url,
          eTag: response.headers.get('ETag')
        }
        client.postMessage(JSON.stringify(message))
      })
    })
  }

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
  })
}
