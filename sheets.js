/* THBudget reads the owner's private workbook in the signed-in browser.
   No workbook values or access tokens are shipped with GitHub Pages. */
const TH_SHEET_ID = '1uC1tKyX4DnBKXH-4pIz8tm3zAvxdWr6ecrxrwUS9Hts';
const TH_CLIENT_ID = '881518334290-kimg628u5oriddlrqoq6vb619m8gn13s.apps.googleusercontent.com';
let thToken = '';
let thTokenClient;
try {
  const saved = JSON.parse(sessionStorage.getItem('thbudget-session') || 'null');
  if (saved?.expiresAt > Date.now() + 30000) thToken = saved.token;
} catch (_) { sessionStorage.removeItem('thbudget-session'); }

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
      sessionStorage.setItem('thbudget-session', JSON.stringify({token:thToken,expiresAt:Date.now()+(Number(response.expires_in)||3600)*1000}));
      thStatus('Opening your private workbook…');
      try {
        await window.thStart();
        document.getElementById('th-auth').hidden = true;
      } catch (error) {
        thToken = '';
        sessionStorage.removeItem('thbudget-session');
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
    if (response.status === 401) throw new Error('Your sign-in expired. Please sign in again.');
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
  const [fr, mr, hr] = await Promise.all([
    thValues("'Fleet List'!A1:I100"),
    thValues("'Mileage-2025.10.16'!A1:K100"),
    thValues("'Mileage-2024.06.25'!A1:J100")
  ]);
  const activeFleet = fr.slice(1).map(r => ({year:r[0],make:r[1],model:r[2],status:r[3]})).filter(v => v.year || v.make || v.model);
  const inactiveFleet = fr.slice(1).map(r => ({year:r[5],make:r[6],model:r[7],status:r[8]})).filter(v => v.year || v.make || v.model);
  const vehicles = mr.slice(4).filter(r => r[1] && Number(r[2]) >= 1900 && Number(r[2]) <= 2100).map(r => ({
    name:r[1],year:r[2],serviceStart:r[3],startMileage:r[4],currentMileage:r[5],addedMileage:r[6],
    daysDriven:r[7],monthsDriven:r[8],monthlyEstimate:r[9],annualEstimate:r[10]
  }));
  const history = hr.slice(4).filter(r => r[1]).map(r => ({name:r[1],currentMileage:r[4]}));
  return {asOf:mr[0]?.[1] || '',activeFleet,inactiveFleet,vehicles,history};
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
  Promise.resolve().then(() => window.thStart()).then(() => {
    document.getElementById('th-auth').hidden = true;
  }).catch(error => {
    thToken = '';
    sessionStorage.removeItem('thbudget-session');
    thStatus(error.message);
  });
}
