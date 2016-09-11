#Speclate service worker


Given a speclate spec, works out which files are needed offline, and generates the service worker accordingly.

Also provides a network first strategy for specs to ensure users are always seeing the latest data.


```js

'use strict'
var serviceWorker = require('speclate-service-worker')
var spec = require('../spec')
var version = '1.6'

serviceWorker(spec, version)


```