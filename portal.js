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
    const workspaceLabel=[...nav.querySelectorAll(".th-nav-label")].find(el=>el.textContent.trim()==="Workspaces");
    nav.insertBefore(link, workspaceLabel || system || null);
  }
  if(nav){const tracker=nav.querySelector('[href="plan-tracker.html"]');const label=[...nav.querySelectorAll(".th-nav-label")].find(el=>el.textContent.trim()==="Workspaces");if(tracker&&label)nav.insertBefore(tracker,label);}

  // Keep navigation order and icon spacing consistent on every page.
  if (nav) {
    const plan=nav.querySelector('[href="plan-tracker.html"]');
    if(plan)plan.innerHTML='<span class="th-nav-icon th-plan-icon" aria-hidden="true"><svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="30" height="30" rx="7" fill="#25477D"/><rect x="8" y="7" width="17" height="21" rx="3" fill="#142A49" stroke="#D5E8FF" stroke-width="1.5"/><rect x="12" y="4" width="9" height="6" rx="2" fill="#8CC9FF"/><path d="m11 16 2 2 4-4M19 16h3M11 23h11" stroke="#DAEEFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Plan Tracker</span>';
    const bm=nav.querySelector('[href="black-mild.html"]');
    if(bm)bm.innerHTML='<span class="th-nav-icon th-bm-icon" aria-hidden="true">B&amp;M</span><span>Black &amp; Mild</span>';
    const groups=[
      ['Overview',['./','plan-tracker.html']],
      ['Workspaces',['finance.html','pets.html','freebirds.html','black-mild.html']],
      ['Vehicles & gear',['vehicles.html','equipment.html','watercraft.html']],
      ['System',['admin.html']]
    ];
    const known=new Set(groups.flatMap(g=>g[1]));
    const extras=[...nav.querySelectorAll('a')].filter(a=>!known.has(a.getAttribute('href')));
    const links=new Map([...nav.querySelectorAll('a')].map(a=>[a.getAttribute('href'),a]));
    nav.replaceChildren();
    groups.forEach(([label,paths])=>{
      const items=paths.map(path=>links.get(path)).filter(Boolean);
      if(!items.length)return;
      const heading=document.createElement('div');heading.className='th-nav-label';heading.textContent=label;nav.append(heading,...items);
    });
    nav.append(...extras);
    const style=document.createElement('style');
    style.textContent='.th-sidebar .th-nav-link{gap:14px;min-height:48px;margin-bottom:3px}.th-sidebar .th-nav-icon{flex:0 0 30px;width:30px;height:30px;overflow:hidden}.th-sidebar .th-bm-icon{font:700 10px/1 Georgia,serif;letter-spacing:-.3px;color:#f0d18d;white-space:nowrap}.th-sidebar .th-plan-icon{background:transparent}.th-sidebar nav{overflow-y:auto;min-height:0;padding-bottom:12px}.th-sidebar .th-nav-label{margin-top:22px}.th-sidebar .th-sidebar-foot{flex-shrink:0}@media(max-width:700px){.th-sidebar nav{overflow-x:auto;overflow-y:visible;padding-bottom:4px}.th-sidebar .th-nav-link{gap:8px;min-height:40px;margin-bottom:0}.th-sidebar .th-nav-icon{display:grid;flex-basis:24px;width:24px;height:24px}.th-sidebar .th-nav-icon svg{width:24px;height:24px}.th-sidebar .th-bm-icon{font-size:8px}}';
    document.head.append(style);
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
