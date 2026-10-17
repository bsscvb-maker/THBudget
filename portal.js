/* Shared account controls and workbook connection state. */
(() => {
  const nav = document.querySelector('.th-sidebar nav');
  if (nav && !nav.querySelector('[href="black-mild.html"]')) {
    const link = document.createElement('a');
    const isCurrent = location.pathname.endsWith('/black-mild.html');
    link.className = 'th-nav-link' + (isCurrent ? ' active' : '');
    link.href = 'black-mild.html';
    if (isCurrent) link.setAttribute('aria-current', 'page');
    link.innerHTML = '<span class="th-nav-icon" style="font-family:Georgia,serif;color:#f0d18d">B&amp;M</span>Black &amp; Mild';
    const systemLabel = [...nav.querySelectorAll('.th-nav-label')].find(el => el.textContent.trim() === 'System');
    nav.insertBefore(link, systemLabel || null);
  }

  if (nav && !nav.querySelector('[href="plan-tracker.html"]')) {
    const link = document.createElement('a');
    const current = location.pathname.endsWith('/plan-tracker.html');
    link.className = 'th-nav-link' + (current ? ' active' : '');
    link.href = 'plan-tracker.html';
    if (current) link.setAttribute('aria-current', 'page');
    link.innerHTML = '<span class="th-nav-icon" aria-hidden="true">✓</span>Plan Tracker';
    const system = [...nav.querySelectorAll('.th-nav-label')].find(el => el.textContent.trim() === 'System');
    nav.insertBefore(link, system || null);
  }
  const workspaces = document.querySelector('.panel.workspaces');
  if (workspaces && !workspaces.querySelector('[href="plan-tracker.html"]')) {
    const card = document.createElement('a');
    card.className = 'workspace';
    card.href = 'plan-tracker.html';
    card.innerHTML = '<span class="workspace-icon" aria-hidden="true">✓</span><span><strong>Plan Tracker</strong><small>Tasks, priorities, and accountability</small></span><span class="workspace-arrow">↗</span>';
    const admin = workspaces.querySelector('[href="admin.html"]');
    workspaces.insertBefore(card, admin || null);
  }
  const header = document.querySelector('.th-app-topbar');
  const status = document.querySelector('#th-connection, #connectionStatus');
  if (header && status) {
    const account = document.createElement('div');
    account.className = 'th-account';
    account.innerHTML = '<span class="th-authorized">Authorized user</span><button type="button" class="th-sign-out" aria-label="Sign out of TisZod">Sign out</button><span class="th-account-mark" role="img" aria-label="TisZod logo"><img src="tiszod-crest.svg" alt=""></span>';
    status.replaceWith(account);
    account.prepend(status);
    account.querySelector('.th-sign-out').addEventListener('click', () => {
      if (typeof window.thSignOut === 'function') window.thSignOut();
      else if (typeof thSignOut === 'function') thSignOut();
    });
  }
  const start = window.thStart;
  if (typeof start !== 'function') return;
  window.thStart = async (...args) => {
    const result = await start(...args);
    const connection = document.querySelector('#th-connection, #connectionStatus');
    if (connection) {
      connection.textContent = 'Private workbook connected';
      connection.classList.add('connected');
    }
    return result;
  };
})();
