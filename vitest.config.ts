import path from "path"
import { fileURLToPath } from "node:url"

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const createVitestConfig = async () => {
  const [{ default: react }, { storybookTest }, { playwright }] =
    await Promise.all([
      import("@vitejs/plugin-react"),
      import("@storybook/addon-vitest/vitest-plugin"),
      import("@vitest/browser-playwright"),
    ])
  const enableStorybook = process.env.VITEST_STORYBOOK === "1"

  return {
    plugins: [react()],
    test: {
      environment: process.env.VITEST_ENV === "jsdom" ? "jsdom" : "happy-dom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary", "html"],
        // Focus coverage on core modules currently under test.
        // Expand this list as new test suites are added.
        include: [
          "src/entities/performance/lib/**/*.{ts,tsx}",
          "src/shared/lib/chart/utils.ts",
          "src/shared/lib/date/utils.ts",
          "src/shared/lib/utils/cn.ts",
          "src/shared/ui/action/Button.tsx",
          "src/shared/ui/input/TextInput.tsx",
        ],
        exclude: [
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.d.ts",
          "**/*.stories.tsx",
          "**/index.ts",
        ],
        thresholds: {
          lines: 30,
          branches: 30,
          functions: 30,
          statements: 30,
        },
      },
      server: {
        deps: {
          inline: ["@upstash/ratelimit", "@upstash/redis"],
        },
      },
      ...(enableStorybook
        ? {
            projects: [
              {
                extends: true,
                plugins: [
                  // The plugin will run tests for the stories defined in your Storybook config
                  // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
                  storybookTest({
                    configDir: path.join(dirname, ".storybook"),
                  }),
                ],
                test: {
                  name: "storybook",
                  browser: {
                    enabled: true,
                    headless: true,
                    provider: playwright({}),
                    instances: [
                      {
                        browser: "chromium",
                      },
                    ],
                  },
                  setupFiles: [".storybook/vitest.setup.ts"],
                },
              },
            ],
          }
        : {}),
    },
  }
}

export default createVitestConfig
