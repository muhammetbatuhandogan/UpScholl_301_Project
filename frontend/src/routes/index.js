import { t } from "../core/i18n.js";
import { assistantRoute } from "./assistant.js";
import { bagRoute } from "./bag.js";
import { dashboardRoute } from "./dashboard.js";
import { emergencyRoute } from "./emergency.js";
import { familyRoute } from "./family.js";
import { onboardingRoute } from "./onboarding.js";

export const routes = [
  dashboardRoute,
  onboardingRoute,
  bagRoute,
  familyRoute,
  emergencyRoute,
  assistantRoute
];

export const ROUTE_PATHS = routes.map((r) => r.path);

export function getRoute(routePath) {
  return routes.find((r) => r.path === routePath) ?? dashboardRoute;
}

export function buildTabsNavMarkup() {
  return routes
    .map(
      (r) =>
        `<a href="#${r.path}" class="tab-link" data-route="${r.path}">${t(r.labelKey)}</a>`
    )
    .join("\n      ");
}
