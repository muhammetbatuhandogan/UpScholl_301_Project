import { calculateFamilyScore } from "../core/score-engine.js";
import { saveFamilyState } from "../storage/family.js";

export const familyRoute = {
  path: "family",
  label: "Family",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
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
};
