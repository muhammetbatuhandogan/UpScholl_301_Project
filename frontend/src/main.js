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
const ROUTES = ["dashboard", "onboarding", "bag", "family", "emergency"];
const ONBOARDING_STORAGE_KEY = "upscholl_onboarding_state";
const BAG_STORAGE_KEY = "upscholl_bag_state";
const FAMILY_STORAGE_KEY = "upscholl_family_state";
const EMERGENCY_STORAGE_KEY = "upscholl_emergency_state";
const BAG_DEFAULT_ITEMS = [
  { id: "water", label: "Water (3-day supply)", category: "Essentials" },
  { id: "food", label: "Non-perishable food", category: "Essentials" },
  { id: "first_aid", label: "First aid kit", category: "Health" },
  { id: "meds", label: "Personal medications", category: "Health" },
  { id: "docs", label: "Important documents copies", category: "Documents" },
  { id: "flashlight", label: "Flashlight + spare batteries", category: "Equipment" },
  { id: "whistle", label: "Whistle", category: "Equipment" },
  { id: "cash", label: "Cash (small bills)", category: "Documents" }
];

function loadOnboardingState() {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return {
        step: 1,
        region: "",
        familySize: "1",
        hasChildren: "no",
        hasElderly: "no",
        completed: false
      };
    }
    const parsed = JSON.parse(raw);
    return {
      step: Number(parsed.step) || 1,
      region: parsed.region || "",
      familySize: parsed.familySize || "1",
      hasChildren: parsed.hasChildren || "no",
      hasElderly: parsed.hasElderly || "no",
      completed: Boolean(parsed.completed)
    };
  } catch (_error) {
    return {
      step: 1,
      region: "",
      familySize: "1",
      hasChildren: "no",
      hasElderly: "no",
      completed: false
    };
  }
}

function saveOnboardingState(onboardingState) {
  window.localStorage.setItem(
    ONBOARDING_STORAGE_KEY,
    JSON.stringify(onboardingState)
  );
}

function loadBagState() {
  try {
    const raw = window.localStorage.getItem(BAG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return BAG_DEFAULT_ITEMS.map((item) => ({
      ...item,
      checked: Boolean(parsed[item.id])
    }));
  } catch (_error) {
    return BAG_DEFAULT_ITEMS.map((item) => ({ ...item, checked: false }));
  }
}

function saveBagState(items) {
  const compact = items.reduce((acc, item) => ({ ...acc, [item.id]: item.checked }), {});
  window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(compact));
}

function loadFamilyState() {
  try {
    const raw = window.localStorage.getItem(FAMILY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const members = Array.isArray(parsed.members) ? parsed.members : [];
    const cleanedMembers = members
      .filter((member) => member && member.id && member.name)
      .map((member) => ({
        id: String(member.id),
        name: String(member.name),
        role: String(member.role || "Member"),
        score: Number(member.score) || 0
      }));
    return { members: cleanedMembers };
  } catch (_error) {
    return { members: [] };
  }
}

function saveFamilyState(familyState) {
  window.localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(familyState));
}

function loadEmergencyState() {
  try {
    const raw = window.localStorage.getItem(EMERGENCY_STORAGE_KEY);
    if (!raw) {
      return {
        sosContacts: [],
        selectedGuide: "during",
        lastSosAt: ""
      };
    }
    const parsed = JSON.parse(raw);
    const contacts = Array.isArray(parsed.sosContacts) ? parsed.sosContacts : [];
    return {
      sosContacts: contacts
        .filter((contact) => contact && contact.id && contact.name && contact.phone)
        .map((contact) => ({
          id: String(contact.id),
          name: String(contact.name),
          phone: String(contact.phone)
        })),
      selectedGuide: String(parsed.selectedGuide || "during"),
      lastSosAt: String(parsed.lastSosAt || "")
    };
  } catch (_error) {
    return {
      sosContacts: [],
      selectedGuide: "during",
      lastSosAt: ""
    };
  }
}

function saveEmergencyState(emergencyState) {
  window.localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(emergencyState));
}

const EMERGENCY_GUIDES = {
  during: [
    "Drop, cover, and hold on away from windows.",
    "Protect your head and neck until shaking stops.",
    "Do not use elevators during active shaking."
  ],
  after: [
    "Check injuries and provide first aid if needed.",
    "Turn off gas/electricity if leakage risk exists.",
    "Move to a safe assembly area calmly."
  ],
  survival72h: [
    "Use emergency bag supplies with a strict plan.",
    "Preserve clean water and prioritize medical needs.",
    "Follow official emergency channels for updates."
  ],
  trapped: [
    "Stay calm and conserve energy.",
    "Use whistle or tapping patterns to signal location.",
    "Cover nose/mouth from dust if possible."
  ]
};

