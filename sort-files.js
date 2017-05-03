module.exports = function (spec) {
  var layout = [ '/pages/layout.html' ]
  var components = []
  var pages = []
  var routes = ['/']
  var specs = []

  Object.keys(spec).forEach(function (page) {
    // no de-duping going on - same page/component could be listed twice.

    if (page === 'options' || page === 'defaultSpec') {
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

    if (pageName) {
      pages.push('/pages/' + pageName + '/' + pageName + '.html')
    }

    specs.push('/api/speclate' + routeName + '.json')

    components = components.concat(getComponents(spec[page].spec))
  })
  if (spec.defaultSpec) {
    components = components.concat(getComponents(spec.defaultSpec))
  }

  return {
    components: components,
    pages: pages,
    routes: routes,
    specs: specs,
    layout: layout,
    extras: spec.options.files
  }
}


function getComponents (spec) {
  var components = []
  for (var selector in spec) {
    var component = spec[selector].component
    if (component) {
      components.push('/components/' + component + '/' + component + '.html')
    }
  }
  return components
}
