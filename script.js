const $ = (id) => document.getElementById(id);
const today = new Date();
const dateISO = (d) => { const x = new Date(d.getTime()-d.getTimezoneOffset()*60000); return x.toISOString().slice(0,10); };
$('today').textContent = today.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
$('task-date').value = dateISO(today); $('expense-date').value = dateISO(today);

let tasks = JSON.parse(localStorage.getItem('trackmate_tasks') || '[]');
let expenses = JSON.parse(localStorage.getItem('trackmate_expenses') || '[]');
const save = () => { localStorage.setItem('trackmate_tasks',JSON.stringify(tasks)); localStorage.setItem('trackmate_expenses',JSON.stringify(expenses)); render(); };
const money = n => '₹' + Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
const niceDate = d => d ? new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'No due date';

function showView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  $(view+'-view').classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $('page-title').textContent = view==='dashboard'?'Dashboard':view==='tasks'?'My Tasks':'Expenses';
}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));

$('task-form').addEventListener('submit',e=>{
  e.preventDefault();
  tasks.unshift({id:Date.now(),title:$('task-title').value.trim(),date:$('task-date').value,priority:$('task-priority').value,done:false});
  e.target.reset(); $('task-date').value=dateISO(today); save();
});
$('expense-form').addEventListener('submit',e=>{
  e.preventDefault();
  expenses.unshift({id:Date.now(),title:$('expense-title').value.trim(),amount:Number($('expense-amount').value),category:$('expense-category').value,date:$('expense-date').value});
  e.target.reset(); $('expense-date').value=dateISO(today); save();
});
$('task-filter').addEventListener('change',renderTasks);

function renderTasks(){
  const filter=$('task-filter').value;
  const list=tasks.filter(t=>filter==='all'||(filter==='completed'?t.done:!t.done));
  $('task-list').innerHTML=list.length?list.map(t=>`<div class="item ${t.done?'done':''}">
    <input class="check" type="checkbox" ${t.done?'checked':''} aria-label="Mark task complete" onchange="toggleTask(${t.id})">
    <div class="item-main"><div class="item-title">${escapeHTML(t.title)}</div><div class="item-meta">Due: ${niceDate(t.date)}</div></div>
    <span class="pill ${t.priority.toLowerCase()}">${t.priority}</span><button class="small-btn delete" onclick="deleteTask(${t.id})">Delete</button></div>`).join(''):'<div class="empty">No tasks found. Add a task to get started.</div>';
}
function renderExpenses(){
  $('expense-list').innerHTML=expenses.length?expenses.map(x=>`<div class="item"><div class="stat-icon orange">₹</div><div class="item-main"><div class="item-title">${escapeHTML(x.title)}</div><div class="item-meta">${escapeHTML(x.category)} · ${niceDate(x.date)}</div></div><b>${money(x.amount)}</b><button class="small-btn delete" onclick="deleteExpense(${x.id})">Delete</button></div>`).join(''):'<div class="empty">No expenses yet. Add your first expense above.</div>';
  $('expense-total-label').textContent='Total: '+money(expenses.reduce((s,x)=>s+x.amount,0));
}
function renderDashboard(){
  $('total-tasks').textContent=tasks.length;
  $('completed-tasks').textContent=tasks.filter(t=>t.done).length;
  const month=today.getMonth(),year=today.getFullYear();
  const monthSum=expenses.filter(x=>{const d=new Date(x.date+'T00:00:00');return d.getMonth()===month&&d.getFullYear()===year}).reduce((s,x)=>s+x.amount,0);
  $('month-expense').textContent=money(monthSum); $('total-expense').textContent=money(expenses.reduce((s,x)=>s+x.amount,0));
  const recent=tasks.slice(0,4);
  $('recent-tasks').className=recent.length?'':'empty';
  $('recent-tasks').innerHTML=recent.length?recent.map(t=>`<div class="item" style="border:0;border-bottom:1px solid #f0f0f5;border-radius:0;padding:12px 0"><span class="pill ${t.done?'low':''}">${t.done?'Done':'To do'}</span><div class="item-main"><div class="item-title">${escapeHTML(t.title)}</div><div class="item-meta">${niceDate(t.date)}</div></div></div>`).join(''):'No tasks yet. Add your first task!';
  const groups={};expenses.forEach(x=>groups[x.category]=(groups[x.category]||0)+x.amount);
  const total=Object.values(groups).reduce((a,b)=>a+b,0);
  $('expense-breakdown').className=total?'breakdown':'breakdown empty';
  $('expense-breakdown').innerHTML=total?Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><div class="bar-label"><span>${escapeHTML(k)}</span><b>${money(v)}</b></div><div class="bar"><span style="width:${Math.max(2,v/total*100)}%"></span></div></div>`).join(''):'No expenses recorded yet.';
}
function render(){renderTasks();renderExpenses();renderDashboard()}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
window.toggleTask=id=>{tasks=tasks.map(t=>t.id===id?{...t,done:!t.done}:t);save()};
window.deleteTask=id=>{if(confirm('Delete this task?')){tasks=tasks.filter(t=>t.id!==id);save()}};
window.deleteExpense=id=>{if(confirm('Delete this expense?')){expenses=expenses.filter(x=>x.id!==id);save()}};
render();
