const FEES={Day:500,"Day-Night":750,Night:350};
const KEY="shyaam_library_pwa_v1";
let db=JSON.parse(localStorage.getItem(KEY)||'{"students":[],"payments":[]}');
const $=id=>document.getElementById(id), month=()=>new Date().toISOString().slice(0,7);
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function paid(id){return db.payments.filter(p=>p.studentId===id&&p.month===month()).reduce((n,p)=>n+Number(p.amount),0)}
function render(){
 $("count").textContent=db.students.length;
 $("collected").textContent="₹"+db.payments.filter(p=>p.month===month()).reduce((n,p)=>n+Number(p.amount),0);
 $("pending").textContent="₹"+db.students.reduce((n,s)=>n+Math.max(0,FEES[s.plan]-paid(s.id)),0);
 const q=$("search").value.toLowerCase();
 $("studentList").innerHTML=db.students.filter(s=>(s.name+" "+s.phone).toLowerCase().includes(q)).map(s=>`<div class="item"><div><strong>${esc(s.name)}</strong><div class="sub">${esc(s.plan)} · ₹${FEES[s.plan]} · Seat ${s.seat||"—"} · Paid ₹${paid(s.id)}</div></div><div><button onclick="editStudent('${s.id}')">Edit</button><button onclick="remind('${s.id}')">WhatsApp</button></div></div>`).join("")||'<p class="muted">No students added yet.</p>';
 $("feeStudent").innerHTML=db.students.map(s=>`<option value="${s.id}">${esc(s.name)} — ₹${FEES[s.plan]}</option>`).join("");
 $("feeList").innerHTML=db.students.map(s=>{let p=paid(s.id),due=Math.max(0,FEES[s.plan]-p);return `<div class="item"><div><strong>${esc(s.name)}</strong><div class="sub">Fee ₹${FEES[s.plan]} · Paid ₹${p}</div></div><b style="color:${due?'#a45d00':'#21834b'}">${due?'Due ₹'+due:'Paid'}</b></div>`}).join("")||'<p class="muted">No students yet.</p>';
 $("seatGrid").innerHTML=Array.from({length:50},(_,i)=>{let n=i+1,s=db.students.find(x=>Number(x.seat)===n);return `<div class="seat ${s?'busy':''}">${n}<br>${s?esc(s.name.split(" ")[0]):"Free"}</div>`}).join("");
 $("studentSeat").innerHTML='<option value="">No seat</option>'+Array.from({length:50},(_,i)=>`<option value="${i+1}">Seat ${i+1}</option>`).join("");
}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab,.panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
$("addBtn").onclick=()=>openStudent();$("cancelStudent").onclick=()=>$("studentDialog").close();$("search").oninput=render;
function openStudent(s={}){$("dialogTitle").textContent=s.id?"Edit student":"Add student";$("studentId").value=s.id||"";$("studentName").value=s.name||"";$("studentPhone").value=s.phone||"";$("studentPlan").value=s.plan||"Day";$("studentSeat").value=s.seat||"";$("studentDialog").showModal()}
window.editStudent=id=>openStudent(db.students.find(s=>s.id===id));
$("studentForm").onsubmit=e=>{e.preventDefault();let id=$("studentId").value||crypto.randomUUID(),name=$("studentName").value.trim(),phone=$("studentPhone").value.trim(),plan=$("studentPlan").value,seat=$("studentSeat").value;if(seat&&db.students.some(s=>s.seat===seat&&s.id!==id)){toast("That seat is already assigned");return}let old=db.students.find(s=>s.id===id);let obj={id,name,phone,plan,seat};if(old)Object.assign(old,obj);else db.students.push(obj);$("studentDialog").close();save();toast("Student saved")}
$("payBtn").onclick=()=>{let id=$("feeStudent").value,amount=Number($("feeAmount").value);if(!id||!amount||amount<1){toast("Choose a student and enter a valid amount");return}let s=db.students.find(x=>x.id===id);db.payments.push({id:crypto.randomUUID(),studentId:id,amount,month:month(),date:new Date().toISOString()});$("feeAmount").value="";save();$("receiptContent").innerHTML=`<h2>श्री Shyaam Library</h2><p>Fee payment receipt</p><hr><p>Student: <b>${esc(s.name)}</b></p><p>Month: ${month()}</p><p>Amount received: <b>₹${amount}</b></p><p>Total paid this month: ₹${paid(id)}</p><p>Remaining: ₹${Math.max(0,FEES[s.plan]-paid(id))}</p>`;$("receiptDialog").showModal()};
$("closeReceipt").onclick=()=>$("receiptDialog").close();$("printReceipt").onclick=()=>window.print();
window.remind=id=>{let s=db.students.find(x=>x.id===id),due=Math.max(0,FEES[s.plan]-paid(id));if(!s.phone){toast("Add the student's phone number first");return}if(!due){toast("No fee due for this month");return}let phone=s.phone.replace(/\D/g,"");if(phone.length===10)phone="91"+phone;let msg=`Hello ${s.name}, your library fee for ${month()} is ₹${FEES[s.plan]}. We have received ₹${paid(id)} and ₹${due} is pending. Please clear your dues. - श्री Shyaam Library`;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank")};
$("backupBtn").onclick=()=>{let blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`shyaam-library-backup-${month()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported")};
$("restoreBtn").onclick=()=>$("restoreFile").click();$("restoreFile").onchange=async e=>{try{let data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data.students)||!Array.isArray(data.payments))throw Error();if(confirm("Replace all current records with this backup?")){db=data;save();toast("Backup restored")}}catch{toast("Invalid backup file")}e.target.value=""};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();