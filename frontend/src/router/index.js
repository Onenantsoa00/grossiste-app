import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, from, next) => {
    const { useAuthStore } = await import("stores/auth");
    const auth = useAuthStore();
    const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
    const requiresBoss = to.matched.some((r) => r.meta.requiresBoss);
    const requiresGrossiste = to.matched.some((r) => r.meta.requiresGrossiste);

    if (requiresAuth && !auth.isAuthenticated) {
      return next("/login");
    }

    if (to.path === "/login" && auth.isAuthenticated) {
      if (auth.isBoss) return next("/boss");
      return next("/employe");
    }

    if (requiresBoss && !auth.isBoss) {
      return next("/employe");
    }

    if (requiresGrossiste) {
      if (auth.isEmploye) return next();
      if (!auth.activeGrossisteId) return next("/boss");
    }

    next();
  });

  return Router;
});
