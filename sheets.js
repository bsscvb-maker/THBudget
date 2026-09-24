/* THBudget reads the owner's private workbook in the signed-in browser.
   No workbook values or access tokens are shipped with GitHub Pages. */
const TH_SHEET_ID = '1uC1tKyX4DnBKXH-4pIz8tm3zAvxdWr6ecrxrwUS9Hts';
const TH_CLIENT_ID = '881518334290-kimg628u5oriddlrqoq6vb619m8gn13s.apps.googleusercontent.com';
let thToken = '';
let thTokenClient;
const TH_SESSION_KEY = 'thbudget-session';
try {
  const saved = JSON.parse(localStorage.getItem(TH_SESSION_KEY) || sessionStorage.getItem(TH_SESSION_KEY) || 'null');
  if (saved?.expiresAt > Date.now() + 30000) thToken = saved.token;
  else { localStorage.removeItem(TH_SESSION_KEY); sessionStorage.removeItem(TH_SESSION_KEY); }
} catch (_) { localStorage.removeItem(TH_SESSION_KEY); sessionStorage.removeItem(TH_SESSION_KEY); }

function thClearSession() {
  thToken = '';
  localStorage.removeItem(TH_SESSION_KEY);
  sessionStorage.removeItem(TH_SESSION_KEY);
}

function thStatus(message) {
  document.getElementById('th-auth-message').textContent = message;
}
function thAuthorized() { return Boolean(thToken); }
function thSignIn() {
  if (!window.google?.accounts?.oauth2) {
    thStatus('Google sign-in is still loading. Please try again.');
    return;
  }
  thTokenClient ||= google.accounts.oauth2.initTokenClient({
    client_id: TH_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    callback: async response => {
      if (!response.access_token) {
        thStatus(response.error || 'Sign-in did not finish. Please try again.');
        return;
      }
      thToken = response.access_token;
      const session = JSON.stringify({token:thToken,expiresAt:Date.now()+Math.min(Number(response.expires_in)||3600,3600)*1000});
      localStorage.setItem(TH_SESSION_KEY, session);
      sessionStorage.setItem(TH_SESSION_KEY, session);
      thStatus('Opening your private workbook…');
      try {
        await window.thStart();
        document.getElementById('th-auth').hidden = true;
      } catch (error) {
        if (error.status === 401) thClearSession();
        thStatus(error.message);
      }
    }
  });
  thTokenClient.requestAccessToken({prompt: ''});
}
async function thSheets(path) {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + TH_SHEET_ID + path, {
    headers: {Authorization: 'Bearer ' + thToken}
  });
  if (!response.ok) {
    if (response.status === 401) { const error = new Error('Your sign-in expired. Please sign in again.'); error.status = 401; throw error; }
    if (response.status === 403 || response.status === 404) throw new Error('This Google account cannot open the TH Budget workbook. Sign in with the account that owns it.');
    throw new Error('The workbook could not be loaded. Please try again.');
  }
  return response.json();
}
async function thValues(range) {
  const result = await thSheets('/values/' + encodeURIComponent(range) + '?valueRenderOption=FORMATTED_VALUE');
  return result.values || [];
}
async function thFleetData() {
  const [fr, mr, hr, pr, rr, sr] = await Promise.all([
    thValues("'Fleet List'!A1:I100"),
    thValues("'Mileage-2025.10.16'!A1:K100"),
    thValues("'Mileage-2024.06.25'!A1:J100"),
    thValues("'Portal Asset Profiles'!A1:AA100"),
    thValues("'Vehicle Registry'!A1:G100"),
    thValues("'Portal Service History'!A1:G2300")
  ]);
  const activeFleet = fr.slice(1).map(r => ({year:r[0],make:r[1],model:r[2],status:r[3]})).filter(v => v.year || v.make || v.model);
  const inactiveFleet = fr.slice(1).map(r => ({year:r[5],make:r[6],model:r[7],status:r[8]})).filter(v => v.year || v.make || v.model);
  const vehicles = mr.slice(4).filter(r => r[1] && Number(r[2]) >= 1900 && Number(r[2]) <= 2100).map(r => ({
    name:r[1],year:r[2],serviceStart:r[3],startMileage:r[4],currentMileage:r[5],addedMileage:r[6],
    daysDriven:r[7],monthsDriven:r[8],monthlyEstimate:r[9],annualEstimate:r[10]
  }));
  const history = hr.slice(4).filter(r => r[1]).map(r => ({name:r[1],currentMileage:r[4]}));
  const profiles = pr.slice(1).filter(r => r[1]).map(r => ({name:r[1],year:r[2],make:r[3],model:r[4],color:r[5],category:r[7],status:r[8],reportOdometer:r[10],vin:r[11],tag:r[13],engine:r[15],transmission:r[16],tireSize:r[17],photo:r[24],renewal:r[14],vehicleNumber:r[12],sourceType:r[6],department:r[9],insuranceCompany:r[18],driver:r[22],reportText:r[25],reportDate:r[26]}));
  const registry = rr.slice(1).filter(r => r[1] && r[2]).map(r => ({category:r[0],year:r[1],make:r[2],model:r[3],vin:r[4],tag:r[5],status:r[6]}));
  const services = sr.slice(1).filter(r => r[0] && r[3]).map(r => ({asset:r[0],id:r[1],date:r[2],item:r[3],odometer:r[4],cost:r[5],notes:r[6]}));
  return {asOf:mr[0]?.[1] || '',activeFleet,inactiveFleet,vehicles,history,profiles,registry,services};
}
async function thTab(position) {
  const meta = await thSheets('?fields=sheets.properties(title,index,gridProperties(rowCount,columnCount))');
  const sheet = meta.sheets?.sort((a,b) => a.properties.index-b.properties.index)[position-1]?.properties;
  if (!sheet) throw new Error('This workbook section was not found.');
  const rows = await thValues("'" + sheet.title.replace(/'/g,"''") + "'!A1:T300");
  return {title:sheet.title,rows,rowCount:sheet.gridProperties.rowCount,columnCount:Math.min(sheet.gridProperties.columnCount,20)};
}
document.getElementById('th-sign-in').addEventListener('click', thSignIn);
if (thToken) {
  document.getElementById('th-auth').hidden = true;
  Promise.resolve().then(() => window.thStart()).then(() => {
    document.getElementById('th-auth').hidden = true;
  }).catch(error => {
    if (error.status === 401) thClearSession();
    thStatus(error.message);
    document.getElementById('th-auth').hidden = false;
  });
}
