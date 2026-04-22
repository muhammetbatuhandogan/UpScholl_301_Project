import "./styles.css";
import {
  buildAuthHeaders,
  clearAuthToken,
  readAuthToken,
  writeAuthToken
} from "./core/auth";

const app = document.querySelector("#app");
const API_BASE = "http://localhost:4010/api";
const STATUS_ORDER = ["todo", "in-progress", "done"];

const state = {
  isAuthenticated: false,
  username: "",
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
        <h1>UpScholl Task Dashboard</h1>
        <p>CRUD starter with FastAPI auth + task APIs.</p>
      </div>
      <span id="backend-pill" class="pill pill-offline">Backend: checking...</span>
    </header>

    <section class="layout">
      <section class="card">
        <h2>Login</h2>
        <form id="login-form" class="form">
          <label for="login-username">Username</label>
          <input id="login-username" name="loginUsername" value="demo" required />

          <label for="login-password">Password</label>
          <input id="login-password" name="loginPassword" type="password" value="demo123" required />

          <div class="task-actions">
            <button id="login-btn" type="submit" class="btn-primary">Login</button>
            <button id="logout-btn" type="button" class="btn-danger">Logout</button>
          </div>
        </form>
        <p id="auth-state" class="muted">Auth state: checking token...</p>
      </section>

      <section class="card card-side">
        <h2>Create Task</h2>
        <form id="task-form" class="form">
          <label for="task-title">Task title</label>
          <input id="task-title" name="taskTitle" maxlength="120" required />

          <label for="task-status">Status</label>
          <select id="task-status" name="taskStatus">
            <option value="todo">todo</option>
            <option value="in-progress">in-progress</option>
            <option value="done">done</option>
          </select>

          <button id="create-btn" type="submit" class="btn-primary">Create Task</button>
        </form>
      </section>
    </section>
    <section class="layout single-column">
      <section class="card">
        <h2>Summary</h2>
        <ul id="summary-list" class="summary-list"></ul>
        <div class="muted">
          Last updated: <span id="last-updated">-</span>
        </div>
        <a href="http://localhost:4010/health" target="_blank" rel="noreferrer">Open /health</a>
      </section>
    </section>

    <section class="card">
      <h2>Tasks</h2>
      <div id="list-state" class="muted">Loading tasks...</div>
      <ul id="task-list" class="task-list"></ul>
    </section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

const taskForm = document.querySelector("#task-form");
const loginForm = document.querySelector("#login-form");
const taskTitleInput = document.querySelector("#task-title");
const taskStatusInput = document.querySelector("#task-status");
const loginUsernameInput = document.querySelector("#login-username");
const loginPasswordInput = document.querySelector("#login-password");
const createBtn = document.querySelector("#create-btn");
const loginBtn = document.querySelector("#login-btn");
const logoutBtn = document.querySelector("#logout-btn");
const authStateEl = document.querySelector("#auth-state");
const backendPill = document.querySelector("#backend-pill");
const summaryList = document.querySelector("#summary-list");
const lastUpdatedEl = document.querySelector("#last-updated");
const listStateEl = document.querySelector("#list-state");
const taskListEl = document.querySelector("#task-list");
const toastEl = document.querySelector("#toast");

function showToast(message) {
  state.toast = message;
  toastEl.textContent = message;
  toastEl.classList.add("toast-visible");
  setTimeout(() => {
    toastEl.classList.remove("toast-visible");
  }, 2200);
}

function renderSummary() {
  const counts = STATUS_ORDER.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    { total: state.tasks.length }
  );
  state.tasks.forEach((task) => {
    counts[task.status] = (counts[task.status] || 0) + 1;
  });

  summaryList.innerHTML = `
    <li><strong>Total:</strong> ${counts.total}</li>
    <li><strong>todo:</strong> ${counts.todo || 0}</li>
    <li><strong>in-progress:</strong> ${counts["in-progress"] || 0}</li>
    <li><strong>done:</strong> ${counts.done || 0}</li>
  `;
  lastUpdatedEl.textContent = state.lastUpdated || "-";
}

