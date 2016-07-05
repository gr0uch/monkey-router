# Monkey Router
[![Build Status](https://img.shields.io/travis/0x8890/monkey-router/master.svg?style=flat-square)](https://travis-ci.org/0x8890/monkey-router)
[![npm Version](https://img.shields.io/npm/v/monkey-router.svg?style=flat-square)](https://www.npmjs.com/package/monkey-router)
[![License](https://img.shields.io/npm/l/monkey-router.svg?style=flat-square)](https://raw.githubusercontent.com/0x8890/monkey-router/master/LICENSE)

Monkey router is a tree-structured router that traverses all of the branches of a route and invokes each of the intermediate route handlers. Works also in Node.js for single route dispatching.

```
$ npm i monkey-router --save
```


## Usage

It accepts routes as an object, with wildcard routes defined as `*`:

```js
var router = require('monkey-router')

var go = router({
  'products': function () { ... },
  'products/*': function () { ... },
  'products/*/pictures': function () { ... },
  'pictures/*': function () { ... }
}, /* prefix */)

// go to the route, without leading or trailing slashes, which invokes all of
// the intermediate route handlers to get to that route.
go('products/123/pictures')
```

The `prefix` is an optional string that determines what goes in front of the path, without the domain. This will automatically be applied when transitioning to a route. It must not contain leading or trailing slashes.

The functions defined as the route handlers will be invoked with one argument: an array containing the wildcard routes in order of appearance.


## How It Works

A tree structure is constructed internally based on the routes given. On going to a route, it traverses each branch of the tree and runs the function defined at that branch. For example, if the route is `products/1/pictures`, then the functions for `products`, `products/*`, and `products/*/pictures` will be invoked.

Function scope is preserved. For example, these work:

```js
var scope = { foo: 'bar' }
var go = router.call(scope, {
  'route': function () { console.log(this.foo) }
})

go('route') // logs 'bar'
go.call({ foo: 'baz' }, 'route') // logs 'baz'
```

If a missing route is traversed to, no functions will be invoked and an error will be  thrown.


## License

This software is licensed under the [MIT License](https://raw.githubusercontent.com/0x8890/monkey-router/master/LICENSE).
