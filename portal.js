/* Shared navigation and connection state for every THBudget page. */
(() => {
  const page = document.body.dataset.thPage || 'home';
  const labels = {home:'Home',fleet:'Active Fleet',vehicles:'Vehicles & Mileage',budget:'Budget Workbook'};
  const links = {home:'./',fleet:'fleet.html',vehicles:'vehicles.html',budget:'budget.html'};
  const icons = {home:'⌂',fleet:'▣',vehicles:'↗',budget:'◫'};
  if (page !== 'home') {
    const content = document.createElement('div');
    content.className = 'th-page-content';
    [...document.body.children].filter(el => !['SCRIPT','STYLE'].includes(el.tagName) && el.id !== 'th-auth').forEach(el => content.append(el));
    const shell = document.createElement('div');
    shell.className = 'th-app';
    const sidebar = document.createElement('aside');
    sidebar.className = 'th-sidebar';
    sidebar.innerHTML = '<a class="th-brand" href="./"><span class="th-brand-mark">TH</span><span>THBudget<small>Personal command center</small></span></a><nav aria-label="THBudget pages"><div class="th-nav-label">Main</div>' +
      Object.keys(links).map((key,index) => (index === 1 ? '<div class="th-nav-label">Workspaces</div>' : '') +
        '<a class="th-nav-link' + (key === page ? ' active' : '') + '" href="' + links[key] + '"><span class="th-nav-icon">' + icons[key] + '</span>' + labels[key] + '</a>').join('') +
      '</nav><div class="th-sidebar-foot">© 2026 THBudget<br>Private personal workspace</div>';
    const main = document.createElement('div');
    main.className = 'th-app-main';
    const topbar = document.createElement('div');
    topbar.className = 'th-app-topbar';
    topbar.innerHTML = '<div><strong>' + labels[page] + '</strong><small>Your records, all in one place</small></div><span class="th-connection" id="th-connection">Connecting…</span>';
    main.append(topbar, content);
    shell.append(sidebar,main);
    document.body.append(shell);
  }
  const start = window.thStart;
  if (typeof start === 'function') window.thStart = async (...args) => {
    const result = await start(...args);
    const status = document.getElementById('th-connection');
    if (status) { status.textContent = 'Private workbook connected'; status.classList.add('connected'); }
    return result;
  };
})();
