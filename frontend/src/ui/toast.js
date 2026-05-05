export function createToast(toastElement, getState) {
  return function showToast(message) {
    const state = getState();
    state.toast = message;
    toastElement.textContent = message;
    toastElement.classList.add("toast-visible");
    setTimeout(() => {
      toastElement.classList.remove("toast-visible");
    }, 2200);
  };
}
