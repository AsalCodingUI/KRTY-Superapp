/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    // Squircle corners everywhere (corner-shape: squircle), sized up so they
    // look as big as the round corners they replace; browsers without
    // corner-shape keep round corners. It can't scale values inside var(),
    // so the radius tokens are scaled instead: --radius (every rounded-*
    // derives from it) and --nest-r (concentric containers).
    'postcss-smooth-corners': {
      auto: true,
      props: /^--(radius|nest-r)$/,
    },
  },
};

export default config;
