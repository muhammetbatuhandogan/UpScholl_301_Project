import { t } from "../core/i18n.js";
import { calculateInitialScore, scoreColor } from "../core/score-engine.js";
import { saveOnboarding, syncScore, trackEvent } from "../services/user-data.js";
import { isAuthenticated, renderAuthGate } from "../ui/auth-gate.js";

export const onboardingRoute = {
  path: "onboarding",
  labelKey: "nav_onboarding",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    if (!isAuthenticated(state)) {
      renderAuthGate(routeRoot, t("nav_onboarding"));
      return;
    }

    const onboarding = state.onboarding;
    const currentStep = Math.max(1, Math.min(onboarding.step, 3));
    const initialScore = calculateInitialScore(onboarding);
    const scoreClass = scoreColor(initialScore);

    let stepContent = "";
    if (currentStep === 1) {
      stepContent = `
      <label for="onb-region">${t("region_label")}</label>
      <input id="onb-region" name="region" placeholder="${t("region_ph")}" value="${onboarding.region}" required />
      <p class="muted">${t("region_hint")}</p>
    `;
    } else if (currentStep === 2) {
      stepContent = `
      <label for="onb-family-size">${t("family_size")}</label>
      <select id="onb-family-size" name="familySize">
        <option value="1" ${onboarding.familySize === "1" ? "selected" : ""}>1</option>
        <option value="2" ${onboarding.familySize === "2" ? "selected" : ""}>2</option>
        <option value="3" ${onboarding.familySize === "3" ? "selected" : ""}>3</option>
        <option value="4" ${onboarding.familySize === "4" ? "selected" : ""}>4</option>
        <option value="5+" ${onboarding.familySize === "5+" ? "selected" : ""}>5+</option>
      </select>

      <label for="onb-children">${t("children_q")}</label>
      <select id="onb-children" name="hasChildren">
        <option value="no" ${onboarding.hasChildren === "no" ? "selected" : ""}>${t("no")}</option>
        <option value="yes" ${onboarding.hasChildren === "yes" ? "selected" : ""}>${t("yes")}</option>
      </select>

      <label for="onb-elderly">${t("elderly_q")}</label>
      <select id="onb-elderly" name="hasElderly">
        <option value="no" ${onboarding.hasElderly === "no" ? "selected" : ""}>${t("no")}</option>
        <option value="yes" ${onboarding.hasElderly === "yes" ? "selected" : ""}>${t("yes")}</option>
      </select>
    `;
    } else {
      stepContent = `
      <div class="score-box">
        <div class="muted">${t("est_score")}</div>
        <div class="score-value ${scoreClass}">${initialScore}</div>
      </div>
      <ul class="summary-list">
        <li><strong>${t("region_sum")}:</strong> ${onboarding.region || "-"}</li>
        <li><strong>${t("family_size")}:</strong> ${onboarding.familySize}</li>
        <li><strong>${t("children_sum")}:</strong> ${onboarding.hasChildren === "yes" ? t("yes") : t("no")}</li>
        <li><strong>${t("elderly_sum")}:</strong> ${onboarding.hasElderly === "yes" ? t("yes") : t("no")}</li>
      </ul>
    `;
    }

    routeRoot.innerHTML = `
    <section class="card">
      <h2>${t("onb_title")}</h2>
      <p class="muted">${t("step")} ${currentStep} / 3 ${onboarding.completed ? `• ${t("completed_tag")}` : ""} • ${t("synced")}</p>
      <form id="onboarding-form" class="form">
        ${stepContent}
        <div class="task-actions">
          <button id="onb-prev" type="button" class="btn-danger" ${currentStep === 1 ? "disabled" : ""}>${t("back")}</button>
          <button id="onb-next" type="submit" class="btn-primary">${currentStep === 3 ? t("finish") : t("continue")}</button>
        </div>
      </form>
    </section>
  `;

    const form = document.querySelector("#onboarding-form");
    const previousButton = document.querySelector("#onb-prev");

    previousButton.addEventListener("click", async () => {
      state.onboarding.step = Math.max(1, state.onboarding.step - 1);
      try {
        state.onboarding = await saveOnboarding(state.onboarding);
        renderCurrentRoute();
      } catch (error) {
        showToast(`${t("save_failed")}: ${error.message}`);
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      if (currentStep === 1) {
        state.onboarding.region = String(formData.get("region") || "").trim();
        if (!state.onboarding.region) {
          showToast(t("region_required"));
          return;
        }
        state.onboarding.step = 2;
        await trackEvent("onboarding_step_1_completed");
      } else if (currentStep === 2) {
        state.onboarding.familySize = String(formData.get("familySize") || "1");
        state.onboarding.hasChildren = String(formData.get("hasChildren") || "no");
        state.onboarding.hasElderly = String(formData.get("hasElderly") || "no");
        state.onboarding.step = 3;
        await trackEvent("onboarding_step_2_completed");
      } else {
        state.onboarding.completed = true;
        await trackEvent("onboarding_step_3_completed");
        await trackEvent("first_score_viewed", { score: initialScore });
      }

      try {
        state.onboarding = await saveOnboarding(state.onboarding);
        await syncScore(state);
        if (state.onboarding.completed) {
          showToast(t("onb_saved"));
        }
        renderCurrentRoute();
      } catch (error) {
        showToast(`${t("save_failed")}: ${error.message}`);
      }
    });
  }
};
