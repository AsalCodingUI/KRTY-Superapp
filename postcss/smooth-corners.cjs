/**
 * postcss-smooth-corners 0.1.1, vendored as CommonJS.
 *
 * The npm package is ESM-only, and Next's webpack PostCSS loader calls
 * `require(plugin)(options)`, which breaks `next build` (Turbopack dev is
 * fine). Same code, `module.exports` instead of `export default`, plus a
 * guard so pill radii (rounded-full) are never squircled or scaled.
 *
 * MIT License, Copyright 2026 Andrey Sitnik <andrey@sitnik.es>
 * https://github.com/postcss/postcss-smooth-corners
 */

// Squircle with 1.715 bigger radius cuts the same area as round corner
const SQUIRCLE_SCALE = 1.715

function roundTo3Digits(number) {
  return Math.round(number * 1000) / 1000
}

function isSquircleFallback(node) {
  return node?.type === 'atrule' && node.params.includes('corner-shape')
}

function increaseForSquircle(decl, { AtRule }) {
  if (isSquircleFallback(decl.next())) return
  // Never scale an "infinite" pill radius. (Local change.)
  if (/infinity|\de[+-]?\d/i.test(decl.value)) return
  let value = decl.value.replace(
    /(\d*\.?\d+)(rem|em|px|%)/g,
    (_, number, unit) => {
      let size = parseFloat(number) * SQUIRCLE_SCALE
      // Round pixels to keep CSS clean, other units keep 3 digits
      if (unit === 'px') return `${Math.round(size)}px`
      return `${roundTo3Digits(size)}${unit}`
    }
  )
  if (value !== decl.value) {
    decl.after(
      new AtRule({
        name: 'supports',
        nodes: [decl.clone({ value })],
        params: '(corner-shape:squircle)'
      })
    )
  }
}

function isCircleOrTooSmall(value, minSize) {
  // rounded-full: `calc(infinity * 1px)`, which the production minifier
  // turns into 3.40282e38px. (Local change.)
  if (/infinity|\de[+-]?\d/i.test(value)) return true
  let lengths = [...value.matchAll(/(\d*\.?\d+)(rem|em|px|%)?/g)]
  if (
    lengths.some(([, number, unit]) => unit === '%' && Number(number) >= 50)
  ) {
    return true
  }
  return (
    lengths.length > 0 &&
    lengths.every(
      ([, number, unit]) =>
        unit !== '%' && Number(number) * (unit === 'px' ? 1 : 16) < minSize
    )
  )
}

let plugin = (opts = {}) => {
  return {
    Declaration(decl, helpers) {
      let parent = decl.parent
      if (isSquircleFallback(parent)) return
      if (decl.prop.startsWith('--')) {
        let isRadius = opts.props && decl.prop.search(opts.props) !== -1
        if (isRadius && !decl.value.includes('var(')) {
          increaseForSquircle(decl, helpers)
        }
      } else if (/^border(-[a-z]+)*-radius$/.test(decl.prop)) {
        let shape
        parent.each(node => {
          if (node.type === 'decl' && node.prop === 'corner-shape') {
            shape = node.value
          }
        })
        let hasVar = decl.value.includes('var(')
        if (!shape && decl.value === 'inherit') {
          decl.cloneBefore({ prop: 'corner-shape', value: 'inherit' })
        } else if (
          !shape &&
          opts.auto &&
          (hasVar || !isCircleOrTooSmall(decl.value, opts.autoMinSize ?? 5))
        ) {
          decl.cloneBefore({ prop: 'corner-shape', value: 'squircle' })
          shape = 'squircle'
        }
        if (shape === 'squircle' && !hasVar) {
          increaseForSquircle(decl, helpers)
        }
      }
    },
    postcssPlugin: 'postcss-smooth-corners'
  }
}
plugin.postcss = true

module.exports = plugin
