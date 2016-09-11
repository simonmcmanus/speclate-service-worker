module.exports = function (spec) {
  var layout = [ '/pages/layout.html' ]
  var components = []
  var pages = []
  var routes = ['/']
  var specs = []

  Object.keys(spec).forEach(function (page) {
    // no de-duping going on - same page/component could be listed twice.

    if (page === 'options') {
      return
    }
    var pageName = spec[page].page
    var routeName
    if (page === '/') {
      routeName = 'index'
    } else {
      routeName = page.slice(0, -5)
    }
    routes.push(page)
    pages.push('/pages/' + pageName + '/' + pageName + '.html')

    specs.push('/api/speclate' + routeName + '.json')
    for (var selector in spec[page].spec) {
      var component = spec[page].spec[selector].component
      components.push('/components/' + component + '/' + component + '.html')
    }
  })

  return {
    components: components,
    pages: pages,
    routes: routes,
    specs: specs,
    layout: layout,
    extras: spec.options.files
  }
}
