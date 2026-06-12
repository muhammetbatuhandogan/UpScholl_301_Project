import "./styles.css";
import { clearAllTokens, readAuthToken } from "./core/auth";
import { getLang, setLang, t } from "./core/i18n.js";
import { BAG_DEFAULT_ITEMS } from "./content/bag-items.js";
import {
  buildTabsNavMarkup,
  getRoute,
  ROUTE_PATHS
} from "./routes/index.js";
import { loadUserData } from "./services/user-data.js";
import { BACKEND_ORIGIN, request } from "./ui/api-client.js";
import { createToast } from "./ui/toast.js";

const DEFAULT_ONBOARDING = {
  step: 1,
  region: "",
  familySize: "1",
  hasChildren: "no",
  hasElderly: "no",
  completed: false
};

const app = document.querySelector("#app");

const state = {
  route: "dashboard",
  isAuthenticated: false,
  username: "",
  onboarding: { ...DEFAULT_ONBOARDING },
  bagItems: BAG_DEFAULT_ITEMS.map((item) => ({ ...item, checked: false })),
  family: { members: [] },
  familyGroup: null,
  emergency: {
    sosContacts: [],
    selectedGuide: "during",
    lastSosAt: ""
  },
  score: { total_score: 0, breakdown: null, updated_at: null },
  tasks: [],
  assistant: {
    messages: [],
    insights: null,
    insightsLoading: false,
    chatLoading: false
  },
  loading: true,
  error: "",
  backendConnected: false,
  backendChecked: false,
  waking: false,
  lastUpdated: "",
  toast: "",
  isSubmitting: false
};

let routeRoot;
let backendPill;
let wakeBanner;
let toastEl;
let showToast;

function renderShell() {
  app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </span>
        <div>
          <h1>${t("app_title")}</h1>
          <p>${t("app_subtitle")}</p>
        </div>
      </div>
      <div class="topbar-actions">
        <button id="lang-toggle" class="lang-toggle" type="button" aria-label="Change language">
          ${getLang() === "tr" ? "EN" : "TR"}
        </button>
        <span id="backend-pill" class="pill pill-offline">${t("pill_checking")}</span>
      </div>
    </header>

    <div id="wake-banner" class="wake-banner" ${state.waking ? "" : "hidden"}>
      <span class="spinner" aria-hidden="true"></span>
      <span>${t("wake_banner")}</span>
    </div>

    <nav class="tabs" aria-label="Main modules">
      ${buildTabsNavMarkup()}
    </nav>

    <section id="route-root"></section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

  routeRoot = document.querySelector("#route-root");
  backendPill = document.querySelector("#backend-pill");
  wakeBanner = document.querySelector("#wake-banner");
  toastEl = document.querySelector("#toast");
  showToast = createToast(toastEl, () => state);

  document.querySelector("#lang-toggle").addEventListener("click", () => {
    setLang(getLang() === "tr" ? "en" : "tr");
    renderShell();
    renderCurrentRoute();
  });
}

function resolveRouteFromHash() {
  const rawRoute = window.location.hash.replace("#", "").trim();
  if (!ROUTE_PATHS.includes(rawRoute)) return "dashboard";
  return rawRoute;
}

function renderTabState() {
  document.querySelectorAll(".tab-link").forEach((tabLink) => {
    const isActive = tabLink.getAttribute("data-route") === state.route;
    tabLink.classList.toggle("tab-link-active", isActive);
  });
}

function renderBackendPill() {
  if (!state.backendChecked) {
    backendPill.textContent = t("pill_checking");
    backendPill.className = "pill pill-offline";
    return;
  }
  if (state.backendConnected) {
    backendPill.textContent = t("pill_online");
    backendPill.className = "pill pill-online";
  } else {
    backendPill.textContent = t("pill_offline");
    backendPill.className = "pill pill-offline";
  }
}

function renderCurrentRoute() {
  renderBackendPill();
  renderTabState();
  const route = getRoute(state.route);
  route.render(routeRoot, state, {
    showToast: (message) => showToast(message),
    renderCurrentRoute,
    loadTasks,
    loadUserData: reloadUserData
  });
}

async function pingHealth(timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/health`, {
      signal: controller.signal
    });
    return response.ok;
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Render free plan puts the backend to sleep after inactivity; the first
// request can take up to ~60s. Retry with a visible banner instead of
// blocking the page on a single failing request.
async function checkBackendHealth({ retries = 15, delayMs = 4000 } = {}) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const ok = await pingHealth();
    if (ok) {
      state.backendConnected = true;
      state.backendChecked = true;
      state.waking = false;
      wakeBanner.hidden = true;
      renderBackendPill();
      return true;
    }
    state.backendConnected = false;
    state.backendChecked = true;
    state.waking = true;
    wakeBanner.hidden = false;
    renderBackendPill();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  state.waking = false;
  wakeBanner.hidden = true;
  renderBackendPill();
  return false;
}

async function checkSession() {
  const { token } = readAuthToken();
  if (!token) {
    state.isAuthenticated = false;
    state.username = "";
    return;
  }
  try {
    const me = await request("/auth/me");
    state.isAuthenticated = true;
    state.username = me.username;
  } catch (_error) {
    clearAllTokens();
    state.isAuthenticated = false;
    state.username = "";
  }
}

async function reloadUserData() {
  if (!state.isAuthenticated) return;
  try {
    await loadUserData(state);
    state.backendConnected = true;
    state.error = "";
  } catch (error) {
    state.error = `${t("failed_sync")}: ${error.message}`;
    state.backendConnected = false;
    throw error;
  }
}

async function loadTasks() {
  if (!state.isAuthenticated) {
    state.loading = false;
    state.error = t("login_required_tasks");
    state.tasks = [];
    state.backendConnected = true;
    renderCurrentRoute();
    return;
  }

  state.loading = true;
  state.error = "";
  renderCurrentRoute();
  try {
    const data = await request("/tasks");
    state.tasks = Array.isArray(data.items) ? data.items : [];
    state.backendConnected = true;
    state.lastUpdated = new Date().toLocaleTimeString();
  } catch (error) {
    state.error = `${t("failed_load_tasks")}: ${error.message}`;
    state.backendConnected = false;
  } finally {
    state.loading = false;
    renderCurrentRoute();
  }
}

window.addEventListener("hashchange", () => {
  state.route = resolveRouteFromHash();
  renderCurrentRoute();
});

async function bootstrap() {
  state.route = resolveRouteFromHash();
  renderShell();
  // Render immediately so the user never stares at a blank page while the
  // backend wakes up from its free-tier sleep.
  renderCurrentRoute();
  const backendReady = await checkBackendHealth();
  if (!backendReady) {
    state.loading = false;
    state.error = t("server_unreachable");
    renderCurrentRoute();
    return;
  }
  await checkSession();
  if (state.isAuthenticated) {
    try {
      await reloadUserData();
      state.loading = false;
    } catch (_error) {
      state.loading = false;
    }
  } else {
    state.loading = false;
    await loadTasks();
  }
  renderCurrentRoute();
}

bootstrap();
