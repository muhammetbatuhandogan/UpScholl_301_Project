import { clearAllTokens } from "../core/auth";
import { scoreColor } from "../core/score-engine.js";
import { STATUS_ORDER } from "../content/constants.js";
import {
  loginWithPassword,
  logoutSession,
  requestOtp,
  verifyOtp
} from "../services/session.js";
import { loadUserData, syncScore, trackEvent } from "../services/user-data.js";
import { BACKEND_ORIGIN, request } from "../ui/api-client.js";

function renderSummary(state, summaryList, lastUpdatedEl) {
  const counts = STATUS_ORDER.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    { total: state.tasks.length }
  );
  state.tasks.forEach((task) => {
    counts[task.status] = (counts[task.status] || 0) + 1;
  });

  const scoreClass = scoreColor(state.score.total_score || 0);
  summaryList.innerHTML = `
    <li><strong>Readiness score:</strong> <span class="score-value ${scoreClass}">${state.score.total_score ?? 0}</span></li>
    <li><strong>Total tasks:</strong> ${counts.total}</li>
    <li><strong>todo:</strong> ${counts.todo || 0}</li>
    <li><strong>in-progress:</strong> ${counts["in-progress"] || 0}</li>
    <li><strong>done:</strong> ${counts.done || 0}</li>
  `;
  lastUpdatedEl.textContent = state.lastUpdated || "-";
}

function renderList(state, listStateEl, taskListEl) {
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
          <select class="status-select" data-action="status" ${task.status === "done" ? "disabled" : ""}>
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

export const dashboardRoute = {
  path: "dashboard",
  label: "Dashboard",

  render(routeRoot, state, { showToast, renderCurrentRoute, loadTasks, loadUserData }) {
    routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>Login (Demo)</h2>
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
        <h2>OTP Login</h2>
        <form id="otp-request-form" class="form">
          <label for="otp-phone">Phone (E.164)</label>
          <input id="otp-phone" name="otpPhone" placeholder="+905551234567" required />
          <button id="otp-request-btn" type="submit" class="btn-primary">Send OTP</button>
        </form>
        <form id="otp-verify-form" class="form">
          <label for="otp-code">6-digit code</label>
          <input id="otp-code" name="otpCode" maxlength="6" pattern="[0-9]{6}" required />
          <button id="otp-verify-btn" type="submit" class="btn-primary">Verify OTP</button>
        </form>
        <p id="otp-debug" class="muted"></p>
      </section>
    </section>

    <section class="layout">
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

      <section class="card card-side">
        <h2>Summary</h2>
        <ul id="summary-list" class="summary-list"></ul>
        <div class="muted">Last updated: <span id="last-updated">-</span></div>
        <a href="${BACKEND_ORIGIN}/health" target="_blank" rel="noreferrer">Open /health</a>
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
    const otpRequestForm = document.querySelector("#otp-request-form");
    const otpVerifyForm = document.querySelector("#otp-verify-form");
    const taskTitleInput = document.querySelector("#task-title");
    const taskStatusInput = document.querySelector("#task-status");
    const loginUsernameInput = document.querySelector("#login-username");
    const loginPasswordInput = document.querySelector("#login-password");
    const otpPhoneInput = document.querySelector("#otp-phone");
    const otpCodeInput = document.querySelector("#otp-code");
    const otpDebugEl = document.querySelector("#otp-debug");
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
    renderSummary(state, summaryList, lastUpdatedEl);
    renderList(state, listStateEl, taskListEl);

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
        const { user } = await loginWithPassword(username, password);
        state.isAuthenticated = true;
        state.username = user.username;
        await trackEvent("auth_login_success", { method: "password" });
        await loadUserData();
        showToast("Login successful.");
      } catch (error) {
        state.isAuthenticated = false;
        state.username = "";
        showToast(`Login failed: ${error.message}`);
      } finally {
        state.isSubmitting = false;
        renderCurrentRoute();
      }
    });

    otpRequestForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const phone = otpPhoneInput.value.trim();
      state.isSubmitting = true;
      renderCurrentRoute();
      try {
        const data = await requestOtp(phone);
        await trackEvent("auth_otp_sent", { phone_last4: phone.slice(-4) });
        if (data.debug_code) {
          otpDebugEl.textContent = `Debug OTP (dev only): ${data.debug_code}`;
          otpCodeInput.value = data.debug_code;
        } else {
          otpDebugEl.textContent = "OTP sent. Check SMS.";
        }
        showToast("OTP sent.");
      } catch (error) {
        showToast(`OTP request failed: ${error.message}`);
      } finally {
        state.isSubmitting = false;
        renderCurrentRoute();
      }
    });

    otpVerifyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const phone = otpPhoneInput.value.trim();
      const code = otpCodeInput.value.trim();
      state.isSubmitting = true;
      renderCurrentRoute();
      try {
        const { user } = await verifyOtp(phone, code);
        state.isAuthenticated = true;
        state.username = user.username;
        await trackEvent("auth_otp_verified", { phone_last4: phone.slice(-4) });
        await loadUserData();
        showToast("OTP login successful.");
      } catch (error) {
        showToast(`OTP verify failed: ${error.message}`);
      } finally {
        state.isSubmitting = false;
        renderCurrentRoute();
      }
    });

    logoutBtn.addEventListener("click", async () => {
      state.isSubmitting = true;
      renderCurrentRoute();
      await logoutSession();
      state.isAuthenticated = false;
      state.username = "";
      state.tasks = [];
      state.family = { members: [] };
      state.familyGroup = null;
      state.score = { total_score: 0, breakdown: null, updated_at: null };
      state.error = "Login required to view tasks.";
      state.isSubmitting = false;
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
        await loadTasks();
        await syncScore(state);
        showToast("Task created.");
      } catch (error) {
        showToast(`Create failed: ${error.message}`);
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
        await loadTasks();
        await syncScore(state);
        showToast("Task deleted.");
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
      if (task.status === "done" && status !== "done") {
        showToast("Completed tasks cannot be reverted.");
        event.target.value = "done";
        return;
      }
      try {
        await request(`/tasks/${id}`, {
          method: "PUT",
          body: JSON.stringify({ title: task.title, status })
        });
        await loadTasks();
        await syncScore(state);
        showToast("Status updated.");
      } catch (error) {
        showToast(`Update failed: ${error.message}`);
      }
    });
  }
};
