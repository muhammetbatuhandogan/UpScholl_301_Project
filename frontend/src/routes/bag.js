import { saveBagState } from "../storage/bag.js";

export const bagRoute = {
  path: "bag",
  label: "Bag",

  render(routeRoot, state, { renderCurrentRoute }) {
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
};
