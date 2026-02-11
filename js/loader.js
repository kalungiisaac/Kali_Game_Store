// loader.js — Loading screen with pure CSS animations (no external deps)
// Animations are handled entirely by CSS keyframes in styles.css.
// This script only dismisses the overlay once the page is ready.

const MIN_DISPLAY = 1800; // ms — let the animation play before hiding
const start = performance.now?.() ?? Date.now();

window.addEventListener('load', () => {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  const elapsed = (performance.now?.() ?? Date.now()) - start;
  const remaining = Math.max(0, MIN_DISPLAY - elapsed);

  setTimeout(() => {
    screen.classList.add('fade-out');
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    // Safety fallback — remove after 1s even if transitionend never fires
    setTimeout(() => { if (screen.parentNode) screen.remove(); }, 1000);
  }, remaining);
});
