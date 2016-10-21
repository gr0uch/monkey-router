# Monkey Router
[![Build Status](https://img.shields.io/travis/sapeien/monkey-router/master.svg?style=flat-square)](https://travis-ci.org/sapeien/monkey-router)
[![npm Version](https://img.shields.io/npm/v/monkey-router.svg?style=flat-square)](https://www.npmjs.com/package/monkey-router)
[![License](https://img.shields.io/npm/l/monkey-router.svg?style=flat-square)](https://raw.githubusercontent.com/sapeien/monkey-router/master/LICENSE)

Monkey router is a tree-structured router that traverses between the current route and the route to transition to, and invokes each of the intermediate route handlers. It works equally well in web browsers and Node.js, and the browser version adds History API support.

```
$ npm i monkey-router --save
```


## Usage

It accepts routes as an object, with wildcard routes defined as `*`:

```js
var router = require('monkey-router')

var go = router({
  // route functions should handle setup and teardown.
  // they will be invoked with three arguments:
  // `isEntering`, `parameters`, and `state`.
  'products': function () { ... },
  'products/*': function () { ... },
  'products/*/pictures': function () { ... },
  'pictures/*': function () { ... },

  // empty string is the index route.
  '': function () { ... }
}/*, prefix */)

// go to the route, without leading or trailing slashes, which invokes
// all of the intermediate route handlers to get to that route.
go('products/123/pictures', { /* state */ })
```

The second argument to router `prefix` is an optional string that determines what goes in front of the path, without the domain. This will automatically be applied when transitioning to a route. It must not contain leading or trailing slashes.

The functions defined as the route handlers will be invoked with three arguments:
- `isEntering`: a boolean value indicating whether it is a transition to (`true`) or away (`false`) from the route relative to the current route.
- `parameters`: an array containing the wildcard routes in order of appearance.
- `state`: history state which is passed as the second argument from the `go` function.


## How It Works

A tree structure is constructed internally based on the routes given. On going to a route, it traverses between the current and future branches of the tree and invokes the function defined at that branch. For example, if the route is `products/1/pictures` and the future route is `pictures`, then the functions for `products/*/pictures`, `products/*`, `products`, and `pictures` will be invoked in that order.

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

This software is licensed under the [MIT License](https://raw.githubusercontent.com/sapeien/monkey-router/master/LICENSE).
