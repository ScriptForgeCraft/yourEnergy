import { ProductApiClient, ProductApiError } from '../services/api-client.js';

const clean = (value) => (typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '');
const validPhone = (value) => /^[+()\d\s-]{6,32}$/u.test(value) && /\d/u.test(value);
const validEmail = (value) =>
  !value || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value) && value.length <= 254);

/**
 * Sends only the fields visitors explicitly submit. The shared lead endpoint
 * reports success only after the configured CRM accepts the request.
 */
export const initContactForm = ({ config = {} } = {}) => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return null;

  const name = form.elements.namedItem('name');
  const phone = form.elements.namedItem('phone');
  const email = form.elements.namedItem('email');
  const topic = form.elements.namedItem('topic');
  const message = form.elements.namedItem('message');
  const consent = form.elements.namedItem('consent');
  const submit = form.querySelector('[data-contact-submit]');
  const status = form.querySelector('[data-contact-status]');
  const success = form.querySelector('[data-contact-success]');
  const copy = config.copy ?? {};
  const api = new ProductApiClient();
  let request = null;
  let complete = false;

  const setStatus = (text = '', error = false) => {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('is-error', error);
  };
  const invalid = (field, state) => field?.setAttribute('aria-invalid', String(state));
  const clearInvalid = (field) => field?.removeAttribute('aria-invalid');

  [name, phone, email, message].forEach((field) =>
    field?.addEventListener('input', () => clearInvalid(field))
  );
  consent?.addEventListener('change', () => clearInvalid(consent));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (request || complete) return;

    const values = {
      name: clean(name?.value),
      phone: clean(phone?.value),
      email: clean(email?.value),
      topic: clean(topic?.value),
      message: clean(message?.value)
    };
    const invalidField =
      values.name.length < 2 || values.name.length > 100
        ? name
        : !validPhone(values.phone)
          ? phone
          : !validEmail(values.email)
            ? email
            : !consent?.checked
              ? consent
              : null;

    if (invalidField) {
      invalid(invalidField, true);
      invalidField.focus?.();
      setStatus(copy.invalid, true);
      return;
    }

    request = new AbortController();
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    setStatus(copy.sending);
    try {
      const leadMessage = [values.topic, values.message].filter(Boolean).join(': ');
      await api.submitLead(
        {
          name: values.name,
          phone: values.phone,
          ...(values.email ? { email: values.email } : {}),
          ...(leadMessage ? { message: leadMessage } : {}),
          locale: config.locale ?? document.documentElement.lang
        },
        { signal: request.signal }
      );
      if (request.signal.aborted) return;
      complete = true;
      form.reset();
      setStatus('');
      success.hidden = false;
      success.focus();
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setStatus(copy.unavailable, true);
      submit.disabled = false;
    } finally {
      form.removeAttribute('aria-busy');
      request = null;
    }
  });

  return { form };
};
