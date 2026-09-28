const FIN_SHEET='Personal Finance Transactions';
const FIN_HEADERS=['ID','Date','Account','Payee / Description','Category','Subcategory','Activity / Event','Money In','Money Out','Status','Notes'];
const FIN_TABS=[['dashboard','Dashboard'],['control','Control'],['lineitem','Line-Item Budget'],['baseline','Budget Baseline'],['transactions2026','Transactions-2026'],['reconciliation','Reconciliation'],['transactionlist','Transaction List'],['eventbudgets','Event Budgets']];
let finRows=[],finTab='dashboard',finEdit=-1,finFilter='';
const $=id=>document.getElementById(id);
const fm=n=>'$'+(Number(n)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(String(n||'').replace(/[^0-9.-]/g,''))||0;
const finStatus=(s,error=false)=>{ $('save-status').textContent=s; $('save-status').classList.toggle('error',error); };
async function finRequest(path,method='GET',body){const response=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+TH_SHEET_ID+path,{method,headers:{Authorization:'Bearer '+thToken,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!response.ok){const detail=await response.json().catch(()=>({}));throw new Error(detail.error?.message||'Finance data could not be saved.')}return response.json();}
const finRange=range=>'/values/'+encodeURIComponent("'"+FIN_SHEET.replace(/'/g,"''")+"'!"+range);
async function finInit(){
 const meta=await thSheets('?fields=sheets.properties(title)');
 if(!(meta.sheets||[]).some(s=>s.properties.title===FIN_SHEET)){
  await finRequest(':batchUpdate','POST',{requests:[{addSheet:{properties:{title:FIN_SHEET,gridProperties:{rowCount:1000,columnCount:11}}}}]});
  await finRequest(finRange('A1:K1')+'?valueInputOption=RAW','PUT',{values:[FIN_HEADERS]});
 }
 await finLoad();
}
async function finLoad(){const data=await finRequest(finRange('A2:K5000')+'?valueRenderOption=UNFORMATTED_VALUE');finRows=(data.values||[]).map((r,i)=>({r:r.concat(Array(11).fill('')).slice(0,11),sheetRow:i+2})).filter(x=>x.r[0]);finRender();}
function finVisible(){let rows=finRows;
 if(finTab==='transactions2026')rows=rows.filter(x=>String(x.r[1]).startsWith('2026'));
 if(finTab==='reconciliation')rows=rows.filter(x=>String(x.r[9]).toLowerCase()!=='cleared');
 if(finTab==='eventbudgets')rows=rows.filter(x=>x.r[6]);
 if(finFilter)rows=rows.filter(x=>x.r.join(' ').toLowerCase().includes(finFilter.toLowerCase()));return rows;
}
function finCards(rows){const income=rows.reduce((s,x)=>s+num(x.r[7]),0),expense=rows.reduce((s,x)=>s+num(x.r[8]),0),pending=rows.filter(x=>String(x.r[9]).toLowerCase()!=='cleared').reduce((s,x)=>s+num(x.r[7])-num(x.r[8]),0);return '<div class="finance-cards"><div><span>Money in</span><strong>'+fm(income)+'</strong></div><div><span>Money out</span><strong>'+fm(expense)+'</strong></div><div><span>Balance</span><strong>'+fm(income-expense)+'</strong></div><div><span>Pending net</span><strong>'+fm(pending)+'</strong></div></div>'}
function finTable(rows){return '<div class="table-scroll"><table><thead><tr><th>Date</th><th>Account</th><th>Payee / Description</th><th>Category</th><th>Subcategory</th><th>Activity</th><th>Money in</th><th>Money out</th><th>Status</th><th></th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+fe(x.r[1])+'</td><td>'+fe(x.r[2])+'</td><td>'+fe(x.r[3])+'</td><td>'+fe(x.r[4])+'</td><td>'+fe(x.r[5])+'</td><td>'+fe(x.r[6])+'</td><td>'+fm(x.r[7])+'</td><td>'+fm(x.r[8])+'</td><td><span class="status '+(x.r[9]==='Cleared'?'cleared':'pending')+'">'+fe(x.r[9]||'Pending')+'</span></td><td><button class="row-edit" data-row="'+x.sheetRow+'">Edit</button></td></tr>').join('')+'</tbody></table></div>'}
function finGroup(rows,index){const groups=new Map();for(const x of rows){const key=String(x.r[index]||'Uncategorized');const v=groups.get(key)||{in:0,out:0,count:0};v.in+=num(x.r[7]);v.out+=num(x.r[8]);v.count++;groups.set(key,v)}return '<div class="table-scroll"><table><thead><tr><th>Group</th><th>Transactions</th><th>Money in</th><th>Money out</th><th>Net</th></tr></thead><tbody>'+[...groups].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>'<tr><td>'+fe(k)+'</td><td>'+v.count+'</td><td>'+fm(v.in)+'</td><td>'+fm(v.out)+'</td><td>'+fm(v.in-v.out)+'</td></tr>').join('')+'</tbody></table></div>'}
function finRender(){const tabs=$('finance-tabs');tabs.innerHTML=FIN_TABS.map(([id,label])=>'<button type="button" data-tab="'+id+'" class="'+(id===finTab?'active':'')+'">'+label+'</button>').join('');const rows=finVisible(), title=FIN_TABS.find(x=>x[0]===finTab)[1];let grouping={control:2,lineitem:4,baseline:4,eventbudgets:6}[finTab];let content='<section class="finance-panel"><div class="panel-head"><h2>'+title+'</h2><label>Search <input id="finance-search" value="'+fe(finFilter)+'" placeholder="Search these records"></label></div>'+finCards(rows);
 if(!finRows.length)content+='<div class="empty-finance"><h3>Starting fresh at $0.00</h3><p>Add your first personal transaction. Nothing from the club or your older budget is included.</p><button type="button" id="first-add">Add first transaction</button></div>';
 else if(!rows.length)content+='<p class="empty-finance">No records in this section yet.</p>';
 else content+=grouping!==undefined?finGroup(rows,grouping):finTable(rows);
 $('finance-content').innerHTML=content+'</section>';const search=$('finance-search');search?.addEventListener('input',e=>{finFilter=e.target.value;const at=e.target.selectionStart;finRender();$('finance-search').focus();$('finance-search').setSelectionRange(at,at)});$('first-add')?.addEventListener('click',()=>finOpen());}
function finOpen(sheetRow){finEdit=sheetRow||-1;const form=$('transaction-form');form.reset();const item=finRows.find(x=>x.sheetRow===sheetRow);const fields=['id','date','account','payee','category','subcategory','activity','income','expense','cleared','notes'];if(item)fields.slice(1).forEach((f,i)=>form.elements[f].value=item.r[i+1]??'');else{form.elements.date.value=new Date().toLocaleDateString('en-CA');form.elements.cleared.value='Pending'}$('editor-title').textContent=item?'Edit transaction':'Add transaction';$('editor').showModal()}
$('finance-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){finTab=b.dataset.tab;finFilter='';finRender()}});
$('finance-content').addEventListener('click',e=>{const b=e.target.closest('[data-row]');if(b)finOpen(Number(b.dataset.row))});
$('add').addEventListener('click',()=>finOpen());$('cancel').addEventListener('click',()=>$('editor').close());
$('transaction-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const income=num(f.elements.income.value),expense=num(f.elements.expense.value);if(income&&expense){finStatus('Enter money in or money out, not both.',true);return}if(!income&&!expense){finStatus('Enter an amount.',true);return}const existing=finRows.find(x=>x.sheetRow===finEdit);const row=[existing?.r[0]||crypto.randomUUID(),...['date','account','payee','category','subcategory','activity'].map(k=>f.elements[k].value.trim()),income||'',expense||'',f.elements.cleared.value,f.elements.notes.value.trim()];const button=f.querySelector('[type=submit]');button.disabled=true;finStatus('Saving…');try{if(existing)await finRequest(finRange('A'+finEdit+':K'+finEdit)+'?valueInputOption=RAW','PUT',{values:[row]});else await finRequest(finRange('A:K')+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{values:[row]});$('editor').close();await finLoad();finStatus('Saved.')}catch(err){finStatus(err.message,true)}finally{button.disabled=false}});
$('export').addEventListener('click',()=>{const rows=[FIN_HEADERS,...finVisible().map(x=>x.r)];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='TisZod-Finance-'+finTab+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
window.thStart=finInit;
