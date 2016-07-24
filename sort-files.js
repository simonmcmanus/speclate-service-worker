module.exports = function(spec) {

  var layout = ['/pages/layout.html'];
  var components = [];
  var pages = [];
  var specs = [];

  Object.keys(spec).forEach(function (page) {
    // no de-duping going on - same page/component could be listed twice.
    var pageName = spec[page].page;
    var routeName = page.slice(0, -5);
    pages.push(page);
    // pages.push('/pages/' + pageName + '/' + pageName + '.html' );
    // specs.push('/api/speclate/' + routeName + '.json' );
    // for (var selector in spec[page].spec) {
    //   var component = spec[page].spec[selector].component;
    //   components.push('//components/' + component + '/' + component + '.html');
    // }
  });

  return {
    components: components,
    pages: pages,
    specs: specs,
    layout: layout
  }

}