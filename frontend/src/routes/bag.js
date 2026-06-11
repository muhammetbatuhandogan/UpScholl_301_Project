import { pick, t } from "../core/i18n.js";
import { BAG_CATEGORY_LABELS } from "../content/bag-items.js";
import { saveBagItems, syncScore } from "../services/user-data.js";
import { isAuthenticated, renderAuthGate } from "../ui/auth-gate.js";

export const bagRoute = {
  path: "bag",
  labelKey: "nav_bag",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    if (!isAuthenticated(state)) {
      renderAuthGate(routeRoot, t("bag_title"));
      return;
    }

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
        <h3>${pick(BAG_CATEGORY_LABELS[category]) || category}</h3>
        <ul class="bag-list">
          ${items
            .map(
              (item) => `
            <li>
              <label class="bag-item">
                <input type="checkbox" data-bag-id="${item.id}" ${item.checked ? "checked" : ""} />
                <span>${pick(item.label)}</span>
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
      <h2>${t("bag_title")}</h2>
      <p class="muted">${t("bag_subtitle")}</p>
      <div class="progress-wrap">
        <div class="progress-label">
          <strong>${checkedCount}/${totalCount}</strong> ${t("completed_label")}
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
      checkbox.addEventListener("change", async (event) => {
        const bagId = event.target.getAttribute("data-bag-id");
        state.bagItems = state.bagItems.map((item) =>
          item.id === bagId ? { ...item, checked: event.target.checked } : item
        );
        try {
          state.bagItems = await saveBagItems(state.bagItems);
          await syncScore(state);
          renderCurrentRoute();
        } catch (error) {
          showToast(`${t("bag_sync_failed")}: ${error.message}`);
        }
      });
    });
  }
};
