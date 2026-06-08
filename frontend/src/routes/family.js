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

export const familyRoute = {
  path: "family",
  label: "Family",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    if (!isAuthenticated(state)) {
      renderAuthGate(routeRoot, "Family");
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
        <h2>Family Group</h2>
        <p class="muted">Invite code: <strong>${group.invite_code}</strong></p>
        <ul class="task-list">
          ${group.members
            .map(
              (member) => `
            <li class="task-item ${member.user_id === group.weakest_user_id ? "weakest-member" : ""}">
              <div>
                <div class="task-title">${member.username}${member.is_leader ? " (leader)" : ""}</div>
                <span class="score-value ${scoreColor(member.total_score)}">${member.total_score}</span>
                ${member.user_id === group.weakest_user_id ? '<span class="muted">Weakest link</span>' : ""}
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
        <button id="leave-group-btn" type="button" class="btn-danger">Leave Group</button>
      </section>
    `
      : `
      <section class="card">
        <h2>Family Group</h2>
        <p class="muted">Create a group or join with a 6-digit invite code.</p>
        <div class="task-actions">
          <button id="create-group-btn" type="button" class="btn-primary">Create Group</button>
        </div>
        <form id="join-group-form" class="form">
          <label for="invite-code">Invite code</label>
          <input id="invite-code" name="inviteCode" maxlength="6" pattern="[0-9]{6}" required />
          <button type="submit" class="btn-primary">Join Group</button>
        </form>
      </section>
    `;

    routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>Household Members</h2>
        <p class="muted">Local roster (max 5) synced with backend.</p>
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
          <li><strong>Family score:</strong> <span class="score-value ${scoreColor(familyScore)}">${familyScore}</span></li>
          <li><strong>Group:</strong> ${group ? "Active" : "Not joined"}</li>
        </ul>
      </section>
    </section>

    ${groupSection}

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
          : `<p class="muted">No household members added yet.</p>`
      }
    </section>
  `;

    const familyForm = document.querySelector("#family-form");
    const membersList = document.querySelector("#family-members-list");

    familyForm.addEventListener("submit", async (event) => {
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

      try {
        const member = await createFamilyMember({ name, role, score });
        state.family.members = [member, ...state.family.members];
        await syncScore(state);
        familyForm.reset();
        document.querySelector("#family-score").value = "50";
        showToast("Family member added.");
        renderCurrentRoute();
      } catch (error) {
        showToast(`Add failed: ${error.message}`);
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
          showToast("Family member removed.");
          renderCurrentRoute();
        } catch (error) {
          showToast(`Remove failed: ${error.message}`);
        }
      });
    }

    const createGroupBtn = document.querySelector("#create-group-btn");
    if (createGroupBtn) {
      createGroupBtn.addEventListener("click", async () => {
        try {
          await createFamilyGroup();
          state.familyGroup = await fetchFamilyGroup();
          showToast("Family group created.");
          renderCurrentRoute();
        } catch (error) {
          showToast(`Create group failed: ${error.message}`);
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
          showToast("Joined family group.");
          renderCurrentRoute();
        } catch (error) {
          showToast(`Join failed: ${error.message}`);
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
          showToast("Left family group.");
          renderCurrentRoute();
        } catch (error) {
          showToast(`Leave failed: ${error.message}`);
        }
      });
    }
  }
};
