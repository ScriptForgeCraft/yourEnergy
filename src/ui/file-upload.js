const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const isSupportedFile = (file) =>
  allowedTypes.has(file.type) || (!file.type && allowedExtensions.test(file.name));

export const validateUploadFile = (file) => {
  if (!file || !isSupportedFile(file)) return 'INVALID_FILE';
  if (file.size > MAX_UPLOAD_BYTES) return 'FILE_TOO_LARGE';
  return null;
};

export const initFileUpload = ({ status }) => {
  const dropZone = document.querySelector('[data-file-drop]');
  const input = document.querySelector('#bill-file');
  const meta = document.querySelector('[data-file-meta]');
  const name = document.querySelector('[data-file-name]');
  const statusElement = document.querySelector('[data-file-status]');
  const remove = document.querySelector('[data-file-remove]');

  if (!dropZone || !input || !meta || !name || !statusElement || !remove) {
    return { clear() {} };
  }

  const setStatus = (message, isError = false) => {
    statusElement.textContent = message;
    statusElement.classList.toggle('is-error', isError);
  };

  const clear = () => {
    input.value = '';
    meta.hidden = true;
    name.textContent = '';
    dropZone.classList.remove('has-file');
    setStatus(status.fileRemoved);
  };

  const applyFile = (file) => {
    if (!file) {
      return;
    }
    const validationError = validateUploadFile(file);
    if (validationError === 'INVALID_FILE') {
      setStatus(status.invalidFile, true);
      return;
    }
    if (validationError === 'FILE_TOO_LARGE') {
      setStatus(status.largeFile, true);
      return;
    }

    name.textContent = `${file.name} · ${Math.ceil(file.size / 1024)} KB`;
    meta.hidden = false;
    dropZone.classList.add('has-file');
    setStatus(status.fileSelected);
  };

  input.addEventListener('change', () => applyFile(input.files?.[0]));
  remove.addEventListener('click', clear);

  for (const eventName of ['dragenter', 'dragover']) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('is-dragging');
    });
  }
  for (const eventName of ['dragleave', 'drop']) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove('is-dragging');
    });
  }
  dropZone.addEventListener('drop', (event) => applyFile(event.dataTransfer?.files?.[0]));

  return { clear, applyFile };
};
