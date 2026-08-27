export const initPassportDialog = () => {
  const dialog = document.querySelector('[data-passport-dialog]');
  const triggers = document.querySelectorAll('[data-open-passport]');
  let opener = null;

  if (!dialog || typeof dialog.showModal !== 'function') {
    return;
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      opener = trigger;
      dialog.showModal();
    });
  });

  dialog.addEventListener('close', () => opener?.focus());
};
