import "./styles.css";
import { clearAllTokens, readAuthToken } from "./core/auth";
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
  loading: true,
  error: "",
  backendConnected: false,
  lastUpdated: "",
  toast: "",
  isSubmitting: false
};

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div>
        <h1>UpScholl Frontend</h1>
        <p>Deprem hazırlık MVP: backend API ile senkron modüller.</p>
      </div>
      <span id="backend-pill" class="pill pill-offline">Backend: checking...</span>
    </header>

    <nav class="tabs" aria-label="Main modules">
      ${buildTabsNavMarkup()}
    </nav>

    <section id="route-root"></section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

const routeRoot = document.querySelector("#route-root");
const backendPill = document.querySelector("#backend-pill");
const toastEl = document.querySelector("#toast");

const showToast = createToast(toastEl, () => state);

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
  if (state.backendConnected) {
    backendPill.textContent = "Backend: connected";
    backendPill.className = "pill pill-online";
  } else {
    backendPill.textContent = "Backend: offline";
    backendPill.className = "pill pill-offline";
  }
}

function renderCurrentRoute() {
  renderBackendPill();
  renderTabState();
  const route = getRoute(state.route);
  route.render(routeRoot, state, {
    showToast,
    renderCurrentRoute,
    loadTasks,
    loadUserData: reloadUserData
  });
}

async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/health`);
    if (!response.ok) {
      state.backendConnected = false;
      return;
    }
    state.backendConnected = true;
  } catch (_error) {
    state.backendConnected = false;
  }
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
    state.error = `Failed to sync data: ${error.message}`;
    state.backendConnected = false;
    throw error;
  }
}

async function loadTasks() {
  if (!state.isAuthenticated) {
    state.loading = false;
    state.error = "Login required to view tasks.";
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
    state.error = `Failed to load tasks: ${error.message}`;
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
  await checkBackendHealth();
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