function renderList() {
  if (state.loading) {
    listStateEl.textContent = "Loading tasks...";
    taskListEl.innerHTML = "";
    return;
  }

  if (state.error) {
    listStateEl.textContent = state.error;
    taskListEl.innerHTML = "";
    return;
  }

  if (!state.tasks.length) {
    listStateEl.textContent = "No tasks yet. Create your first task.";
    taskListEl.innerHTML = "";
    return;
  }

  listStateEl.textContent = "";
  taskListEl.innerHTML = state.tasks
    .map(
      (task) => `
      <li class="task-item" data-task-id="${task.id}">
        <div>
          <div class="task-title">${task.title}</div>
          <span class="badge badge-${task.status.replace("-", "_")}">${task.status}</span>
        </div>
        <div class="task-actions">
          <select class="status-select" data-action="status">
            ${STATUS_ORDER.map(
              (status) =>
                `<option value="${status}" ${task.status === status ? "selected" : ""}>${status}</option>`
            ).join("")}
          </select>
          <button class="btn-danger" data-action="delete">Delete</button>
        </div>
      </li>
    `
    )
    .join("");
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

function render() {
  createBtn.disabled = state.isSubmitting;
  createBtn.textContent = state.isSubmitting ? "Creating..." : "Create Task";
  loginBtn.disabled = state.isSubmitting;
  logoutBtn.disabled = state.isSubmitting;

  authStateEl.textContent = state.isAuthenticated
    ? `Auth state: logged in as ${state.username}`
    : "Auth state: logged out";

  if (!state.isAuthenticated) {
    taskForm.classList.add("disabled-form");
  } else {
    taskForm.classList.remove("disabled-form");
  }

  renderBackendPill();
  renderSummary();
  renderList();
}

async function request(path, options = {}) {
  const { token } = readAuthToken();
  const { headers: authHeaders } = buildAuthHeaders({
    token,
    headers: { "Content-Type": "application/json" }
  });
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders,
    ...options
  });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = errorBody.error;
      } else if (errorBody.detail) {
        message = errorBody.detail;
      }
    } catch (_ignored) {}
    throw new Error(message);
  }
  return response.json();
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
    clearAuthToken();
    state.isAuthenticated = false;
    state.username = "";
  }
}

async function loadTasks() {
  if (!state.isAuthenticated) {
    state.loading = false;
    state.error = "Login required to view tasks.";
    state.tasks = [];
    state.backendConnected = true;
    render();
    return;
  }

  state.loading = true;
  state.error = "";
  render();
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
    render();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;
  if (!username || !password) {
    showToast("Username and password are required.");
    return;
  }
  state.isSubmitting = true;
  render();
  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    writeAuthToken({ token: data.access_token });
    state.isAuthenticated = true;
    state.username = data.user.username;
    showToast("Login successful.");
    await loadTasks();
  } catch (error) {
    state.isAuthenticated = false;
    state.username = "";
    showToast(`Login failed: ${error.message}`);
  } finally {
    state.isSubmitting = false;
    render();
  }
});

logoutBtn.addEventListener("click", async () => {
  clearAuthToken();
  state.isAuthenticated = false;
  state.username = "";
  state.tasks = [];
  state.error = "Login required to view tasks.";
  render();
  showToast("Logged out.");
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.isAuthenticated) {
    showToast("Please login first.");
    return;
  }
  const title = taskTitleInput.value.trim();
  const status = taskStatusInput.value;
  if (!title) {
    showToast("Task title is required.");
    return;
  }

  state.isSubmitting = true;
  render();
  try {
    await request("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, status })
    });
    taskForm.reset();
    taskStatusInput.value = "todo";
    showToast("Task created.");
    await loadTasks();
  } catch (error) {
    showToast(`Create failed: ${error.message}`);
  } finally {
    state.isSubmitting = false;
    render();
  }
});

taskListEl.addEventListener("click", async (event) => {
  if (!state.isAuthenticated) return;
  const action = event.target.getAttribute("data-action");
  if (action !== "delete") return;
  const row = event.target.closest(".task-item");
  if (!row) return;
  const id = Number(row.getAttribute("data-task-id"));
  if (!id) return;
  const accepted = window.confirm("Delete this task?");
  if (!accepted) return;

  try {
    await request(`/tasks/${id}`, { method: "DELETE" });
    showToast("Task deleted.");
    await loadTasks();
  } catch (error) {
    showToast(`Delete failed: ${error.message}`);
  }
});

taskListEl.addEventListener("change", async (event) => {
  if (!state.isAuthenticated) return;
  const action = event.target.getAttribute("data-action");
  if (action !== "status") return;
  const row = event.target.closest(".task-item");
  if (!row) return;
  const id = Number(row.getAttribute("data-task-id"));
  if (!id) return;
  const status = event.target.value;
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  try {
    await request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: task.title,
        status
      })
    });
    showToast("Status updated.");
    await loadTasks();
  } catch (error) {
    showToast(`Update failed: ${error.message}`);
  }
});

async function bootstrap() {
  await checkSession();
  await loadTasks();
}

bootstrap();
