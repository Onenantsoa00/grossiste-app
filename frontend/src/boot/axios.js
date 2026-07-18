import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from "stores/auth";

const api = axios.create({
  baseURL: process.env.API_URL || "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const grossisteId = localStorage.getItem("activeGrossisteId");
  if (grossisteId) {
    config.headers["X-Grossiste-Id"] = grossisteId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const auth = useAuthStore();
    const warning =
      response.data?.subscriptionWarning ||
      response.headers["x-subscription-warning"] === "1";
    const daysLate =
      response.data?.daysLate ?? Number(response.headers["x-days-late"] || 0);
    const expirationDate =
      response.data?.expirationDate ||
      response.headers["x-expiration-date"] ||
      null;

    if (warning) {
      auth.setSubscriptionStatus({
        subscriptionWarning: true,
        daysLate,
        expirationDate,
      });
    } else {
      auth.clearSubscriptionStatus();
    }

    return response;
  },
  (error) => {
    const auth = useAuthStore();

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("activeGrossisteId");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (
      error.response?.status === 403 &&
      error.response.data?.subscriptionExpired
    ) {
      auth.setSubscriptionStatus({
        subscriptionWarning: true,
        daysLate: error.response.data.daysLate ?? 0,
        expirationDate: error.response.data.expirationDate || null,
      });
      if (window.location.pathname !== "/abonnement-expire") {
        window.location.href = "/abonnement-expire";
      }
    }

    return Promise.reject(error);
  },
);

export default boot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
