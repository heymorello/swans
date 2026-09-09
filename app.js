const friends = [
  {id:'friend-01', name:'Эмберли и Джулия', image:'assets/friends/friend-01.png'},
  {id:'friend-02', name:'Лита и Уилл Джефферсон', image:'assets/friends/friend-02.png'},
  {id:'friend-03', name:'Владиона и Джаред Крин', image:'assets/friends/friend-03.png'},
  {id:'friend-04', name:'Кори и Белл Сезенс', image:'assets/friends/friend-04.png'},
  {id:'friend-05', name:'Лиария Спраут и Альт', image:'assets/friends/friend-05.png'},
  {id:'friend-06', name:'Гюго, Даррен и Грейс', image:'assets/friends/friend-06.png'},
  {id:'friend-07', name:'Энни и Женевьева', image:'assets/friends/friend-07.png'},
  {id:'friend-08', name:'Райто и Аделин Хаттори', image:'assets/friends/friend-08.png'}
];

const swans = [
  {id:'swan-01', name:'Лебедь 1', image:'assets/swans/swan-01.png'},
  {id:'swan-02', name:'Лебедь 2', image:'assets/swans/swan-02.png'},
  {id:'swan-03', name:'Лебедь 3', image:'assets/swans/swan-03.png'},
  {id:'swan-04', name:'Лебедь 4', image:'assets/swans/swan-04.png'},
  {id:'swan-05', name:'Лебедь 5', image:'assets/swans/swan-05.png'},
  {id:'swan-06', name:'Лебедь 6', image:'assets/swans/swan-06.png'},
  {id:'swan-07', name:'Лебедь 7', image:'assets/swans/swan-07.png'},
  {id:'swan-08', name:'Лебедь 8', image:'assets/swans/swan-08.png'}
];
const matches=new Map(); let selectedFriend=null, selectedSwan=null, drag=null;
const $=s=>document.querySelector(s), friendsEl=$('#friends'), swansEl=$('#swans'), statusEl=$('#status'), messageEl=$('#message');
function card(item,type){
 const el=document.createElement('button'); el.type='button'; el.className='card'; el.dataset.id=item.id; el.dataset.type=type;
 el.innerHTML=`<div class="visual"><img src="${item.image}" alt="${item.name}"><div class="placeholder">ВСТАВЬТЕ<br>ИЗОБРАЖЕНИЕ</div></div><div class="label">${item.name}</div>`;
 const img=el.querySelector('img'); img.onerror=()=>{img.style.display='none';el.querySelector('.placeholder').style.display='grid'}; el.querySelector('.placeholder').style.display='none';
 el.addEventListener('click',()=>select(type,item.id));
 el.addEventListener('pointerdown',e=>startDrag(e,el)); return el;
}
function render(){friendsEl.replaceChildren(...friends.map(x=>card(x,'friend'))); swansEl.replaceChildren(...swans.map(x=>card(x,'swan'))); updateCards(); updateStatus()}
function select(type,id){ if(type==='friend') selectedFriend=selectedFriend===id?null:id; else selectedSwan=selectedSwan===id?null:id; if(selectedFriend&&selectedSwan){assign(selectedFriend,selectedSwan);selectedFriend=selectedSwan=null} updateCards();updateStatus() }
function assign(f,s){if(APP_CONFIG.ONE_TO_ONE){matches.delete(f);for(const [oldF,oldS] of matches)if(oldS===s)matches.delete(oldF)}matches.set(f,s);updateCards();updateStatus()}
function updateCards(){document.querySelectorAll('.card').forEach(el=>{const{id,type}=el.dataset;const swan=type==='friend'?matches.get(id):[...matches.entries()].find(([,s])=>s===id)?.[0];el.classList.toggle('selected',(type==='friend'&&selectedFriend===id)||(type==='swan'&&selectedSwan===id));el.classList.toggle('matched',!!swan);el.querySelector('.match-badge')?.remove();if(swan){const name=type==='friend'?swans.find(s=>s.id===swan)?.name:friends.find(f=>f.id===swan)?.name;const b=document.createElement('div');b.className='match-badge';b.textContent=name||'';el.appendChild(b)}})}
function updateStatus(){statusEl.textContent=`${matches.size} / ${friends.length}`}
function startDrag(e,el){if(e.button!==undefined&&e.button!==0)return;drag={el,pointerId:e.pointerId,type:el.dataset.type,id:el.dataset.id,ghost:null,moved:false};el.setPointerCapture?.(e.pointerId);el.classList.add('dragging');document.body.classList.add('is-dragging');window.addEventListener('pointermove',moveDrag,{passive:false});window.addEventListener('pointerup',endDrag,{once:true});window.addEventListener('pointercancel',endDrag,{once:true});e.preventDefault()}
function moveDrag(e){if(!drag)return;e.preventDefault();if(!drag.moved){drag.moved=true;const r=drag.el.getBoundingClientRect();const g=drag.el.cloneNode(true);g.classList.add('drag-ghost');g.style.width=r.width+'px';g.style.height=r.height+'px';g.style.left=(e.clientX-r.width/2)+'px';g.style.top=(e.clientY-r.height/2)+'px';document.body.appendChild(g);drag.ghost=g}else{drag.ghost.style.left=(e.clientX-drag.ghost.offsetWidth/2)+'px';drag.ghost.style.top=(e.clientY-drag.ghost.offsetHeight/2)+'px'}document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.card');if(target&&target!==drag.el&&target.dataset.type!==drag.type)target.classList.add('drop-target')}
function endDrag(e){if(!drag)return;const d=drag;window.removeEventListener('pointermove',moveDrag);document.body.classList.remove('is-dragging');d.el.classList.remove('dragging');document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.card');if(d.moved&&target&&target!==d.el&&target.dataset.type!==d.type){const f=d.type==='friend'?d.id:target.dataset.id;const s=d.type==='swan'?d.id:target.dataset.id;assign(f,s)}d.ghost?.remove();drag=null}
function getPayload(){return{participant:($('#participantName').value||'Анонимный эксперт').trim().slice(0,40),submittedAt:new Date().toISOString(),matches:friends.map(f=>{const s=matches.get(f.id);return{friendId:f.id,friendName:f.name,swanId:s||null,swanName:swans.find(x=>x.id===s)?.name||null}})}}
async function submit(){messageEl.textContent='';const name=($('#participantName').value||'').trim();if(!name){messageEl.textContent='Сначала представьтесь экспертизе.';$('#participantName').focus();return}if(matches.size<friends.length){messageEl.textContent=`Экспертиза не завершена: соединено ${matches.size} из ${friends.length}.`;return}const btn=$('#submitBtn');btn.disabled=true;btn.textContent='ФИКСИРУЕМ ВЕРДИКТ…';const payload=getPayload();try{const endpoint=APP_CONFIG.STATS_ENDPOINT;if(!endpoint||endpoint.includes('PASTE_YOUR')){localStorage.setItem('lastVerdict',JSON.stringify(payload));showThanks('Демо-режим: URL статистики пока не подключён.');return}await fetch(endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});showThanks()}catch(err){console.error(err);messageEl.textContent='Не удалось отправить результат. Проверьте интернет и попробуйте ещё раз.';btn.disabled=false;btn.innerHTML='ПРЕДЪЯВИТЬ ВЕРДИКТ <span>→</span>'}}
function showThanks(extra=''){$('#matchingPanel').classList.add('hidden');$('.intro').classList.add('hidden');$('.submit-panel').classList.add('hidden');$('#thanks').classList.remove('hidden');if(extra)$('#thanks .small').textContent=extra;window.scrollTo({top:0,behavior:'smooth'})}
$('#submitBtn').addEventListener('click',submit);$('#againBtn').addEventListener('click',()=>{matches.clear();selectedFriend=selectedSwan=null;$('#thanks').classList.add('hidden');$('.intro').classList.remove('hidden');$('.submit-panel').classList.remove('hidden');$('#matchingPanel').classList.remove('hidden');render()});render();
