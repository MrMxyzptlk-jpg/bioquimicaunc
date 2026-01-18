function updateCounter(field) {
  const max = parseInt(field.dataset.maxlength, 10);
  if (!max) return;

  const counter = field.nextElementSibling;
  if (!counter || !counter.classList.contains("char-counter")) return;

  counter.textContent = `${field.value.length}/${max}`;

  const remaining = max - field.value.length;
  counter.classList.toggle("limit-warning", remaining <= max*0.3 && remaining > 0);
  counter.classList.toggle("limit-exceeded", remaining <= 0);
}

// Live typing
document.addEventListener("input", (e) => {
  if (e.target.matches("input[data-maxlength], textarea[data-maxlength]")) {
    updateCounter(e.target);
  }
});

// Initialize counters (page load + HTMX swaps)
function initCounters(root = document) {
  root
    .querySelectorAll("input[data-maxlength], textarea[data-maxlength]")
    .forEach(updateCounter);
}

// Initial page load
document.addEventListener("DOMContentLoaded", () => initCounters());

// HTMX partial swaps
document.addEventListener("htmx:afterSwap", (e) => {
  initCounters(e.target);
});
