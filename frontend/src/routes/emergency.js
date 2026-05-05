import { EMERGENCY_GUIDES } from "../content/emergency-guides.js";
import { saveEmergencyState } from "../storage/emergency.js";

export const emergencyRoute = {
  path: "emergency",
  label: "Emergency",

  render(routeRoot, state, { showToast, renderCurrentRoute }) {
    const emergency = state.emergency;
    const selectedGuide = emergency.selectedGuide in EMERGENCY_GUIDES
      ? emergency.selectedGuide
      : "during";
    const guideItems = EMERGENCY_GUIDES[selectedGuide];
    const isAtMaxContacts = emergency.sosContacts.length >= 3;

    routeRoot.innerHTML = `
    <section class="layout">
      <section class="card">
        <h2>Emergency Guide</h2>
        <p class="muted">Offline-first emergency instructions for critical moments.</p>
        <div class="task-actions">
          <button class="guide-tab ${selectedGuide === "during" ? "guide-tab-active" : ""}" data-guide="during">During Quake</button>
          <button class="guide-tab ${selectedGuide === "after" ? "guide-tab-active" : ""}" data-guide="after">After Quake</button>
          <button class="guide-tab ${selectedGuide === "survival72h" ? "guide-tab-active" : ""}" data-guide="survival72h">First 72h</button>
          <button class="guide-tab ${selectedGuide === "trapped" ? "guide-tab-active" : ""}" data-guide="trapped">If Trapped</button>
        </div>
        <ul class="summary-list">
          ${guideItems.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </section>

      <section class="card card-side">
        <h2>SOS Contacts</h2>
        <form id="sos-form" class="form">
          <label for="sos-name">Contact name</label>
          <input id="sos-name" name="contactName" maxlength="60" required />
          <label for="sos-phone">Phone</label>
          <input id="sos-phone" name="contactPhone" maxlength="20" required />
          <button id="sos-add-btn" type="submit" class="btn-primary" ${isAtMaxContacts ? "disabled" : ""}>
            ${isAtMaxContacts ? "Max 3 contacts reached" : "Add Contact"}
          </button>
        </form>
        <p class="muted">Last SOS: ${emergency.lastSosAt || "-"}</p>
        <button id="simulate-sos-btn" class="btn-danger">Simulate SOS</button>
      </section>
    </section>

    <section class="card">
      <h2>Contact List</h2>
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
                  <div class="task-actions">
                    <button class="btn-danger" data-action="remove-contact">Remove</button>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>`
          : `<p class="muted">No SOS contacts added yet.</p>`
      }
    </section>
  `;

    routeRoot.querySelectorAll(".guide-tab").forEach((tabButton) => {
      tabButton.addEventListener("click", () => {
        const guide = tabButton.getAttribute("data-guide");
        state.emergency.selectedGuide = guide;
        saveEmergencyState(state.emergency);
        renderCurrentRoute();
      });
    });

    const sosForm = document.querySelector("#sos-form");
    const contactsList = document.querySelector("#sos-contacts-list");
    const simulateSosButton = document.querySelector("#simulate-sos-btn");

    sosForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.emergency.sosContacts.length >= 3) {
        showToast("Maximum 3 SOS contacts allowed.");
        return;
      }

      const formData = new FormData(sosForm);
      const name = String(formData.get("contactName") || "").trim();
      const phone = String(formData.get("contactPhone") || "").trim();
      if (!name || !phone) {
        showToast("Name and phone are required.");
        return;
      }

      state.emergency.sosContacts = [
        {
          id: `ec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name,
          phone
        },
        ...state.emergency.sosContacts
      ];
      saveEmergencyState(state.emergency);
      sosForm.reset();
      showToast("SOS contact added.");
      renderCurrentRoute();
    });

    if (contactsList) {
      contactsList.addEventListener("click", (event) => {
        const action = event.target.getAttribute("data-action");
        if (action !== "remove-contact") return;
        const row = event.target.closest(".task-item");
        if (!row) return;
        const contactId = row.getAttribute("data-contact-id");
        state.emergency.sosContacts = state.emergency.sosContacts.filter(
          (contact) => contact.id !== contactId
        );
        saveEmergencyState(state.emergency);
        showToast("SOS contact removed.");
        renderCurrentRoute();
      });
    }

    simulateSosButton.addEventListener("click", () => {
      if (!state.emergency.sosContacts.length) {
        showToast("Add at least one SOS contact first.");
        return;
      }
      state.emergency.lastSosAt = new Date().toLocaleString();
      saveEmergencyState(state.emergency);
      showToast("SOS simulation sent.");
      renderCurrentRoute();
    });
  }
};
