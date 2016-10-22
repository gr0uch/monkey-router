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
  var currentRoute = [ '' ]

  if (prefix === void 0) prefix = ''

  if (hasWindow) {
    window.addEventListener('popstate', onpopstate)

    // Set initial route.
    if (window.location.pathname.length > 1)
      currentRoute = window.location.pathname.split(delimiter)

    // Expose the event listener function so that it may be manually removed
    // later if needed.
    go.onpopstate = onpopstate
  }

  // Expose internal route state.
  go.currentRoute = currentRoute

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
    var nextRoute

    if (hasWindow) {
      if (state === void 0) state = {}
      state[internalState] = true

      // Push the new route in the browser, along with the internal state.
      window.history.pushState(state, '',
        delimiter + (prefix ? prefix + delimiter : '') + route)
    }

    nextRoute = route.split(delimiter)
    traverse(tree, currentRoute, nextRoute.slice(), fns, [])
    invoke(scope, fns, state)
    currentRoute = nextRoute
  }

  // Internal event listener function.
  function onpopstate (event) {
    var state = event.state
    var fns = []
    var nextRoute

    // Ignore any external history events.
    if (!(state && internalState in state)) return

    nextRoute = getParts(prefix)
    traverse(tree, currentRoute, nextRoute.slice(), fns, [])
    invoke(self, fns, state)
    currentRoute = nextRoute
  }
}


// Internal function to invoke route handler functions at once.
function invoke (scope, fns, state) {
  var i, tuple

  for (i = fns.length - 1; i >= 0; i--) {
    tuple = fns[i]
    tuple[0].call(scope, tuple[1], tuple[2], state)
  }
}


// Internal function to collect route handler functions.
// It calls itself recursively on each iteration.
function traverse (tree, currentRoute, parts, fns, wildcards) {
  var i, j, key
  var branch = tree
  var isEntering = false
  var isHalting = false

  // Get the current branch by traversing the route tree.
  for (i = 0, j = parts.length; i < j; i++)
    if (parts[i] in branch)
      branch = branch[parts[i]]
    else if (wildcard in branch) {
      branch = branch[wildcard]
      wildcards.push(parts[i])
    }
    else throw new Error('Route not found for "' + parts[i] + '".')

  // Try to iteratively turn the current state into the final state.
  i = Math.max(parts.length, currentRoute.length) - 1
  if (!(i in parts))
    if (parts.length &&
      parts[parts.length - 1] !== currentRoute[parts.length - 1]) {
      isEntering = true
      parts.pop()
    }
    else {
      parts.push(currentRoute[parts.length])
      key = parts[parts.length - 1]
      if (key in branch) branch = branch[key]
      else branch = branch[wildcard]
    }
  else if (!(i in currentRoute) || parts[i] !== currentRoute[i]) {
    isEntering = true
    parts.pop()
  }
  else isHalting = true

  if (!isHalting) {
    if (typeof branch === 'function')
      fns.push([ branch, isEntering, wildcards.slice() ])

    traverse(tree, currentRoute, parts, fns, wildcards)
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

      if (typeof routes[key] !== 'function')
        throw new TypeError('Route handler must be a function.')

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
