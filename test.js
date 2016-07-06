'use strict'

const hasWindow = typeof window === 'object'
const tapdance = require('tapdance')
const router = require('./')

const run = tapdance.run
const comment = tapdance.comment
const ok = tapdance.ok
const delay = 100 // ms

run(() => {
  comment('router setup')

  let products = 0, pictures = 0
  const go = router.call({ foo: 'bar' }, {
    [ 'products' ] () {
      products++
    },
    [ 'products/*' ] (parameters) {
      ok(parameters[0] === '123', 'parameter is correct')
      products++
    },
    [ 'products/*/pictures' ] (parameters, state) {
      if (hasWindow) ok(state.baz === 'qux', 'state is passed')
      ok(this.foo === products > 6 ? 'bar' : 'baz', 'context is correct')
      ok(parameters[0] === '123', 'parameter is correct')
      products++
    },
    [ 'pictures/*' ] (parameters) {
      ok(this.foo === 'bar', 'context is correct')
      ok(parameters[0] === 'abc', 'parameter is correct')
      pictures++
    }
  }, 'prefix')

  go('products')
  ok(products === 1, 'route handler invoked')

  go('products/123')
  ok(products === 3, 'route handlers invoked')

  go.call({ foo: 'baz' }, 'products/123/pictures', { baz: 'qux' })
  ok(products === 6, 'route handlers invoked')

  go('pictures/abc')
  ok(pictures === 1, 'route handlers invoked')

  return !hasWindow ? null : new Promise(resolve => {
    comment('browser testing')

    ok(window.history.length === 5, 'history events created')
    ok(window.location.pathname === '/prefix/pictures/abc', 'prefix used')
    window.history.back()

    // The `popstate` event works asynchronously.
    setTimeout(() => {
      ok(products === 9, 'route handlers invoked')
      resolve()
    }, delay)
  })
})
