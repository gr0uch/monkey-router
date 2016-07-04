'use strict'

const tapdance = require('tapdance')
const router = require('./')

const { run, comment, ok } = tapdance

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
    [ 'products/*/pictures' ] (parameters) {
      ok(this.foo === 'baz', 'context is correct')
      ok(parameters[0] === '123', 'parameter is correct')
      products++
    },
    [ 'pictures/*' ] (parameters) {
      ok(this.foo === 'bar', 'context is correct')
      ok(parameters[0] === 'abc', 'parameter is correct')
      pictures++
    }
  })

  go('products')
  ok(products === 1, 'route handler invoked')

  go('products/123')
  ok(products === 3, 'route handlers invoked')

  go.call({ foo: 'baz' }, 'products/123/pictures')
  ok(products === 6, 'route handlers invoked')

  go('pictures/abc')
  ok(pictures === 1, 'route handlers invoked')
})
