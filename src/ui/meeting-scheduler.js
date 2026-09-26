import './meeting-scrollbar.js';
import { ProductApiClient, ProductApiError } from '../services/api-client.js';

const DEFAULT_SCHEDULE_URL = '/data/meeting-schedule.json';
const DEFAULT_MEETING_SCHEDULE = Object.freeze({
  slotMinutes: 60,
  minNoticeMinutes: 0,
  days: Object.freeze({
    0: Object.freeze({ enabled: false }),
    1: Object.freeze({
      enabled: true,
      start: '09:00',
      end: '18:00',
      breaks: Object.freeze([{ start: '13:00', end: '14:00' }])
    }),
    2: Object.freeze({
      enabled: true,
      start: '09:00',
      end: '18:00',
      breaks: Object.freeze([{ start: '13:00', end: '14:00' }])
    }),
    3: Object.freeze({
      enabled: true,
      start: '09:00',
      end: '18:00',
      breaks: Object.freeze([{ start: '13:00', end: '14:00' }])
    }),
    4: Object.freeze({
      enabled: true,
      start: '09:00',
      end: '18:00',
      breaks: Object.freeze([{ start: '13:00', end: '14:00' }])
    }),
    5: Object.freeze({
      enabled: true,
      start: '09:00',
      end: '18:00',
      breaks: Object.freeze([{ start: '13:00', end: '14:00' }])
    }),
    6: Object.freeze({ enabled: true, start: '10:00', end: '15:00', breaks: Object.freeze([]) })
  }),
  exceptions: Object.freeze({})
});

