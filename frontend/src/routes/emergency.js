import { pick, t } from "../core/i18n.js";
import { EMERGENCY_GUIDES } from "../content/emergency-guides.js";
import { saveSosContacts, triggerSos } from "../services/user-data.js";
import { isAuthenticated } from "../ui/auth-gate.js";

export const emergencyRoute = {
  path: "emergency",
  labelKey: "nav_emergency",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    const emergency = state.emergency;
    const selectedGuide = emergency.selectedGuide in EMERGENCY_GUIDES
      ? emergency.selectedGuide
      : "during";
    const guideItems = EMERGENCY_GUIDES[selectedGuide];
    const isAtMaxContacts = emergency.sosContacts.length >= 3;
    const authRequired = !isAuthenticated(state);

    routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>${t("em_guide")}</h2>
        <p class="muted">${t("em_guide_sub")}</p>
        <div class="task-actions">
          <button class="guide-tab ${selectedGuide === "during" ? "guide-tab-active" : ""}" data-guide="during">${t("g_during")}</button>
          <button class="guide-tab ${selectedGuide === "after" ? "guide-tab-active" : ""}" data-guide="after">${t("g_after")}</button>
          <button class="guide-tab ${selectedGuide === "survival72h" ? "guide-tab-active" : ""}" data-guide="survival72h">${t("g_72h")}</button>
          <button class="guide-tab ${selectedGuide === "trapped" ? "guide-tab-active" : ""}" data-guide="trapped">${t("g_trapped")}</button>
        </div>
        <ul class="summary-list">
          ${guideItems.map((item) => `<li>${pick(item)}</li>`).join("")}
        </ul>
      </section>

      <section class="card card-side">
        <h2>${t("sos_contacts")}</h2>
        ${
          authRequired
            ? `<p class="muted">${t("sos_login_hint")}</p>`
            : `
        <form id="sos-form" class="form">
          <label for="sos-name">${t("contact_name")}</label>
          <input id="sos-name" name="contactName" maxlength="60" required />
          <label for="sos-phone">${t("phone")}</label>
          <input id="sos-phone" name="contactPhone" maxlength="20" required />
          <button id="sos-add-btn" type="submit" class="btn-primary" ${isAtMaxContacts ? "disabled" : ""}>
            ${isAtMaxContacts ? t("max_contacts") : t("save_contacts")}
          </button>
        </form>
        <p class="muted">${t("last_sos")}: ${emergency.lastSosAt || "-"}</p>
        <button id="send-sos-btn" class="btn-danger">${t("send_sos")}</button>
        `
        }
      </section>
    </section>

    <section class="card">
      <h2>${t("contact_list")}</h2>
      ${
        emergency.sosContacts.length
          ? `<ul id="sos-contacts-list" class="task-list">
              ${emergency.sosContacts
                .map(
                  (contact) => `
                <li class="task-item" data-contact-id="${contact.id}">
                  <div>
                    <div class="task-title">${contact.name}</div>
                    <span class="muted">${contact.phone}</span>
                  </div>
                  ${
                    authRequired
                      ? ""
                      : `<div class="task-actions">
                    <button class="btn-danger" data-action="remove-contact">${t("remove")}</button>
                  </div>`
                  }
                </li>
              `
                )
                .join("")}
            </ul>`
          : `<p class="muted">${t("no_contacts")}</p>`
      }
    </section>
  `;

    routeRoot.querySelectorAll(".guide-tab").forEach((tabButton) => {
      tabButton.addEventListener("click", () => {
        state.emergency.selectedGuide = tabButton.getAttribute("data-guide");
        renderCurrentRoute();
      });
    });

    if (authRequired) return;

    const sosForm = document.querySelector("#sos-form");
    const contactsList = document.querySelector("#sos-contacts-list");
    const sendSosButton = document.querySelector("#send-sos-btn");

    sosForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.emergency.sosContacts.length >= 3) {
        showToast(t("max_contacts_toast"));
        return;
      }

      const formData = new FormData(sosForm);
      const name = String(formData.get("contactName") || "").trim();
      const phone = String(formData.get("contactPhone") || "").trim();
      if (!name || !phone) {
        showToast(t("name_phone_required"));
        return;
      }

      const nextContacts = [{ name, phone }, ...state.emergency.sosContacts].slice(0, 3);
      try {
        state.emergency.sosContacts = await saveSosContacts(nextContacts);
        sosForm.reset();
        showToast(t("contacts_saved"));
        renderCurrentRoute();
      } catch (error) {
        showToast(`${t("save_failed")}: ${error.message}`);
      }
    });

    if (contactsList) {
      contactsList.addEventListener("click", async (event) => {
        const action = event.target.getAttribute("data-action");
        if (action !== "remove-contact") return;
        const row = event.target.closest(".task-item");
        if (!row) return;
        const contactId = Number(row.getAttribute("data-contact-id"));
        const nextContacts = state.emergency.sosContacts.filter(
          (contact) => contact.id !== contactId
        );
        try {
          state.emergency.sosContacts = await saveSosContacts(nextContacts);
          showToast(t("contact_removed"));
          renderCurrentRoute();
        } catch (error) {
          showToast(`${t("remove_failed")}: ${error.message}`);
        }
      });
    }

    sendSosButton.addEventListener("click", async () => {
      if (!state.emergency.sosContacts.length) {
        showToast(t("add_contact_first"));
        return;
      }
      const accepted = window.confirm(t("confirm_sos"));
      if (!accepted) return;

      let latitude = null;
      let longitude = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (_error) {
          // Location optional; backend accepts null coordinates.
        }
      }

      try {
        const eventData = await triggerSos(latitude, longitude);
        state.emergency.lastSosAt = new Date(eventData.created_at).toLocaleString();
        showToast(`${t("sos_sent")} ${eventData.status}).`);
        state.emergency.selectedGuide = "during";
        renderCurrentRoute();
      } catch (error) {
        showToast(`${t("sos_failed")}: ${error.message}`);
      }
    });
  }
};
