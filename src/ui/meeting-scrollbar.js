

const dialog = document.querySelector('.meeting-dialog');
const content = dialog?.querySelector('.meeting-dialog__content');

const updateMeetingScrollbar = () => {
  if (!dialog || !content) return;

  const {
    scrollTop,
    scrollHeight,
    clientHeight
  } = content;

  if (scrollHeight <= clientHeight) {
    dialog.style.setProperty('--meeting-scroll-visible', '0');
    return;
  }

  const trackPadding = 12;
  const trackHeight = clientHeight - trackPadding * 2;

  const thumbHeight = Math.max(
    36,
    trackHeight * (clientHeight / scrollHeight)
  );

  const maxScroll = scrollHeight - clientHeight;
  const maxThumbTop = trackHeight - thumbHeight;

  const thumbTop =
    trackPadding +
    (scrollTop / maxScroll) * maxThumbTop;

  dialog.style.setProperty(
    '--meeting-scroll-height',
    `${thumbHeight}px`
  );

  dialog.style.setProperty(
    '--meeting-scroll-top',
    `${thumbTop}px`
  );

  dialog.style.setProperty(
    '--meeting-scroll-visible',
    '1'
  );
};

content?.addEventListener('scroll', updateMeetingScrollbar);

window.addEventListener('resize', updateMeetingScrollbar);

updateMeetingScrollbar();