const state = {
  route: "dashboard",
  isAuthenticated: false,
  username: "",
  onboarding: loadOnboardingState(),
  bagItems: loadBagState(),
  family: loadFamilyState(),
  emergency: loadEmergencyState(),
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
        <p>Deprem hazırlık MVP: auth, görev panosu ve modüller (onboarding, çanta, aile, acil durum).</p>
      </div>
      <span id="backend-pill" class="pill pill-offline">Backend: checking...</span>
    </header>

    <nav class="tabs" aria-label="Main modules">
      <a href="#dashboard" class="tab-link" data-route="dashboard">Dashboard</a>
      <a href="#onboarding" class="tab-link" data-route="onboarding">Onboarding</a>
      <a href="#bag" class="tab-link" data-route="bag">Bag</a>
      <a href="#family" class="tab-link" data-route="family">Family</a>
      <a href="#emergency" class="tab-link" data-route="emergency">Emergency</a>
    </nav>

    <section id="route-root"></section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

const routeRoot = document.querySelector("#route-root");
const backendPill = document.querySelector("#backend-pill");
const toastEl = document.querySelector("#toast");

function showToast(message) {
  state.toast = message;
  toastEl.textContent = message;
  toastEl.classList.add("toast-visible");
  setTimeout(() => {
    toastEl.classList.remove("toast-visible");
  }, 2200);
}

function resolveRouteFromHash() {
  const rawRoute = window.location.hash.replace("#", "").trim();
  if (!ROUTES.includes(rawRoute)) return "dashboard";
  return rawRoute;
}

function renderTabState() {
  const tabLinks = document.querySelectorAll(".tab-link");
  tabLinks.forEach((tabLink) => {
    const isActive = tabLink.getAttribute("data-route") === state.route;
    tabLink.classList.toggle("tab-link-active", isActive);
  });
}

function renderSummary(summaryList, lastUpdatedEl) {
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

function renderList(listStateEl, taskListEl) {
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

function renderDashboardRoute() {
  routeRoot.innerHTML = `
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
        <div class="muted">Last updated: <span id="last-updated">-</span></div>
        <a href="http://localhost:4010/health" target="_blank" rel="noreferrer">Open /health</a>
      </section>
    </section>

    <section class="card">
      <h2>Tasks</h2>
      <div id="list-state" class="muted">Loading tasks...</div>
      <ul id="task-list" class="task-list"></ul>
    </section>
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
  const summaryList = document.querySelector("#summary-list");
  const lastUpdatedEl = document.querySelector("#last-updated");
  const listStateEl = document.querySelector("#list-state");
  const taskListEl = document.querySelector("#task-list");

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
  renderSummary(summaryList, lastUpdatedEl);
  renderList(listStateEl, taskListEl);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;
    if (!username || !password) {
      showToast("Username and password are required.");
      return;
    }
    state.isSubmitting = true;
    renderCurrentRoute();
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
      renderCurrentRoute();
    } finally {
      state.isSubmitting = false;
      renderCurrentRoute();
    }
  });

  logoutBtn.addEventListener("click", () => {
    clearAuthToken();
    state.isAuthenticated = false;
    state.username = "";
    state.tasks = [];
    state.error = "Login required to view tasks.";
    renderCurrentRoute();
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
    renderCurrentRoute();
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
      renderCurrentRoute();
    } finally {
      state.isSubmitting = false;
      renderCurrentRoute();
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
        body: JSON.stringify({ title: task.title, status })
      });
      showToast("Status updated.");
      await loadTasks();
    } catch (error) {
      showToast(`Update failed: ${error.message}`);
    }
  });
}

function calculateInitialScore({ region, familySize, hasChildren, hasElderly }) {
  let score = 20;
  if (region) score += 20;
  if (Number(familySize) >= 3) score += 15;
  if (hasChildren === "yes") score += 10;
  if (hasElderly === "yes") score += 10;
  return Math.min(score, 75);
}

function renderOnboardingRoute() {
  const onboarding = state.onboarding;
  const currentStep = Math.max(1, Math.min(onboarding.step, 3));
  const initialScore = calculateInitialScore(onboarding);

  let stepContent = "";
  if (currentStep === 1) {
    stepContent = `
      <label for="onb-region">Region / City</label>
      <input id="onb-region" name="region" placeholder="e.g. Istanbul" value="${onboarding.region}" required />
      <p class="muted">Select your main living region to personalize preparedness context.</p>
    `;
  } else if (currentStep === 2) {
    stepContent = `
      <label for="onb-family-size">Family size</label>
      <select id="onb-family-size" name="familySize">
        <option value="1" ${onboarding.familySize === "1" ? "selected" : ""}>1</option>
        <option value="2" ${onboarding.familySize === "2" ? "selected" : ""}>2</option>
        <option value="3" ${onboarding.familySize === "3" ? "selected" : ""}>3</option>
        <option value="4" ${onboarding.familySize === "4" ? "selected" : ""}>4</option>
        <option value="5+" ${onboarding.familySize === "5+" ? "selected" : ""}>5+</option>
      </select>

      <label for="onb-children">Children in family?</label>
      <select id="onb-children" name="hasChildren">
        <option value="no" ${onboarding.hasChildren === "no" ? "selected" : ""}>No</option>
        <option value="yes" ${onboarding.hasChildren === "yes" ? "selected" : ""}>Yes</option>
      </select>

      <label for="onb-elderly">Elderly or disabled member?</label>
      <select id="onb-elderly" name="hasElderly">
        <option value="no" ${onboarding.hasElderly === "no" ? "selected" : ""}>No</option>
        <option value="yes" ${onboarding.hasElderly === "yes" ? "selected" : ""}>Yes</option>
      </select>
    `;
  } else {
    stepContent = `
      <div class="score-box">
        <div class="muted">Estimated initial preparedness score</div>
        <div class="score-value">${initialScore}</div>
      </div>
      <ul class="summary-list">
        <li><strong>Region:</strong> ${onboarding.region || "-"}</li>
        <li><strong>Family size:</strong> ${onboarding.familySize}</li>
        <li><strong>Children:</strong> ${onboarding.hasChildren}</li>
        <li><strong>Elderly/Disabled:</strong> ${onboarding.hasElderly}</li>
      </ul>
    `;
  }

  routeRoot.innerHTML = `
    <section class="card">
      <h2>Onboarding Module</h2>
      <p class="muted">Step ${currentStep} / 3 ${onboarding.completed ? "• Completed" : ""}</p>
      <form id="onboarding-form" class="form">
        ${stepContent}
        <div class="task-actions">
          <button id="onb-prev" type="button" class="btn-danger" ${currentStep === 1 ? "disabled" : ""}>Back</button>
          <button id="onb-next" type="submit" class="btn-primary">${currentStep === 3 ? "Finish" : "Continue"}</button>
        </div>
      </form>
    </section>
  `;

  const form = document.querySelector("#onboarding-form");
  const previousButton = document.querySelector("#onb-prev");

  previousButton.addEventListener("click", () => {
    state.onboarding.step = Math.max(1, state.onboarding.step - 1);
    saveOnboardingState(state.onboarding);
    renderCurrentRoute();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    if (currentStep === 1) {
      state.onboarding.region = String(formData.get("region") || "").trim();
      if (!state.onboarding.region) {
        showToast("Region is required.");
        return;
      }
      state.onboarding.step = 2;
    } else if (currentStep === 2) {
      state.onboarding.familySize = String(formData.get("familySize") || "1");
      state.onboarding.hasChildren = String(formData.get("hasChildren") || "no");
      state.onboarding.hasElderly = String(formData.get("hasElderly") || "no");
      state.onboarding.step = 3;
    } else {
      state.onboarding.completed = true;
      showToast("Onboarding completed.");
    }
    saveOnboardingState(state.onboarding);
    renderCurrentRoute();
  });
}

function renderBagRoute() {
  const grouped = state.bagItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const checkedCount = state.bagItems.filter((item) => item.checked).length;
  const totalCount = state.bagItems.length;
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0;

  const sectionsHtml = Object.entries(grouped)
    .map(
      ([category, items]) => `
      <section class="bag-category">
        <h3>${category}</h3>
        <ul class="bag-list">
          ${items
            .map(
              (item) => `
            <li>
              <label class="bag-item">
                <input type="checkbox" data-bag-id="${item.id}" ${item.checked ? "checked" : ""} />
                <span>${item.label}</span>
              </label>
            </li>
          `
            )
            .join("")}
        </ul>
      </section>
    `
    )
    .join("");

  routeRoot.innerHTML = `
    <section class="card">
      <h2>Emergency Bag Module</h2>
      <p class="muted">Track your bag readiness and update items as you complete them.</p>
      <div class="progress-wrap">
        <div class="progress-label">
          <strong>${checkedCount}/${totalCount}</strong> completed
          <span>${progress}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    </section>
    <section class="layout single-column">${sectionsHtml}</section>
  `;

  routeRoot.querySelectorAll("input[type='checkbox'][data-bag-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const bagId = event.target.getAttribute("data-bag-id");
      state.bagItems = state.bagItems.map((item) =>
        item.id === bagId ? { ...item, checked: event.target.checked } : item
      );
      saveBagState(state.bagItems);
      renderCurrentRoute();
    });
  });
}

function calculateFamilyScore(members) {
  if (!members.length) return 0;
  const totalScore = members.reduce((sum, member) => sum + member.score, 0);
  return Math.round(totalScore / members.length);
}

function renderFamilyRoute() {
  const members = state.family.members;
  const familyScore = calculateFamilyScore(members);
  const isAtMaxCapacity = members.length >= 5;

  routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>Family Module</h2>
        <p class="muted">Add up to 5 members and track average preparedness score.</p>
        <form id="family-form" class="form">
          <label for="family-name">Member name</label>
          <input id="family-name" name="memberName" maxlength="60" required />

          <label for="family-role">Role</label>
          <select id="family-role" name="memberRole">
            <option value="Parent">Parent</option>
            <option value="Child">Child</option>
            <option value="Elderly">Elderly</option>
            <option value="Relative">Relative</option>
            <option value="Member">Member</option>
          </select>

          <label for="family-score">Preparedness score (0-100)</label>
          <input id="family-score" name="memberScore" type="number" min="0" max="100" value="50" required />

          <button id="family-add-btn" type="submit" class="btn-primary" ${isAtMaxCapacity ? "disabled" : ""}>
            ${isAtMaxCapacity ? "Max 5 members reached" : "Add Member"}
          </button>
        </form>
      </section>

      <section class="card card-side">
        <h2>Family Summary</h2>
        <ul class="summary-list">
          <li><strong>Members:</strong> ${members.length}/5</li>
          <li><strong>Family score:</strong> ${familyScore}</li>
          <li><strong>Status:</strong> ${members.length ? "Active" : "No members yet"}</li>
        </ul>
      </section>
    </section>

    <section class="card">
      <h2>Members</h2>
      ${
        members.length
          ? `<ul id="family-members-list" class="task-list">
              ${members
                .map(
                  (member) => `
                <li class="task-item" data-family-id="${member.id}">
                  <div>
                    <div class="task-title">${member.name}</div>
                    <span class="badge badge-in_progress">${member.role}</span>
                    <span class="muted family-score-label">Score: ${member.score}</span>
                  </div>
                  <div class="task-actions">
                    <button class="btn-danger" data-action="remove-member">Remove</button>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>`
          : `<p class="muted">No family members added yet.</p>`
      }
    </section>
  `;

  const familyForm = document.querySelector("#family-form");
  const membersList = document.querySelector("#family-members-list");

  familyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.family.members.length >= 5) {
      showToast("Maximum 5 family members allowed.");
      return;
    }

    const formData = new FormData(familyForm);
    const name = String(formData.get("memberName") || "").trim();
    const role = String(formData.get("memberRole") || "Member");
    const score = Number(formData.get("memberScore"));

    if (!name) {
      showToast("Member name is required.");
      return;
    }
    if (Number.isNaN(score) || score < 0 || score > 100) {
      showToast("Score must be between 0 and 100.");
      return;
    }

    const member = {
      id: `fm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      role,
      score
    };
    state.family.members = [member, ...state.family.members];
    saveFamilyState(state.family);
    familyForm.reset();
    const scoreInput = document.querySelector("#family-score");
    scoreInput.value = "50";
    showToast("Family member added.");
    renderCurrentRoute();
  });

  if (membersList) {
    membersList.addEventListener("click", (event) => {
      const action = event.target.getAttribute("data-action");
      if (action !== "remove-member") return;
      const row = event.target.closest(".task-item");
      if (!row) return;
      const memberId = row.getAttribute("data-family-id");
      state.family.members = state.family.members.filter(
        (member) => member.id !== memberId
      );
      saveFamilyState(state.family);
      showToast("Family member removed.");
      renderCurrentRoute();
    });
  }
}

function renderEmergencyRoute() {
  const emergency = state.emergency;
  const selectedGuide = emergency.selectedGuide in EMERGENCY_GUIDES
    ? emergency.selectedGuide
    : "during";
  const guideItems = EMERGENCY_GUIDES[selectedGuide];
  const isAtMaxContacts = emergency.sosContacts.length >= 3;

  routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>Emergency Guide</h2>
        <p class="muted">Offline-first emergency instructions for critical moments.</p>
        <div class="task-actions">
          <button class="guide-tab ${selectedGuide === "during" ? "guide-tab-active" : ""}" data-guide="during">During Quake</button>
          <button class="guide-tab ${selectedGuide === "after" ? "guide-tab-active" : ""}" data-guide="after">After Quake</button>
          <button class="guide-tab ${selectedGuide === "survival72h" ? "guide-tab-active" : ""}" data-guide="survival72h">First 72h</button>
          <button class="guide-tab ${selectedGuide === "trapped" ? "guide-tab-active" : ""}" data-guide="trapped">If Trapped</button>
        </div>
        <ul class="summary-list">
          ${guideItems.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>

      <section class="card card-side">
        <h2>SOS Contacts</h2>
        <form id="sos-form" class="form">
          <label for="sos-name">Contact name</label>
          <input id="sos-name" name="contactName" maxlength="60" required />
          <label for="sos-phone">Phone</label>
          <input id="sos-phone" name="contactPhone" maxlength="20" required />
          <button id="sos-add-btn" type="submit" class="btn-primary" ${isAtMaxContacts ? "disabled" : ""}>
            ${isAtMaxContacts ? "Max 3 contacts reached" : "Add Contact"}
          </button>
        </form>
        <p class="muted">Last SOS: ${emergency.lastSosAt || "-"}</p>
        <button id="simulate-sos-btn" class="btn-danger">Simulate SOS</button>
      </section>
    </section>

    <section class="card">
      <h2>Contact List</h2>
      ${
        emergency.sosContacts.length
          ? `<ul id="sos-contacts-list" class="task-list">
              ${emergency.sosContacts
                .map(
                  (contact) => `
                <li class="task-item" data-contact-id="${contact.id}">
                  <div>
                    <div class="task-title">${contact.name}</div>
                    <span class="muted">${contact.phone}</span>
                  </div>
                  <div class="task-actions">
                    <button class="btn-danger" data-action="remove-contact">Remove</button>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>`
          : `<p class="muted">No SOS contacts added yet.</p>`
      }
    </section>
  `;

  routeRoot.querySelectorAll(".guide-tab").forEach((tabButton) => {
    tabButton.addEventListener("click", () => {
      const guide = tabButton.getAttribute("data-guide");
      state.emergency.selectedGuide = guide;
      saveEmergencyState(state.emergency);
      renderCurrentRoute();
    });
  });

  const sosForm = document.querySelector("#sos-form");
  const contactsList = document.querySelector("#sos-contacts-list");
  const simulateSosButton = document.querySelector("#simulate-sos-btn");

  sosForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.emergency.sosContacts.length >= 3) {
      showToast("Maximum 3 SOS contacts allowed.");
      return;
    }

    const formData = new FormData(sosForm);
    const name = String(formData.get("contactName") || "").trim();
    const phone = String(formData.get("contactPhone") || "").trim();
    if (!name || !phone) {
      showToast("Name and phone are required.");
      return;
    }

    state.emergency.sosContacts = [
      {
        id: `ec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        phone
      },
      ...state.emergency.sosContacts
    ];
    saveEmergencyState(state.emergency);
    sosForm.reset();
    showToast("SOS contact added.");
    renderCurrentRoute();
  });

  if (contactsList) {
    contactsList.addEventListener("click", (event) => {
      const action = event.target.getAttribute("data-action");
      if (action !== "remove-contact") return;
      const row = event.target.closest(".task-item");
      if (!row) return;
      const contactId = row.getAttribute("data-contact-id");
      state.emergency.sosContacts = state.emergency.sosContacts.filter(
        (contact) => contact.id !== contactId
      );
      saveEmergencyState(state.emergency);
      showToast("SOS contact removed.");
      renderCurrentRoute();
    });
  }

  simulateSosButton.addEventListener("click", () => {
    if (!state.emergency.sosContacts.length) {
      showToast("Add at least one SOS contact first.");
      return;
    }
    state.emergency.lastSosAt = new Date().toLocaleString();
    saveEmergencyState(state.emergency);
    showToast("SOS simulation sent.");
    renderCurrentRoute();
  });
}

function renderCurrentRoute() {
  renderBackendPill();
  renderTabState();
  if (state.route === "dashboard") {
    renderDashboardRoute();
    return;
  }
  if (state.route === "onboarding") {
    renderOnboardingRoute();
    return;
  }
  if (state.route === "bag") {
    renderBagRoute();
    return;
  }
  if (state.route === "family") {
    renderFamilyRoute();
    return;
  }
  renderEmergencyRoute();
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
  await checkSession();
  renderCurrentRoute();
  await loadTasks();
}

bootstrap();
