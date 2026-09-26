const WEEKDAY_SLOTS = Object.freeze([
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00'
]);
const SATURDAY_SLOTS = Object.freeze(['10:00', '11:00', '12:00', '13:00', '14:00']);

const atStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();
const isSunday = (date) => date.getDay() === 0;

export const isMeetingDateAvailable = (date, today = new Date()) =>
  !isSunday(date) && atStartOfDay(date) >= atStartOfDay(today);

export const getMeetingSlots = (date) => {
  if (isSunday(date)) return [];
  return date.getDay() === 6 ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
};

export const buildMeetingMessage = (template, date, time) =>
  template.replace(/\{date\}/gu, date).replace(/\{time\}/gu, time);

const formatMonth = (date, locale) =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
const formatWeekday = (date, locale) =>
  new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
const formatDate = (date, locale) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
const capitalize = (value) => value.charAt(0).toLocaleUpperCase() + value.slice(1);

export const initMeetingScheduler = ({ config = {} } = {}) => {
  const dialog = document.querySelector('[data-meeting-dialog]');
  const form = document.querySelector('[data-contact-form]');
  const message = form?.elements.namedItem('message');
  const triggers = document.querySelectorAll('[data-meeting-open]');
  if (!dialog || !message || !triggers.length) return null;

  const copy = config.copy?.meeting ?? {};
  const locale = config.locale ?? document.documentElement.lang ?? 'hy-AM';
  const previous = dialog.querySelector('[data-meeting-calendar-previous]');
  const next = dialog.querySelector('[data-meeting-calendar-next]');
  const month = dialog.querySelector('[data-meeting-calendar-month]');
  const weekdays = dialog.querySelector('[data-meeting-calendar-weekdays]');
  const days = dialog.querySelector('[data-meeting-calendar-days]');
  const timeStep = dialog.querySelector('[data-meeting-time-step]');
  const selectedDateText = dialog.querySelector('[data-meeting-selected-date]');
  const times = dialog.querySelector('[data-meeting-times]');
  const selection = dialog.querySelector('[data-meeting-selection]');
  const close = dialog.querySelector('[data-meeting-dialog-close]');
  const today = atStartOfDay(new Date());
  let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  let trigger = null;
  let moveFocusToForm = false;

  const renderWeekdays = () => {
    weekdays.replaceChildren();
    for (let index = 0; index < 7; index += 1) {
      const label = document.createElement('span');
      label.textContent = capitalize(formatWeekday(new Date(2024, 0, 1 + index), locale));
      weekdays.append(label);
    }
  };

  const renderTimes = () => {
    times.replaceChildren();
    if (!selectedDate) return;
    for (const time of getMeetingSlots(selectedDate)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'meeting-times__button';
      button.textContent = time;
      button.addEventListener('click', () => completeSelection(time));
      times.append(button);
    }
  };

  const selectDate = (date) => {
    selectedDate = date;
    timeStep.hidden = false;
    selectedDateText.textContent = `${copy.selectedDate}: ${formatDate(date, locale)}`;
    selection.textContent = '';
    renderCalendar();
    renderTimes();
    window.requestAnimationFrame(() => {
      timeStep.scrollIntoView({ block: 'nearest' });
      times.querySelector('button')?.focus();
    });
  };

  const renderCalendar = () => {
    month.textContent = capitalize(formatMonth(displayedMonth, locale));
    previous.disabled =
      displayedMonth.getFullYear() === today.getFullYear() &&
      displayedMonth.getMonth() === today.getMonth();
    days.replaceChildren();

    const year = displayedMonth.getFullYear();
    const monthIndex = displayedMonth.getMonth();
    const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const count = new Date(year, monthIndex + 1, 0).getDate();
    for (let index = 0; index < offset; index += 1) {
      const spacer = document.createElement('span');
      spacer.setAttribute('aria-hidden', 'true');
      days.append(spacer);
    }
    for (let day = 1; day <= count; day += 1) {
      const date = new Date(year, monthIndex, day);
      const button = document.createElement('button');
      const available = isMeetingDateAvailable(date, today);
      button.type = 'button';
      button.className = 'meeting-calendar__day';
      button.textContent = String(day);
      button.disabled = !available;
      button.setAttribute('aria-label', formatDate(date, locale));
      button.setAttribute(
        'aria-pressed',
        String(selectedDate ? sameDay(selectedDate, date) : false)
      );
      if (sameDay(date, today)) button.classList.add('is-today');
      if (selectedDate && sameDay(selectedDate, date)) button.classList.add('is-selected');
      if (available) button.addEventListener('click', () => selectDate(date));
      days.append(button);
    }
  };

  const scrollToMessage = () => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    message.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    window.setTimeout(() => message.focus({ preventScroll: true }), reducedMotion ? 0 : 400);
  };

  const onDialogClose = () => {
    const closedTrigger = trigger;
    trigger = null;
    if (moveFocusToForm) {
      moveFocusToForm = false;
      window.requestAnimationFrame(scrollToMessage);
      return;
    }
    closedTrigger?.focus();
  };

  const closeDialog = ({ focusForm = false } = {}) => {
    moveFocusToForm = focusForm;
    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
      return;
    }
    dialog.removeAttribute('open');
    onDialogClose();
  };

  const completeSelection = (time) => {
    if (!selectedDate) return;
    const booking = buildMeetingMessage(copy.message ?? '', formatDate(selectedDate, locale), time);
    const previousBooking = message.dataset.meetingBooking ?? '';
    if (previousBooking && message.value.includes(previousBooking)) {
      message.value = message.value.replace(previousBooking, booking);
    } else {
      message.value = [booking, message.value.trim()].filter(Boolean).join('\n\n');
    }
    message.dataset.meetingBooking = booking;
    message.dispatchEvent(new Event('input', { bubbles: true }));
    closeDialog({ focusForm: true });
  };

  const openDialog = (event) => {
    event.preventDefault();
    trigger = event.currentTarget;
    selectedDate = null;
    displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    timeStep.hidden = true;
    selection.textContent = '';
    selectedDateText.textContent = '';
    renderCalendar();
    try {
      if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
      else if (!dialog.open) dialog.setAttribute('open', '');
    } catch {
      dialog.setAttribute('open', '');
    }
    dialog.querySelector('.meeting-calendar__day:not(:disabled)')?.focus();
  };

  previous.addEventListener('click', () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  next.addEventListener('click', () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  close.addEventListener('click', () => closeDialog());
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  triggers.forEach((item) => item.addEventListener('click', openDialog));
  renderWeekdays();

  return { dialog };
};
