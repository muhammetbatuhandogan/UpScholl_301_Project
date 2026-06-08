export function renderAuthGate(routeRoot, moduleName) {
  routeRoot.innerHTML = `
    <section class="card">
      <h2>${moduleName}</h2>
      <p class="muted">This module requires login. Open the <a href="#dashboard">Dashboard</a> tab to sign in with demo credentials or OTP.</p>
    </section>
  `;
}

export function isAuthenticated(state) {
  return Boolean(state.isAuthenticated);
}
