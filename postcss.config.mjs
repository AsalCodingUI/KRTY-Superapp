import path from 'node:path';

// Absolute: Turbopack resolves relative plugin paths from .next/build (and
// rewrites import.meta.url), so anchor it at the project root, where both
// `next dev` and `next build` run.
const smoothCorners = path.join(process.cwd(), 'postcss/smooth-corners.cjs');

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    // Squircle corners everywhere (corner-shape: squircle), sized up so they
    // look as big as the round corners they replace; browsers without
    // corner-shape keep round corners. It can't scale values inside var(),
    // so the radius tokens are scaled instead: --radius (every rounded-*
    // derives from it) and --nest-r (concentric containers).
    // Vendored as CommonJS: the npm package is ESM-only and breaks the
    // webpack loader used by `next build`.
    [smoothCorners]: {
      auto: true,
      props: /^--(radius|nest-r)$/,
    },
  },
};

export default config;
