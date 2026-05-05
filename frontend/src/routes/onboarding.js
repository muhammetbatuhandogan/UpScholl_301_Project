import { calculateInitialScore } from "../core/score-engine.js";
import { saveOnboardingState } from "../storage/onboarding.js";

export const onboardingRoute = {
  path: "onboarding",
  label: "Onboarding",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
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
};
