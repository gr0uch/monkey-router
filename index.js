'use strict'

// Browser checking.
var hasWindow = typeof window === 'object'

var internalState = '__router__'
var delimiter = '/'
var wildcard = '*'


module.exports = router


/**
 * This is the main entry point. It returns a function that is used to traverse
 * the routes.
 *
 * @param {Object} routes
 * @param {String} [prefix]
 * @return {Function}
 */
function router (routes, prefix) {
  var self = this
  var tree = buildTree({}, routes)

  if (prefix == null) prefix = ''

  if (hasWindow) {
    window.addEventListener('popstate', onpopstate)

    // Expose the event listener function so that it may be manually removed
    // later if needed.
    go.onpopstate = onpopstate
  }

  return go

  /**
   * Traverse the routes and invoke the functions in between. If a route is not
   * found, it will throw an error.
   *
   * @param {String} route
   * @param {Object} [state]
   */
  function go (route, state) {
    var scope = this || self
    var fns = []

    if (hasWindow) {
      if (state === void 0) state = {}
      state[internalState] = true
      window.history.pushState(state, '',
        delimiter + (prefix ? prefix + delimiter : '') + route)
    }

    traverse(tree, route.split(delimiter), fns, [])
    invoke(scope, fns, state)
  }

  // Internal event listener function.
  function onpopstate (event) {
    var state = event.state
    var fns = []

    if (!(state && internalState in state)) return

    traverse(tree, getParts(prefix), fns, [])
    invoke(self, fns, state)
  }
}


// Internal function to invoke route handler functions at once.
function invoke (scope, fns, state) {
  var i, j

  if (state === void 0)
    for (i = 0, j = fns.length; i < j; i++)
      fns[i][0].call(scope, fns[i][1])
  else
    for (i = 0, j = fns.length; i < j; i++)
      fns[i][0].call(scope, fns[i][1], state)
}


// Internal function to collect route handler functions.
// It calls itself recursively.
function traverse (tree, parts, fns, wildcards) {
  var fn

  if (parts[0] in tree)
    fn = tree[parts[0]]
  else if (wildcard in tree) {
    fn = tree[wildcard]
    wildcards.push(parts[0])
  }

  if (!fn) throw new Error('Route not found.')
  if (typeof fn === 'function') fns.push([ fn, wildcards.slice() ])

  if (parts.length > 1) {
    parts.shift()
    traverse(fn, parts, fns, wildcards)
  }
}


// Internal function to get the route based on window location.
function getParts (prefix) {
  var route = window.location.pathname.slice(1)

  return (prefix && route.indexOf(prefix) === 0 ?
    route.slice(prefix.length + delimiter.length) : route)
    .split(delimiter)
}


// Internal function to build the tree upon calling the main function.
// It calls itself recursively.
function buildTree (tree, routes) {
  var nested = {}
  var i, j, position, keys, key, rest

  keys = Object.keys(routes)

  for (i = 0, j = keys.length; i < j; i++) {
    position = keys[i].indexOf(delimiter)

    if (!~position) {
      key = keys[i]

      if (key in tree)
        throw new Error('The path "' + key + '" already exists.')

      tree[key] = routes[key]
    }
    else {
      key = keys[i].slice(0, position)
      rest = keys[i].slice(position + 1)

      if (!(key in tree)) tree[key] = {}
      if (!(key in nested)) nested[key] = {}

      nested[key][rest] = routes[keys[i]]
    }
  }

  keys = Object.keys(nested)

  for (i = 0, j = keys.length; i < j; i++) {
    key = keys[i]
    buildTree(tree[key], nested[key])
  }

  return tree
}
