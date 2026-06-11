import { t } from "../core/i18n.js";

export function renderAuthGate(routeRoot, moduleTitle) {
  routeRoot.innerHTML = `
    <section class="card">
      <h2>${moduleTitle}</h2>
      <p class="muted">${t("auth_gate_msg")}</p>
    </section>
  `;
}

export function isAuthenticated(state) {
  return Boolean(state.isAuthenticated);
}
