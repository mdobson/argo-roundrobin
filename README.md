Argo round robin module
======================

Simple argo round robin module. For use in my simple projects.

###Usage

```javascript
var argo = require('argo');
var roundrobin = require('argo-roundrobin');

var endpoints = ['http://foo.com', 'http://bar.com', 'http://baz.com'];
argo()
  .use(roundrobin(endpoints))
  .listejn(3000);
```
