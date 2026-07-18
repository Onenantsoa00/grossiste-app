/* eslint-env node */

import { configure } from "quasar/wrappers";

export default configure(function (ctx) {
  return {
    boot: ["pinia", "axios"],
    css: ["app.scss"],
    extras: ["roboto-font", "material-icons"],
    build: {
      target: {
        browser: ["es2022", "firefox115", "chrome115", "safari14"],
        node: "node20",
      },
      vueRouterMode: "history",
      env: {
        API_URL: ctx.dev
          ? "http://localhost:3000/api"
          : process.env.VITE_API_URL || "/api",
      },
    },
    devServer: {
      open: true,
      port: 9000,
    },
    framework: {
      config: {},
      plugins: ["Notify", "Dialog", "Loading"],
    },
  };
});
