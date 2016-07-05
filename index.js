'use strict'

var hasWindow = typeof window === 'object'
var delimiter = '/'
var wildcard = '*'


module.exports = router


function router (routes, prefix) {
  var self = this
  var tree = buildTree({}, routes)

  if (prefix == null) prefix = ''

  if (hasWindow) {
    go.onpopstate = onpopstate
    window.addEventListener('popstate', onpopstate)
  }

  return go

  function go (route) {
    var scope = this || self
    var fns = []

    if (hasWindow)
      window.history.pushState({
        '__router__': true
      }, '', delimiter + (prefix ? prefix + delimiter : '') + route)

    traverse(tree, route.split(delimiter), fns, [])
    invoke(scope, fns)
  }

  function onpopstate (event) {
    var state = event.state
    var fns = []

    if (!(state && '__router__' in state)) return

    traverse(tree, getParts(prefix), fns, [])
    invoke(self, fns)
  }
}


function invoke (scope, fns) {
  var i, j

  for (i = 0, j = fns.length; i < j; i++)
    fns[i][0].call(scope, fns[i][1])
}


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


function getParts (prefix) {
  var route = window.location.pathname.slice(1)

  return (prefix && route.indexOf(prefix) === 0 ?
    route.slice(prefix.length + delimiter.length) : route)
    .split(delimiter)
}


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
