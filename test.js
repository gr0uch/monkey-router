'use strict'

const hasWindow = typeof window === 'object'
const tapdance = require('tapdance')
const router = require('./')

const run = tapdance.run
const comment = tapdance.comment
const ok = tapdance.ok

run(() => {
  comment('router setup')

  let index = 0
  let products = 0
  let productsDetail = 0
  let productPictures = 0
  let picturesDetail = 0

  const go = router.call({ foo: 'bar' }, {
    '': function indexHandler (isEntering) {
      if (isEntering) index++
      else index--
    },
    'products': function productsHandler (isEntering) {
      if (isEntering) products++
      else products--
    },
    'products/*': function productsDetailHandler (isEntering, parameters) {
      if (isEntering) productsDetail++
      else productsDetail--

      if (isEntering) {
        ok(parameters[0] === '123', 'parameter is correct')
      }
    },
    'products/*/pictures':
    function productPicturesHandler (isEntering, parameters, state) {
      if (isEntering) productPictures++
      else productPictures--

      if (isEntering) {
        if (hasWindow) {
          ok(state.baz === 'qux', 'state is passed')
        }

        ok(this.foo === 'baz', 'context is correct')
        ok(parameters[0] === '123', 'parameter is correct')
      }
    },
    'pictures/*': function picturesDetailHandler (isEntering, parameters) {
      if (isEntering) picturesDetail++
      else picturesDetail--

      ok(this.foo === 'bar', 'context is correct')
      if (isEntering) {
        ok(parameters[0] === 'abc', 'parameter is correct')
      }
    }
  }, 'prefix')

  go('products')
  ok(products === 1, 'route handler invoked')

  go('products/123')
  ok(products === 1, 'route handler not invoked')
  ok(productsDetail === 1, 'route handler invoked')

  go.call({ foo: 'baz' }, 'products/123/pictures', { baz: 'qux' })
  ok(products === 1, 'route handler not invoked')
  ok(productsDetail === 1, 'route handler not invoked')
  ok(productPictures === 1, 'route handler invoked')

  go('products/123')
  ok(products === 1, 'route handler not invoked')
  ok(productsDetail === 1, 'route handler not invoked')
  ok(productPictures === 0, 'route handler invoked')

  go('pictures/abc')
  ok(products === 0, 'route handler invoked')
  ok(productsDetail === 0, 'route handler invoked')
  ok(picturesDetail === 1, 'route handler invoked')

  return !hasWindow ? null : new Promise(resolve => {
    comment('browser testing')

    ok(window.history.length === 6, 'history events created')
    ok(window.location.pathname === '/prefix/pictures/abc', 'prefix used')
    window.history.back()

    // The `popstate` event runs at some arbitrary time in the future,
    // depending on the browser. To be safe, it waits for some time.
    setTimeout(() => {
      ok(window.location.pathname === '/prefix/products/123', 'correct route')
      ok(products === 1, 'route handler invoked')
      ok(productsDetail === 1, 'route handler invoked')
      ok(productPictures === 0, 'route handler invoked')
      ok(picturesDetail === 0, 'route handler invoked')
      resolve()
    }, 100)
  })
})
