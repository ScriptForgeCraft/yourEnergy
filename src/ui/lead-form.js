const validEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);

const clearInvalid = (form) =>
  form
    .querySelectorAll('[aria-invalid="true"]')
    .forEach((field) => field.removeAttribute('aria-invalid'));

/** Client-side lead validation; transmission occurs only on a deliberate submit. */
export const initLeadForm = ({ form, apiClient, strings, getPassport, writeStatus } = {}) => {
  if (!form || !apiClient) return null;

  const submit = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearInvalid(form);

    const passport = getPassport?.();
    const name = form.querySelector('[name="name"]')?.value.trim() ?? '';
    const phone = form.querySelector('[name="phone"]')?.value.trim() ?? '';
    const email = form.querySelector('[name="email"]')?.value.trim() ?? '';
    const message = form.querySelector('[name="message"]')?.value.trim() ?? '';
    const consent = Boolean(form.querySelector('[name="consent"]')?.checked);
    const invalid = [];
    if (name.length < 2) invalid.push(form.querySelector('[name="name"]'));
    if (!phone || !/^[+()\d\s-]{6,32}$/u.test(phone)) {
      invalid.push(form.querySelector('[name="phone"]'));
    }
    if (!validEmail(email)) invalid.push(form.querySelector('[name="email"]'));
    if (!consent) invalid.push(form.querySelector('[name="consent"]'));
    if (!passport?.id) invalid.push(form.querySelector('[name="name"]'));

    if (invalid.length) {
      invalid.filter(Boolean).forEach((field) => field.setAttribute('aria-invalid', 'true'));
      writeStatus?.(!validEmail(email) ? strings.invalidEmail : strings.required, true);
      invalid.find(Boolean)?.focus();
      return;
    }

    const controller = new AbortController();
    submit?.setAttribute('aria-busy', 'true');
    writeStatus?.(strings.sending);
    try {
      await apiClient.submitLead(
        {
          name: name || null,
          phone: phone || null,
          email: email || null,
          message: message || null,
          consent: true,
          analysisId: passport.id,
          locale: document.documentElement.lang
        },
        { signal: controller.signal }
      );
      form.reset();
      writeStatus?.(strings.sent);
    } catch {
      writeStatus?.(strings.unavailable, true);
    } finally {
      submit?.removeAttribute('aria-busy');
    }
  });

  return { clearInvalid };
};