const clean = (value) => (typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '');
const validPhone = (value) => /^[+()\d\s-]{6,32}$/u.test(value) && /\d/u.test(value);
const atStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();
const pad = (value) => String(value).padStart(2, '0');
const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const timeToMinutes = (value) => {
  if (typeof value !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/u.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const minutesToTime = (value) => `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;

const daySchedule = (date, schedule) => {
  const exception = schedule?.exceptions?.[dateKey(date)];
  if (exception) return exception;
  return schedule?.days?.[String(date.getDay())] ?? null;
};

const overlapsBreak = (start, duration, breaks = []) =>
  breaks.some((pause) => {
    const pauseStart = timeToMinutes(pause?.start);
    const pauseEnd = timeToMinutes(pause?.end);
    if (pauseStart === null || pauseEnd === null || pauseEnd <= pauseStart) return false;
    return start < pauseEnd && start + duration > pauseStart;
  });

export const getMeetingSlots = (date, schedule = DEFAULT_MEETING_SCHEDULE) => {
  const workingDay = daySchedule(date, schedule);
  if (!workingDay || workingDay.enabled === false || workingDay.closed === true) return [];

  if (Array.isArray(workingDay.slots)) {
    return workingDay.slots.filter((time) => timeToMinutes(time) !== null);
  }

  const start = timeToMinutes(workingDay.start);
  const end = timeToMinutes(workingDay.end);
  const slotMinutes = Number(workingDay.slotMinutes ?? schedule?.slotMinutes ?? 60);

  if (
    start === null ||
    end === null ||
    end <= start ||
    !Number.isFinite(slotMinutes) ||
    slotMinutes <= 0
  ) {
    return [];
  }

  const slots = [];
  for (let minute = start; minute + slotMinutes <= end; minute += slotMinutes) {
    if (overlapsBreak(minute, slotMinutes, workingDay.breaks)) continue;
    slots.push(minutesToTime(minute));
  }
  return slots;
};

const getAvailableMeetingSlots = (date, schedule, now = new Date()) => {
  const slots = getMeetingSlots(date, schedule);
  if (!sameDay(date, now)) return slots;

  const notice = Math.max(0, Number(schedule?.minNoticeMinutes ?? 0) || 0);
  const cutoff = now.getHours() * 60 + now.getMinutes() + notice;
  return slots.filter((time) => {
    const minute = timeToMinutes(time);
    return minute !== null && minute > cutoff;
  });
};

export const isMeetingDateAvailable = (
  date,
  today = new Date(),
  schedule = DEFAULT_MEETING_SCHEDULE
) =>
  atStartOfDay(date) >= atStartOfDay(today) &&
  getAvailableMeetingSlots(date, schedule, today).length > 0;

export const buildMeetingMessage = (template, date, time) =>
  template.replace(/\{date\}/gu, date).replace(/\{time\}/gu, time);

export const loadMeetingSchedule = async (url = DEFAULT_SCHEDULE_URL) => {
  if (typeof globalThis.fetch !== 'function') return DEFAULT_MEETING_SCHEDULE;

  try {
    const response = await globalThis.fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      cache: 'no-cache'
    });
    if (!response.ok) throw new Error(`Meeting schedule request failed: ${response.status}`);

    const schedule = await response.json();
    return schedule && typeof schedule === 'object' && schedule.days
      ? schedule
      : DEFAULT_MEETING_SCHEDULE;
  } catch {
    return DEFAULT_MEETING_SCHEDULE;
  }
};

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
  const triggers = document.querySelectorAll('[data-meeting-open]');
  if (!dialog || !triggers.length) return null;

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
  const contactStep = dialog.querySelector('[data-meeting-contact-step]');
  const close = dialog.querySelector('[data-meeting-dialog-close]');
  const name = contactStep?.elements.namedItem('name');
  const phone = contactStep?.elements.namedItem('phone');
  const submit = contactStep?.querySelector('[data-meeting-submit]');
  const status = contactStep?.querySelector('[data-meeting-status]');
  const success = contactStep?.querySelector('[data-meeting-success]');

  if (
    !previous ||
    !next ||
    !month ||
    !weekdays ||
    !days ||
    !timeStep ||
    !selectedDateText ||
    !times ||
    !selection ||
    !contactStep ||
    !close ||
    !name ||
    !phone ||
    !submit ||
    !status ||
    !success
  ) {
    return null;
  }

  const api = new ProductApiClient();
  let schedule = DEFAULT_MEETING_SCHEDULE;
  let displayedMonth = atStartOfDay(new Date());
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
  let selectedDate = null;
  let selectedTime = '';
  let trigger = null;
  let request = null;
  let complete = false;

  const setStatus = (text = '', error = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  };
  const invalid = (field, state) => field?.setAttribute('aria-invalid', String(state));
  const clearInvalid = (field) => field?.removeAttribute('aria-invalid');

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

    const available = getAvailableMeetingSlots(selectedDate, schedule, new Date());
    if (!available.length) {
      selection.textContent = copy.noTimes ?? '';
      contactStep.hidden = true;
      selectedTime = '';
      return;
    }

    for (const time of available) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'meeting-times__button';
      button.textContent = time;
      button.setAttribute('aria-pressed', String(time === selectedTime));
      button.addEventListener('click', () => selectTime(time));
      times.append(button);
    }
  };

  const renderCalendar = () => {
    const today = atStartOfDay(new Date());
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
      const available = isMeetingDateAvailable(date, new Date(), schedule);
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

  const setMeetingFormDisabled = (disabled) => {
    [...contactStep.elements].forEach((element) => {
      element.disabled = disabled;
    });
  };

  const resetContactStep = () => {
    contactStep.reset();
    setMeetingFormDisabled(false);
    clearInvalid(name);
    clearInvalid(phone);
    submit.disabled = false;
    contactStep.hidden = true;
    success.hidden = true;
    setStatus('');
    complete = false;
  };

  const selectDate = (date) => {
    selectedDate = date;
    selectedTime = '';
    timeStep.hidden = false;
    selectedDateText.textContent = `${copy.selectedDate}: ${formatDate(date, locale)}`;
    selection.textContent = '';
    resetContactStep();
    renderCalendar();
    renderTimes();
    window.requestAnimationFrame(() => {
      timeStep.scrollIntoView({ block: 'nearest' });
      times.querySelector('button')?.focus();
    });
  };

  const selectTime = (time) => {
    if (!selectedDate) return;
    selectedTime = time;
    renderTimes();

    const label = copy.selectedMeeting ?? '';
    const value = `${formatDate(selectedDate, locale)} · ${time}`;
    selection.textContent = [label, value].filter(Boolean).join(': ');

    contactStep.hidden = false;
    success.hidden = true;
    setStatus('');
    window.requestAnimationFrame(() => {
      contactStep.scrollIntoView({ block: 'nearest' });
      name.focus();
    });
  };

  const onDialogClose = () => {
    const closedTrigger = trigger;
    trigger = null;
    closedTrigger?.focus();
  };

  const closeDialog = () => {
    if (request) {
      request.abort();
      request = null;
    }

    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
      return;
    }
    dialog.removeAttribute('open');
    onDialogClose();
  };

  const resetDialog = () => {
    selectedDate = null;
    selectedTime = '';
    const today = atStartOfDay(new Date());
    displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    timeStep.hidden = true;
    selectedDateText.textContent = '';
    selection.textContent = '';
    resetContactStep();
    renderCalendar();
  };

  const openDialog = (event) => {
    event.preventDefault();
    trigger = event.currentTarget;
    resetDialog();

    try {
      if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
      else if (!dialog.open) dialog.setAttribute('open', '');
    } catch {
      dialog.setAttribute('open', '');
    }

    dialog.querySelector('.meeting-calendar__day:not(:disabled)')?.focus();
  };

  name.addEventListener('input', () => clearInvalid(name));
  phone.addEventListener('input', () => clearInvalid(phone));

  contactStep.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (request || complete) return;

    if (
      !selectedDate ||
      !selectedTime ||
      !getAvailableMeetingSlots(selectedDate, schedule, new Date()).includes(selectedTime)
    ) {
      setStatus(copy.invalidSelection, true);
      contactStep.hidden = true;
      timeStep.hidden = false;
      renderCalendar();
      renderTimes();
      times.querySelector('button')?.focus();
      return;
    }

    const values = {
      name: clean(name.value),
      phone: clean(phone.value)
    };
    const invalidField =
      values.name.length < 2 || values.name.length > 100
        ? name
        : !validPhone(values.phone)
          ? phone
          : null;

    if (invalidField) {
      invalid(invalidField, true);
      invalidField.focus();
      setStatus(copy.invalid, true);
      return;
    }

    const controller = new AbortController();
    request = controller;
    submit.disabled = true;
    contactStep.setAttribute('aria-busy', 'true');
    setStatus(copy.sending);

    const meetingMessage = buildMeetingMessage(
      copy.message ?? '',
      formatDate(selectedDate, locale),
      selectedTime
    );

    try {
      await api.submitLead(
        {
          name: values.name,
          phone: values.phone,
          ...(meetingMessage ? { message: meetingMessage } : {}),
          locale
        },
        { signal: controller.signal }
      );

      if (controller.signal.aborted) return;
      complete = true;
      setStatus('');
      setMeetingFormDisabled(true);
      success.hidden = false;
      success.focus();
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setStatus(copy.unavailable, true);
      submit.disabled = false;
    } finally {
      contactStep.removeAttribute('aria-busy');
      if (request === controller) request = null;
    }
  });

  previous.addEventListener('click', () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  next.addEventListener('click', () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  triggers.forEach((item) => item.addEventListener('click', openDialog));
  renderWeekdays();

  void loadMeetingSchedule(config.meetingScheduleUrl ?? DEFAULT_SCHEDULE_URL).then((loaded) => {
    schedule = loaded;
    if (!dialog.open) return;

    if (selectedDate && !isMeetingDateAvailable(selectedDate, new Date(), schedule)) {
      selectedDate = null;
      selectedTime = '';
      timeStep.hidden = true;
      contactStep.hidden = true;
      selectedDateText.textContent = '';
      selection.textContent = '';
    }
    renderCalendar();
    if (selectedDate) renderTimes();
  });

  return { dialog };
};
