
module.exports = function (files, version) {
  var cacheName = 'v' + version + '::'
  var self = this

  self.addEventListener('install', e => {
    // once the SW is installed, go ahead and fetch the resources
    // to make this work offline
    e.waitUntil(
      [
        caches.open(cacheName + 'layout').then(cache => {
          return cache.addAll(files.layout)
        }),
        caches.open(cacheName + 'components').then(cache => {
          var componentPaths = files.components.map(function (component) {
            console.log('->', '/components/' + component)
            return '/components/' + component
          })
          return cache.addAll(componentPaths)
        }),
        caches.open(cacheName + 'pages').then(cache => {
          var pagePaths = files.pages.map(function (page) {
            return '/pages/' + page
          })
          return cache.addAll(pagePaths)
        }),
        caches.open(cacheName + 'specs').then(cache => {
          return cache.addAll(files.specs)
        }),
        caches.open(cacheName + 'extras').then(cache => {
          if (files.extras) {
            return cache.addAll(files.extras)
          } else {
            return cache
          }
        }),
        caches.open(cacheName + 'routes').then(cache => {
          files.routes.forEach(function (route) {
            if (route === '/') {
              route = '/index.html'
            }

            fetch(route).then(function (page) {
              // should we add the blurred class before we add the page to the cache
              cache.put(route, page.clone())
            })
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
        return matching || Promise.reject(new Error('no-match'))
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
          return Promise
            .all(
              keys
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
