import { t } from "../core/i18n.js";
import { calculateFamilyScore, scoreColor } from "../core/score-engine.js";
import {
  createFamilyGroup,
  createFamilyMember,
  deleteFamilyMember,
  fetchFamilyGroup,
  joinFamilyGroup,
  leaveFamilyGroup,
  syncScore
} from "../services/user-data.js";
import { isAuthenticated, renderAuthGate } from "../ui/auth-gate.js";

const ROLE_VALUES = ["Parent", "Child", "Elderly", "Relative", "Member"];

function roleText(role) {
  const key = `role_${role}`;
  const translated = t(key);
  return translated === key ? role : translated;
}

export const familyRoute = {
  path: "family",
  labelKey: "nav_family",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    if (!isAuthenticated(state)) {
      renderAuthGate(routeRoot, t("nav_family"));
      return;
    }

    const members = state.family.members;
    const group = state.familyGroup;
    const familyScore = group
      ? Math.round(group.family_average_score)
      : calculateFamilyScore(members);
    const isAtMaxCapacity = members.length >= 5;

    const groupSection = group
      ? `
      <section class="card">
        <h2>${t("family_group")}</h2>
        <p class="muted">${t("invite_code")}: <strong>${group.invite_code}</strong></p>
        <ul class="task-list">
          ${group.members
            .map(
              (member) => `
            <li class="task-item ${member.user_id === group.weakest_user_id ? "weakest-member" : ""}">
              <div>
                <div class="task-title">${member.username}${member.is_leader ? ` ${t("leader")}` : ""}</div>
                <span class="score-value ${scoreColor(member.total_score)}">${member.total_score}</span>
                ${member.user_id === group.weakest_user_id ? `<span class="muted">${t("weakest")}</span>` : ""}
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
        <button id="leave-group-btn" type="button" class="btn-danger">${t("leave_group")}</button>
      </section>
    `
      : `
      <section class="card">
        <h2>${t("family_group")}</h2>
        <p class="muted">${t("join_hint")}</p>
        <div class="task-actions">
          <button id="create-group-btn" type="button" class="btn-primary">${t("create_group")}</button>
        </div>
        <form id="join-group-form" class="form">
          <label for="invite-code">${t("invite_code")}</label>
          <input id="invite-code" name="inviteCode" maxlength="6" pattern="[0-9]{6}" required />
          <button type="submit" class="btn-primary">${t("join_group")}</button>
        </form>
      </section>
    `;

    routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>${t("household")}</h2>
        <p class="muted">${t("household_sub")}</p>
        <form id="family-form" class="form">
          <label for="family-name">${t("member_name")}</label>
          <input id="family-name" name="memberName" maxlength="60" required />

          <label for="family-role">${t("role")}</label>
          <select id="family-role" name="memberRole">
            ${ROLE_VALUES.map(
              (value) => `<option value="${value}">${roleText(value)}</option>`
            ).join("")}
          </select>

          <label for="family-score">${t("prep_score")}</label>
          <input id="family-score" name="memberScore" type="number" min="0" max="100" value="50" required />

          <button id="family-add-btn" type="submit" class="btn-primary" ${isAtMaxCapacity ? "disabled" : ""}>
            ${isAtMaxCapacity ? t("max_members") : t("add_member")}
          </button>
        </form>
      </section>

      <section class="card card-side">
        <h2>${t("family_summary")}</h2>
        <ul class="summary-list">
          <li><strong>${t("members_label")}:</strong> ${members.length}/5</li>
          <li><strong>${t("family_score")}:</strong> <span class="score-value ${scoreColor(familyScore)}">${familyScore}</span></li>
          <li><strong>${t("group_label")}:</strong> ${group ? t("group_active") : t("group_not_joined")}</li>
        </ul>
      </section>
    </section>

    ${groupSection}

    <section class="card">
      <h2>${t("members_label")}</h2>
      ${
        members.length
          ? `<ul id="family-members-list" class="task-list">
              ${members
                .map(
                  (member) => `
                <li class="task-item" data-family-id="${member.id}">
                  <div>
                    <div class="task-title">${member.name}</div>
                    <span class="badge badge-in_progress">${roleText(member.role)}</span>
                    <span class="muted family-score-label">${t("readiness_score")}: ${member.score}</span>
                  </div>
                  <div class="task-actions">
                    <button class="btn-danger" data-action="remove-member">${t("remove")}</button>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>`
          : `<p class="muted">${t("no_members")}</p>`
      }
    </section>
  `;

    const familyForm = document.querySelector("#family-form");
    const membersList = document.querySelector("#family-members-list");

    familyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.family.members.length >= 5) {
        showToast(t("max_members_toast"));
        return;
      }

      const formData = new FormData(familyForm);
      const name = String(formData.get("memberName") || "").trim();
      const role = String(formData.get("memberRole") || "Member");
      const score = Number(formData.get("memberScore"));

      if (!name) {
        showToast(t("member_name_required"));
        return;
      }
      if (Number.isNaN(score) || score < 0 || score > 100) {
        showToast(t("score_range"));
        return;
      }

      try {
        const member = await createFamilyMember({ name, role, score });
        state.family.members = [member, ...state.family.members];
        await syncScore(state);
        familyForm.reset();
        document.querySelector("#family-score").value = "50";
        showToast(t("member_added"));
        renderCurrentRoute();
      } catch (error) {
        showToast(`${t("add_failed")}: ${error.message}`);
      }
    });

    if (membersList) {
      membersList.addEventListener("click", async (event) => {
        const action = event.target.getAttribute("data-action");
        if (action !== "remove-member") return;
        const row = event.target.closest(".task-item");
        if (!row) return;
        const memberId = Number(row.getAttribute("data-family-id"));
        try {
          await deleteFamilyMember(memberId);
          state.family.members = state.family.members.filter(
            (member) => member.id !== memberId
          );
          await syncScore(state);
          showToast(t("member_removed"));
          renderCurrentRoute();
        } catch (error) {
          showToast(`${t("remove_failed")}: ${error.message}`);
        }
      });
    }

    const createGroupBtn = document.querySelector("#create-group-btn");
    if (createGroupBtn) {
      createGroupBtn.addEventListener("click", async () => {
        try {
          await createFamilyGroup();
          state.familyGroup = await fetchFamilyGroup();
          showToast(t("group_created"));
          renderCurrentRoute();
        } catch (error) {
          showToast(`${t("create_group_failed")}: ${error.message}`);
        }
      });
    }

    const joinGroupForm = document.querySelector("#join-group-form");
    if (joinGroupForm) {
      joinGroupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const code = String(new FormData(joinGroupForm).get("inviteCode") || "").trim();
        try {
          await joinFamilyGroup(code);
          state.familyGroup = await fetchFamilyGroup();
          await syncScore(state);
          showToast(t("joined_group"));
          renderCurrentRoute();
        } catch (error) {
          showToast(`${t("join_failed")}: ${error.message}`);
        }
      });
    }

    const leaveGroupBtn = document.querySelector("#leave-group-btn");
    if (leaveGroupBtn) {
      leaveGroupBtn.addEventListener("click", async () => {
        try {
          await leaveFamilyGroup();
          state.familyGroup = null;
          await syncScore(state);
          showToast(t("left_group"));
          renderCurrentRoute();
        } catch (error) {
          showToast(`${t("leave_failed")}: ${error.message}`);
        }
      });
    }
  }
};
