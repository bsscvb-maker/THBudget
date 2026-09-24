/* The navigation is part of each HTML page; this file only updates its connection state. */
(() => {
  const start = window.thStart;
  if (typeof start !== 'function') return;
  window.thStart = async (...args) => {
    const result = await start(...args);
    const status = document.getElementById('th-connection');
    if (status) {
      status.textContent = 'Private workbook connected';
      status.classList.add('connected');
    }
    return result;
  };
})();
