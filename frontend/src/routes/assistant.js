import { pick, t } from "../core/i18n.js";
import { request } from "../ui/api-client.js";
import { isAuthenticated, renderAuthGate } from "../ui/auth-gate.js";

function buildContext(state) {
  return {
    score: state.score.total_score ?? 0,
    breakdown: state.score.breakdown,
    onboarding: {
      region: state.onboarding.region,
      family_size: state.onboarding.familySize,
      has_children: state.onboarding.hasChildren,
      has_elderly: state.onboarding.hasElderly
    },
    bag: {
      checked: state.bagItems.filter((item) => item.checked).length,
      total: state.bagItems.length,
      missing: state.bagItems
        .filter((item) => !item.checked)
        .map((item) => item.label?.tr || pick(item.label))
        .slice(0, 10)
    },
    tasks: state.tasks
      .map((task) => ({ title: task.title, status: task.status }))
      .slice(0, 15),
    family_members: state.family.members.length
  };
}

function priorityBadgeClass(priority) {
  if (priority === "yüksek" || priority === "high") return "badge-todo";
  if (priority === "düşük" || priority === "low") return "badge-done";
  return "badge-in_progress";
}

export const assistantRoute = {
  path: "assistant",
  labelKey: "nav_assistant",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    if (!isAuthenticated(state)) {
      renderAuthGate(routeRoot, t("nav_assistant"));
      return;
    }

    const assistant = state.assistant;
    const insights = assistant.insights;

    const planHtml = insights
      ? `
        <p>${insights.coaching}</p>
        <ul class="task-list">
          ${insights.plan
            .map(
              (item) => `
            <li class="task-item">
              <div>
                <div class="task-title">${item.title}</div>
                <span class="muted">${item.why || ""}</span>
              </div>
              <span class="badge ${priorityBadgeClass(item.priority)}">${item.priority || ""}</span>
            </li>`
            )
            .join("")}
        </ul>`
      : `<p class="muted">${t("ai_plan_hint")}</p>`;

    const messagesHtml = assistant.messages.length
      ? assistant.messages
          .map(
            (message) => `
        <div class="chat-bubble ${message.role === "user" ? "chat-user" : "chat-ai"}">
          ${message.content}
        </div>`
          )
          .join("")
      : `<p class="muted">${t("ai_chat_hint")}</p>`;

    routeRoot.innerHTML = `
    <section class="card">
      <h2>${t("ai_plan_title")}</h2>
      <div id="insights-body">${assistant.insightsLoading ? `<p class="muted">${t("ai_thinking")}</p>` : planHtml}</div>
      <button id="insights-btn" class="btn-primary" ${assistant.insightsLoading ? "disabled" : ""}>
        ${insights ? t("ai_plan_refresh") : t("ai_plan_generate")}
      </button>
    </section>

    <section class="card">
      <h2>${t("ai_chat_title")}</h2>
      <div id="chat-log" class="chat-log">${messagesHtml}
        ${assistant.chatLoading ? `<div class="chat-bubble chat-ai chat-typing">${t("ai_thinking")}</div>` : ""}
      </div>
      <form id="chat-form" class="form chat-form">
        <input id="chat-input" maxlength="500" placeholder="${t("ai_chat_placeholder")}" autocomplete="off" />
        <button type="submit" class="btn-primary" ${assistant.chatLoading ? "disabled" : ""}>${t("ai_send")}</button>
      </form>
      <p class="muted">${t("ai_disclaimer")}</p>
    </section>
  `;

    const chatLog = routeRoot.querySelector("#chat-log");
    chatLog.scrollTop = chatLog.scrollHeight;

    routeRoot.querySelector("#insights-btn").addEventListener("click", async () => {
      state.assistant.insightsLoading = true;
      renderCurrentRoute();
      try {
        state.assistant.insights = await request("/assistant/insights", {
          method: "POST",
          body: JSON.stringify({ context: buildContext(state) })
        });
      } catch (error) {
        showToast(`${t("ai_failed")}: ${error.message}`);
      } finally {
        state.assistant.insightsLoading = false;
        renderCurrentRoute();
      }
    });

    routeRoot.querySelector("#chat-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = routeRoot.querySelector("#chat-input");
      const content = input.value.trim();
      if (!content || state.assistant.chatLoading) return;
      state.assistant.messages.push({ role: "user", content });
      state.assistant.chatLoading = true;
      renderCurrentRoute();
      try {
        const data = await request("/assistant/chat", {
          method: "POST",
          body: JSON.stringify({
            messages: state.assistant.messages.slice(-8),
            context: buildContext(state)
          })
        });
        state.assistant.messages.push({ role: "assistant", content: data.reply });
      } catch (error) {
        state.assistant.messages.push({
          role: "assistant",
          content: `${t("ai_failed")}: ${error.message}`
        });
      } finally {
        state.assistant.chatLoading = false;
        renderCurrentRoute();
      }
    });
  }
};
