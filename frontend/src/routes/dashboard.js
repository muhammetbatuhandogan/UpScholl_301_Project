import { t } from "../core/i18n.js";
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

function statusText(status) {
  return t(`status_${status}`);
}

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
    <li><strong>${t("readiness_score")}:</strong> <span class="score-value ${scoreClass}">${state.score.total_score ?? 0}</span></li>
    <li><strong>${t("total_tasks")}:</strong> ${counts.total}</li>
    <li><strong>${statusText("todo")}:</strong> ${counts.todo || 0}</li>
    <li><strong>${statusText("in-progress")}:</strong> ${counts["in-progress"] || 0}</li>
    <li><strong>${statusText("done")}:</strong> ${counts.done || 0}</li>
  `;
  lastUpdatedEl.textContent = state.lastUpdated || "-";
}

function renderList(state, listStateEl, taskListEl) {
  if (state.loading) {
    listStateEl.textContent = t("loading_tasks");
    taskListEl.innerHTML = "";
    return;
  }

  if (state.error) {
    listStateEl.textContent = state.error;
    taskListEl.innerHTML = "";
    return;
  }

  if (!state.tasks.length) {
    listStateEl.textContent = t("no_tasks");
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
          <span class="badge badge-${task.status.replace("-", "_")}">${statusText(task.status)}</span>
        </div>
        <div class="task-actions">
          <select class="status-select" data-action="status" ${task.status === "done" ? "disabled" : ""}>
            ${STATUS_ORDER.map(
              (status) =>
                `<option value="${status}" ${task.status === status ? "selected" : ""}>${statusText(status)}</option>`
            ).join("")}
          </select>
          <button class="btn-danger" data-action="delete">${t("delete")}</button>
        </div>
      </li>
    `
    )
    .join("");
}

export const dashboardRoute = {
  path: "dashboard",
  labelKey: "nav_dashboard",

  render(routeRoot, state, { showToast, renderCurrentRoute, loadTasks, loadUserData }) {
    routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>${t("login_demo")}</h2>
        <form id="login-form" class="form">
          <label for="login-username">${t("username")}</label>
          <input id="login-username" name="loginUsername" value="demo" required />
          <label for="login-password">${t("password")}</label>
          <input id="login-password" name="loginPassword" type="password" value="demo123" required />
          <div class="task-actions">
            <button id="login-btn" type="submit" class="btn-primary">${t("login")}</button>
            <button id="logout-btn" type="button" class="btn-danger">${t("logout")}</button>
          </div>
        </form>
        <p id="auth-state" class="muted"></p>
      </section>

      <section class="card card-side">
        <h2>${t("otp_login")}</h2>
        <form id="otp-request-form" class="form">
          <label for="otp-phone">${t("phone_label")}</label>
          <input id="otp-phone" name="otpPhone" placeholder="+905551234567" required />
          <button id="otp-request-btn" type="submit" class="btn-primary">${t("send_otp")}</button>
        </form>
        <form id="otp-verify-form" class="form">
          <label for="otp-code">${t("code_label")}</label>
          <input id="otp-code" name="otpCode" maxlength="6" pattern="[0-9]{6}" required />
          <button id="otp-verify-btn" type="submit" class="btn-primary">${t("verify_otp")}</button>
        </form>
        <p id="otp-debug" class="muted"></p>
      </section>
    </section>

    <section class="layout">
      <section class="card card-side">
        <h2>${t("create_task")}</h2>
        <form id="task-form" class="form">
          <label for="task-title">${t("task_title")}</label>
          <input id="task-title" name="taskTitle" maxlength="120" required />
          <label for="task-status">${t("status_label")}</label>
          <select id="task-status" name="taskStatus">
            <option value="todo">${statusText("todo")}</option>
            <option value="in-progress">${statusText("in-progress")}</option>
            <option value="done">${statusText("done")}</option>
          </select>
          <button id="create-btn" type="submit" class="btn-primary">${t("create_task")}</button>
        </form>
      </section>

      <section class="card card-side">
        <h2>${t("summary")}</h2>
        <ul id="summary-list" class="summary-list"></ul>
        <div class="muted">${t("last_updated")}: <span id="last-updated">-</span></div>
        <a href="${BACKEND_ORIGIN}/health" target="_blank" rel="noreferrer">${t("open_health")}</a>
      </section>
    </section>

    <section class="card">
      <h2>${t("tasks_heading")}</h2>
      <div id="list-state" class="muted">${t("loading_tasks")}</div>
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
    createBtn.textContent = state.isSubmitting ? t("creating") : t("create_task");
    loginBtn.disabled = state.isSubmitting;
    logoutBtn.disabled = state.isSubmitting;
    authStateEl.textContent = state.isAuthenticated
      ? `${t("auth_logged_in")} ${state.username}`
      : t("auth_logged_out");
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
        showToast(t("username_password_required"));
        return;
      }
      state.isSubmitting = true;
      renderCurrentRoute();
      try {
        const { user } = await loginWithPassword(username, password);
        state.isAuthenticated = true;
        state.username = user.username;
        await trackEvent("auth_login_success", { method: "password" });
        try {
          await loadUserData();
          showToast(t("login_success"));
        } catch (syncError) {
          showToast(`${t("logged_in_sync_failed")}: ${syncError.message}`);
        }
      } catch (error) {
        state.isAuthenticated = false;
        state.username = "";
        showToast(`${t("login_failed")}: ${error.message}`);
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
          otpDebugEl.textContent = `${t("otp_debug")}: ${data.debug_code}`;
          otpCodeInput.value = data.debug_code;
        } else {
          otpDebugEl.textContent = t("otp_sent_sms");
        }
        showToast(t("otp_sent"));
      } catch (error) {
        showToast(`${t("otp_request_failed")}: ${error.message}`);
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
        try {
          await loadUserData();
          showToast(t("otp_login_success"));
        } catch (syncError) {
          showToast(`${t("logged_in_sync_failed")}: ${syncError.message}`);
        }
      } catch (error) {
        showToast(`${t("otp_verify_failed")}: ${error.message}`);
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
      state.error = t("login_required_tasks");
      state.isSubmitting = false;
      renderCurrentRoute();
      showToast(t("logged_out"));
    });

    taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.isAuthenticated) {
        showToast(t("please_login"));
        return;
      }
      const title = taskTitleInput.value.trim();
      const status = taskStatusInput.value;
      if (!title) {
        showToast(t("task_title_required"));
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
        showToast(t("task_created"));
      } catch (error) {
        showToast(`${t("create_failed")}: ${error.message}`);
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
      const accepted = window.confirm(t("confirm_delete_task"));
      if (!accepted) return;
      try {
        await request(`/tasks/${id}`, { method: "DELETE" });
        await loadTasks();
        await syncScore(state);
        showToast(t("task_deleted"));
      } catch (error) {
        showToast(`${t("delete_failed")}: ${error.message}`);
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
        showToast(t("done_revert"));
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
        showToast(t("status_updated"));
      } catch (error) {
        showToast(`${t("update_failed")}: ${error.message}`);
      }
    });
  }
};
