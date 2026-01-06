document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.getElementById('menuToggle');

  if (!header || !menuToggle) return;

  menuToggle.addEventListener('click', () => {
    header.classList.toggle('menu-open');
  });
});
