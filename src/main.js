document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const form = document.querySelector('[data-address-form]');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = form.querySelector('input');
  if (!input.value.trim() || input.value.trim().length < 5) {
    input.setCustomValidity(input.lang === 'hy' ? 'Մուտքագրեք հասցեն' : 'Введите адрес');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  document.querySelector('.result-panel')?.classList.add('is-updated');
});
